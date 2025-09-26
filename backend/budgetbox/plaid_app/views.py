import plaid
from budgetbox_project.decorators import clerk_auth_required
from budgetbox_project.settings import PLAID_CLIENT_ID, PLAID_SANDBOX_KEY
from clerk_app.models import BudgetBoxUser
from django.contrib.auth import get_user_model
from django.utils import timezone
from entries.models import Budget, ExpenseStream
from plaid.api import plaid_api
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import \
    ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import \
    LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_refresh_request import TransactionsRefreshRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.item_remove_request import ItemRemoveRequest
from rest_framework import status as s
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (BankAccount, Transaction, create_bank_account_from_plaid,
                     create_transaction_from_plaid,
                     delete_transaction_from_plaid,
                     update_transaction_from_plaid)
from .serializers import (TransactionApprovalSerializer, TransactionSerializer,
                          TransactionUpdateSerializer)

User = get_user_model()

configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,
    api_key={
        "clientId": PLAID_CLIENT_ID,
        "secret": PLAID_SANDBOX_KEY,
    },
)
api_client = plaid.ApiClient(configuration)
plaid_client = plaid_api.PlaidApi(api_client)


class CreateLinkToken(APIView):

    @clerk_auth_required
    def post(self, request):
        try:
            user, created = User.objects.get_or_create(
                clerk_user_id=request.clerk_user_id,
                defaults={
                    "email": f"{request.clerk_user_id}@example.com"
                },
            )

            link_request = LinkTokenCreateRequest(
                products=[Products("transactions")],
                client_name="BudgetBox",
                country_codes=[CountryCode("US")],
                language="en",
                user=LinkTokenCreateRequestUser(client_user_id=str(user.id)),
            )

            response = plaid_client.link_token_create(link_request)
            link_token = response["link_token"]

            return Response(
                {"link_token": link_token, "message": "Link token created successfully"}
            )

        except Exception as e:
            return Response({"error": str(e)}, status=s.HTTP_400_BAD_REQUEST)


class ExchangePublicToken(APIView):
    @clerk_auth_required
    def post(self, request):
        try:
            public_token = request.data.get("public_token")

            if not public_token:
                return Response(
                    {"error": "public_token is required"}, status=s.HTTP_400_BAD_REQUEST
                )

            exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)
            response = plaid_client.item_public_token_exchange(exchange_request)
            access_token = response["access_token"]
            item_id = response['item_id']

            accounts_request = AccountsGetRequest(access_token=access_token)
            accounts_response = plaid_client.accounts_get(accounts_request)
            accounts_data = accounts_response['accounts']

            institution_name = accounts_response.get('item', {}).get('institution_name', 'Unknown Bank')

            user = User.objects.get(clerk_user_id=request.clerk_user_id)

            created_accounts = []
            existing_accounts = []

            for account_data in accounts_data:
                account_data['item_id'] = item_id
                
                existing_account = BankAccount.objects.filter(
                    plaid_account_id=account_data['account_id']
                ).first()
                
                if not existing_account:
                    bank_account = create_bank_account_from_plaid(
                        user, account_data, access_token, institution_name
                    )
                    
                    created_accounts.append({
                        'id': bank_account.id,
                        'account_name': bank_account.account_name,
                        'account_type': str(bank_account.account_type),
                        'account_subtype': str(bank_account.account_subtype),
                        'mask': bank_account.mask,
                        'institution_name': bank_account.institution_name
                    })
                else:
                    existing_accounts.append({
                        'id': existing_account.id,
                        'account_name': existing_account.account_name,
                        'message': 'Already connected'
                    })

            return Response({
                'message': f'Successfully processed {len(accounts_data)} accounts',
                'created_accounts': created_accounts,
                'existing_accounts': existing_accounts,
                'total_new': len(created_accounts),
                'total_existing': len(existing_accounts)
            })
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=s.HTTP_400_BAD_REQUEST)

class GetTransactions(APIView):
    @clerk_auth_required
    def get(self, request):
        try:
            user = BudgetBoxUser.objects.get(clerk_user_id=request.clerk_user_id)
            bank_accounts = user.bank_accounts.filter(is_active=True)

            if not bank_accounts.exists():
                return Response(
                    {"error": "No bank account linked. Please link an account first."},
                    status=400
                )

            all_created_transactions = []

            for bank_account in bank_accounts:
                if not bank_account.plaid_access_token:
                    continue

                try:
                    cursor = bank_account.sync_cursor or ""
                    
                    added = []
                    modified = []
                    removed = []
                    has_more = True

                    while has_more:
                        sync_request = TransactionsSyncRequest(
                            access_token=bank_account.plaid_access_token,
                            cursor=cursor,
                            count=500
                        )
                        
                        response = plaid_client.transactions_sync(sync_request)
                        
                        added.extend(response.get('added', []))
                        modified.extend(response.get('modified', []))
                        removed.extend(response.get('removed', []))
                        
                        has_more = response.get('has_more', False)
                        cursor = response.get('next_cursor')
                    
                    for transaction_data in added:
                        transaction, created = create_transaction_from_plaid(
                            user, bank_account, transaction_data
                        )
                        
                        if created:
                            all_created_transactions.append({
                                "id": transaction.id,
                                "merchant_name": transaction.merchant_name,
                                "amount": str(transaction.amount),
                                "authorized_date": str(transaction.authorized_date),
                                "date_paid": str(transaction.date_paid) if transaction.date_paid else None,
                                "category": transaction.category,
                                "account": bank_account.account_name,
                            })

                    for transaction_data in modified:
                        existing_transaction = Transaction.objects.filter(
                            plaid_transaction_id=transaction_data['transaction_id']
                        ).first()
                        
                        if existing_transaction:
                            update_transaction_from_plaid(existing_transaction, transaction_data)

                    for removed_data in removed:
                        delete_transaction_from_plaid(removed_data['transaction_id'])

                    bank_account.sync_cursor = cursor
                    bank_account.last_synced = timezone.now()
                    bank_account.save()

                except Exception as account_error:
                    continue

            return Response({
                "message": f"Created {len(all_created_transactions)} new transactions",
                "transactions": all_created_transactions,
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)

class Transactions(APIView):
    @clerk_auth_required
    def get(self, request):
        try:
            user = User.objects.get(clerk_user_id=request.clerk_user_id)
            
            limit = int(request.query_params.get('limit', 10))
            category = request.query_params.get('category')
            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            
            transactions = user.transactions.all()
            
            if category:
                transactions = transactions.filter(category__icontains=category)
            
            if date_from:
                transactions = transactions.filter(authorized_date__gte=date_from)
            
            if date_to:
                transactions = transactions.filter(authorized_date__lte=date_to)
            
            transactions = transactions[:limit]
            
            serializer = TransactionSerializer(transactions, many=True)
            
            return Response({
                "transactions": serializer.data,
                "count": len(serializer.data)
            })
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=s.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=s.HTTP_400_BAD_REQUEST
            )

    @clerk_auth_required
    def post(self, request):
        try:
            user = User.objects.get(clerk_user_id=request.clerk_user_id)
            
            serializer = TransactionApprovalSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {"error": serializer.errors}, 
                    status=s.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            transaction_id = validated_data['transaction_id']
            description = validated_data.get('description', '')
            
            try:
                transaction = Transaction.objects.get(id=transaction_id, user=user)
            except Transaction.DoesNotExist:
                return Response(
                    {"error": "Transaction not found or access denied"}, 
                    status=s.HTTP_404_NOT_FOUND
                )
            
            transaction_date = transaction.authorized_date or transaction.date_paid
            if not transaction_date:
                return Response(
                    {"error": "Transaction has no valid date"}, 
                    status=s.HTTP_400_BAD_REQUEST
                )
            
            budget = None
            budget_id = request.data.get('budget_id')
            budget_date_param = request.data.get('budget_date') or request.data.get('date')
            if budget_id:
                try:
                    budget = Budget.objects.get(id=budget_id, budget_box_user=user)
                except Budget.DoesNotExist:
                    return Response({"error": "Budget not found"}, status=s.HTTP_404_NOT_FOUND)
            elif budget_date_param:
                from datetime import datetime as _dt
                parsed = None
                for fmt in ("%Y-%m", "%Y-%m-%d"):
                    try:
                        parsed = _dt.strptime(str(budget_date_param), fmt).date()
                        break
                    except ValueError:
                        continue
                if not parsed:
                    return Response({"error": "Invalid budget_date format"}, status=s.HTTP_400_BAD_REQUEST)
                budget_date = parsed.replace(day=1)
                budget, _ = Budget.objects.get_or_create(budget_box_user=user, date=budget_date)
            else:
                budget_date = transaction_date.replace(day=1)
                budget, _ = Budget.objects.get_or_create(budget_box_user=user, date=budget_date)
            
            expense_amount = -abs(transaction.amount)
            
            expense_stream = ExpenseStream.objects.create(
                budget=budget,
                merchant_name=transaction.merchant_name,
                description=description if description else transaction.merchant_name,
                amount=expense_amount,
                category=transaction.category,
            )
            
            return Response({
                "message": "Transaction approved and added to budget successfully",
                "expense_stream": {
                    "id": expense_stream.id,
                    "merchant_name": expense_stream.merchant_name,
                    "description": expense_stream.description,
                    "amount": str(expense_stream.amount),
                    "category": expense_stream.category,
                    "budget_month": budget.date.strftime('%Y-%m'),
                    "budget_id": budget.id,
                },
                "original_transaction": {
                    "id": transaction.id,
                    "merchant_name": transaction.merchant_name,
                    "amount": str(transaction.amount),
                    "date": str(transaction_date)
                }
            }, status=s.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=s.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=s.HTTP_400_BAD_REQUEST
            )

    @clerk_auth_required
    def put(self, request):
        try:
            user = User.objects.get(clerk_user_id=request.clerk_user_id)
            transaction_id = request.data.get('id')
            
            if not transaction_id:
                return Response(
                    {"error": "Transaction ID is required"}, 
                    status=s.HTTP_400_BAD_REQUEST
                )
            
            try:
                transaction = Transaction.objects.get(id=transaction_id, user=user)
            except Transaction.DoesNotExist:
                return Response(
                    {"error": "Transaction not found or access denied"}, 
                    status=s.HTTP_404_NOT_FOUND
                )
            
            serializer = TransactionUpdateSerializer(transaction, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(
                    {"error": serializer.errors}, 
                    status=s.HTTP_400_BAD_REQUEST
                )
            
            updated_transaction = serializer.save()
            
            response_serializer = TransactionSerializer(updated_transaction)
            return Response({
                "message": "Transaction updated successfully",
                "transaction": response_serializer.data
            })
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=s.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=s.HTTP_400_BAD_REQUEST
            )

    @clerk_auth_required
    def delete(self, request):
        try:
            user = User.objects.get(clerk_user_id=request.clerk_user_id)
            transaction_id = request.data.get('id')
            
            if not transaction_id:
                return Response(
                    {"error": "Transaction ID is required"}, 
                    status=s.HTTP_400_BAD_REQUEST
                )
            
            try:
                transaction = Transaction.objects.get(id=transaction_id, user=user)
            except Transaction.DoesNotExist:
                return Response(
                    {"error": "Transaction not found or access denied"}, 
                    status=s.HTTP_404_NOT_FOUND
                )
            
            transaction_info = {
                "id": transaction.id,
                "merchant_name": transaction.merchant_name,
                "amount": str(transaction.amount)
            }
            
            transaction.delete()
            
            return Response({
                "message": "Transaction deleted successfully",
                "deleted_transaction": transaction_info
            }, status=s.HTTP_204_NO_CONTENT)
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=s.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=s.HTTP_400_BAD_REQUEST
            )

class RefreshTransactions(APIView):
    @clerk_auth_required
    def get(self, request):
        try:
            user = User.objects.get(clerk_user_id=request.clerk_user_id)

            bank_accounts = user.bank_accounts.filter(is_active=True)

            if not bank_accounts.exists():
                return Response(
                    {"error": "No bank account linked. Please link an account first."}, 
                    status=s.HTTP_400_BAD_REQUEST
                )
            
            all_new_transactions = []
            refresh_errors = []

            for bank_account in bank_accounts:
                if not bank_account.plaid_access_token:
                    continue

                try:
                    refresh_request = TransactionsRefreshRequest(
                        access_token=bank_account.plaid_access_token
                    )
                    plaid_client.transactions_refresh(refresh_request)
                    
                    cursor = bank_account.sync_cursor or ""
                    
                    added = []
                    modified = []
                    removed = []
                    has_more = True
                    page_count = 0

                    while has_more:
                        page_count += 1
                        
                        sync_request = TransactionsSyncRequest(
                            access_token=bank_account.plaid_access_token,
                            cursor=cursor,
                            count=500
                        )
                        
                        response = plaid_client.transactions_sync(sync_request)
                        
                        page_added = response.get('added', [])
                        page_modified = response.get('modified', [])
                        page_removed = response.get('removed', [])
                        
                        added.extend(page_added)
                        modified.extend(page_modified)
                        removed.extend(page_removed)
                        
                        has_more = response.get('has_more', False)
                        cursor = response.get('next_cursor')

                    for i, transaction_data in enumerate(added, 1):
                        transaction, created = create_transaction_from_plaid(
                            user, bank_account, transaction_data
                        )
                        
                        if created:
                            all_new_transactions.append({
                                "id": transaction.id,
                                "merchant_name": transaction.merchant_name,
                                "amount": str(transaction.amount),
                                "authorized_date": str(transaction.authorized_date),
                                "date_paid": str(transaction.date_paid) if transaction.date_paid else None,
                                "category": transaction.category,
                                "account": bank_account.account_name,
                                "is_new": True
                            })

                    for i, transaction_data in enumerate(modified, 1):
                        existing_transaction = Transaction.objects.filter(
                            plaid_transaction_id=transaction_data['transaction_id']
                        ).first()
                        
                        if existing_transaction:
                            update_transaction_from_plaid(existing_transaction, transaction_data)

                    for i, removed_data in enumerate(removed, 1):
                        delete_transaction_from_plaid(removed_data['transaction_id'])

                    bank_account.sync_cursor = cursor
                    bank_account.last_synced = timezone.now()
                    bank_account.save()

                except Exception as account_error:
                    error_msg = f"Error refreshing {bank_account.account_name}: {str(account_error)}"
                    refresh_errors.append(error_msg)
                    continue

            all_new_transactions.sort(key=lambda x: x.get("date_paid") or x.get("authorized_date"), reverse=True)

            response_data = {
                "message": f"Refresh complete. Found {len(all_new_transactions)} new transactions.",
                "transactions": all_new_transactions,
                "count": len(all_new_transactions)
            }
            
            if refresh_errors:
                response_data["warnings"] = refresh_errors

            return Response(response_data)
        
        except Exception as e:
            return Response({"error": str(e)}, status=s.HTTP_400_BAD_REQUEST)


class UnlinkBankAccount(APIView):
    @clerk_auth_required
    def post(self, request):
        try:
            user = User.objects.get(clerk_user_id=request.clerk_user_id)
            
            bank_accounts = user.bank_accounts.filter(is_active=True)
            
            if not bank_accounts.exists():
                return Response(
                    {"error": "No bank accounts linked to unlink."},
                    status=s.HTTP_404_NOT_FOUND
                )
            
            removed_accounts = []
            removed_transactions_count = 0
            plaid_errors = []
            
            for bank_account in bank_accounts:
                try:
                    if bank_account.plaid_access_token:
                        try:
                            remove_request = ItemRemoveRequest(
                                access_token=bank_account.plaid_access_token
                            )
                            plaid_client.item_remove(remove_request)
                        except Exception as plaid_error:
                            error_msg = f"Failed to remove Plaid item for {bank_account.account_name}: {str(plaid_error)}"
                            plaid_errors.append(error_msg)
                    
                    transaction_count = bank_account.transactions.count()
                    removed_transactions_count += transaction_count
                    
                    bank_account.transactions.all().delete()
                    
                    account_info = {
                        "id": bank_account.id,
                        "account_name": bank_account.account_name,
                        "institution_name": bank_account.institution_name,
                        "mask": bank_account.mask,
                        "transactions_removed": transaction_count
                    }
                    removed_accounts.append(account_info)
                    
                    bank_account.delete()
                    
                except Exception as account_error:
                    error_msg = f"Error processing {bank_account.account_name}: {str(account_error)}"
                    plaid_errors.append(error_msg)
                    continue
            
            response_data = {
                "message": f"Successfully unlinked {len(removed_accounts)} bank account(s)",
                "removed_accounts": removed_accounts,
                "total_transactions_removed": removed_transactions_count,
                "total_accounts_removed": len(removed_accounts)
            }
            
            if plaid_errors:
                response_data["warnings"] = plaid_errors
                response_data["message"] += f" (with {len(plaid_errors)} warning(s))"
            
            return Response(response_data, status=s.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=s.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=s.HTTP_400_BAD_REQUEST)
