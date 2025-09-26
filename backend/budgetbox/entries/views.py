from datetime import date, datetime
from decimal import Decimal

from budgetbox_project.decorators import clerk_auth_required
from django.contrib.auth import get_user_model
from django.utils.timezone import now
from rest_framework import status as s
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Budget, ExpenseStream, IncomeStream
from .serializers import (
    Budget_serializer,
    ExpanseStream_serializer,
    IncomeStream_serializer,
)
from django.db.models import Sum

User = get_user_model()


def _first_of_month(d: date) -> date:
    return d.replace(day=1)


def _parse_date_or_current_month(raw):
    """
    Accepts 'YYYY-MM' or 'YYYY-MM-DD' (as str). Defaults to current month.
    Returns first-of-month date.
    """
    if not raw:
        return _first_of_month(now().date())
    if isinstance(raw, date):
        return _first_of_month(raw)
    raw = str(raw)
    for fmt in ("%Y-%m-%d", "%Y-%m"):
        try:
            parsed = datetime.strptime(raw, fmt).date()
            return _first_of_month(parsed)
        except ValueError:
            continue
    return _first_of_month(now().date())


def _get_or_create_user(clerk_user_id: str) -> User:
    user, _ = User.objects.get_or_create(
        clerk_user_id=clerk_user_id,
        defaults={
            "email": f"user_{clerk_user_id}@example.com",
            "budget_id": clerk_user_id,
        },
    )
    return user


def _get_or_create_budget(user: User, month_date: date, name: str = "My Budget") -> Budget:
    return Budget.objects.get_or_create(
        budget_box_user=user, date=_first_of_month(month_date), name=name
    )[0]


class BudgetView(APIView):
    @clerk_auth_required
    def get(self, request):
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        month_param = request.query_params.get("date")
        name_param = request.query_params.get("name")
        month_date = _parse_date_or_current_month(month_param)

        budget = _get_or_create_budget(user, month_date, name_param or "My Budget")

        expense_streams = budget.expenses.all().order_by("id")
        income_streams = budget.incomes.all().order_by("id")

        expense_data = ExpanseStream_serializer(expense_streams, many=True).data
        income_data = IncomeStream_serializer(income_streams, many=True).data

        # NOTE: Add 'type' field to distinguish between income and expenses on frontend
        for stream in expense_data:
            stream["type"] = "expense"
        for stream in income_data:
            stream["type"] = "income"

        all_streams = list(expense_data) + list(income_data)

        income_total = income_streams.aggregate(total=Sum("amount")).get("total") or Decimal("0")
        expense_total = expense_streams.aggregate(total=Sum("amount")).get("total") or Decimal("0")
        net_total = (income_total or Decimal("0")) + (expense_total or Decimal("0"))

        return Response(
            {
                "budget": Budget_serializer(budget).data,
                "streams": all_streams,
                "expenses": expense_data,
                "incomes": income_data,
                "totals": {
                    "income": str(income_total or Decimal("0")),
                    "expenses": str(expense_total or Decimal("0")),
                    "net": str(net_total),
                },
            },
            status=s.HTTP_200_OK,
        )

    @clerk_auth_required
    def put(self, request):
        """
        Update a budget's name. Identify budget by `id` or `date` (YYYY-MM or YYYY-MM-DD).
        Payload: { id?: number, date?: string, name: string }
        """
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        budget_id = request.data.get("id")
        month_param = request.data.get("date")
        new_name = (request.data.get("name") or "").strip()
        if not new_name:
            return Response({"detail": "Missing 'name'"}, status=s.HTTP_400_BAD_REQUEST)

        budget: Budget | None = None
        if budget_id:
            try:
                budget = Budget.objects.select_related("budget_box_user").get(id=budget_id)
            except Budget.DoesNotExist:
                return Response({"detail": "Budget not found"}, status=s.HTTP_404_NOT_FOUND)
            if budget.budget_box_user_id != user.id:
                return Response({"detail": "Forbidden"}, status=s.HTTP_403_FORBIDDEN)
        else:
            month_date = _parse_date_or_current_month(month_param)
            budget = _get_or_create_budget(user, month_date, new_name)

        budget.name = new_name
        budget.save(update_fields=["name"])

        return Response(Budget_serializer(budget).data, status=s.HTTP_200_OK)

    @clerk_auth_required
    def delete(self, request):
        """
        Delete a budget and all its associated income/expense streams.
        Payload: { id: number }
        """
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        budget_id = request.data.get("id")
        if not budget_id:
            return Response({"detail": "Missing 'id'"}, status=s.HTTP_400_BAD_REQUEST)

        try:
            budget = Budget.objects.select_related("budget_box_user").get(id=budget_id)
        except Budget.DoesNotExist:
            return Response({"detail": "Budget not found"}, status=s.HTTP_404_NOT_FOUND)

        if budget.budget_box_user_id != user.id:
            return Response({"detail": "Forbidden"}, status=s.HTTP_403_FORBIDDEN)

        # NOTE: Get counts before deletion for response
        income_count = budget.incomes.count()
        expense_count = budget.expenses.count()
        
        budget_name = budget.name
        budget.delete()

        return Response({
            "detail": f"Budget '{budget_name}' deleted successfully",
            "deleted_streams": {
                "incomes": income_count,
                "expenses": expense_count,
                "total": income_count + expense_count
            }
        }, status=s.HTTP_200_OK)


class BudgetListView(APIView):
    @clerk_auth_required
    def get(self, request):
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        budgets = Budget.objects.filter(budget_box_user=user).order_by("-date")
        data = [
            {
                "id": b.id,
                "name": b.name,
                "date": b.date.isoformat(),
                "label": f"{b.name or 'Budget'} - {b.date.strftime('%Y-%m')}",
            }
            for b in budgets
        ]
        return Response({"budgets": data}, status=s.HTTP_200_OK)


class IncomeStreamView(APIView):
    @clerk_auth_required
    def post(self, request):
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        budget_id = request.data.get("budget_id")
        if budget_id:
            try:
                budget = Budget.objects.get(id=budget_id, budget_box_user=user)
            except Budget.DoesNotExist:
                return Response({"detail": "Budget not found"}, status=s.HTTP_404_NOT_FOUND)
        else:
            month_date = _parse_date_or_current_month(request.data.get("date"))
            budget = _get_or_create_budget(user, month_date)

        merchant_name = request.data.get("merchant_name", "")
        description = request.data.get("description", "")
        amount = request.data.get("amount", 0)

        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response({"detail": "Invalid amount"}, status=s.HTTP_400_BAD_REQUEST)

        if amount < 0:
            amount = -amount

        stream = IncomeStream.objects.create(
            budget=budget,
            merchant_name=merchant_name,
            description=description,
            amount=amount,
            category=request.data.get("category", "salary"),
        )
        return Response(IncomeStream_serializer(stream).data, status=s.HTTP_201_CREATED)

    @clerk_auth_required
    def put(self, request):
        """
        Payload must include: id
        Optional fields to update: merchant_name, description, amount, category, recurrence
        """
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        stream_id = request.data.get("id")
        if not stream_id:
            return Response(
                {"detail": "Missing 'id' for stream"}, status=s.HTTP_400_BAD_REQUEST
            )

        try:
            stream = IncomeStream.objects.select_related(
                "budget", "budget__budget_box_user"
            ).get(id=stream_id)
        except IncomeStream.DoesNotExist:
            return Response({"detail": "Stream not found"}, status=s.HTTP_404_NOT_FOUND)

        if stream.budget.budget_box_user_id != user.id:
            return Response({"detail": "Forbidden"}, status=s.HTTP_403_FORBIDDEN)

        updatable = ["merchant_name", "description", "amount", "category"]
        for field in updatable:
            if field in request.data:
                if field == "amount":
                    try:
                        val = Decimal(str(request.data["amount"]))
                        if val < 0:
                            val = -val
                    except Exception:
                        return Response(
                            {"detail": "Invalid amount"}, status=s.HTTP_400_BAD_REQUEST
                        )
                    setattr(stream, field, val)
                else:
                    setattr(stream, field, request.data[field])

        stream.save(update_fields=updatable)
        return Response(IncomeStream_serializer(stream).data, status=s.HTTP_200_OK)

    @clerk_auth_required
    def delete(self, request):
        """Delete an income stream"""
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        stream_id = request.data.get("id")

        if not stream_id:
            return Response(
                {"detail": "Missing 'id' for stream"}, status=s.HTTP_400_BAD_REQUEST
            )

        try:
            stream = IncomeStream.objects.select_related(
                "budget", "budget__budget_box_user"
            ).get(id=stream_id)
        except IncomeStream.DoesNotExist:
            return Response({"detail": "Stream not found"}, status=s.HTTP_404_NOT_FOUND)

        if stream.budget.budget_box_user_id != user.id:
            return Response({"detail": "Forbidden"}, status=s.HTTP_403_FORBIDDEN)

        stream_info = {
            "id": stream.id,
            "merchant_name": stream.merchant_name,
            "description": stream.description,
            "amount": str(stream.amount),
            "category": stream.category,
        }

        stream.delete()

        return Response(
            {
                "message": "Income stream deleted successfully",
                "deleted_stream": stream_info,
            },
            status=s.HTTP_200_OK,
        )


class ExpenseStreamView(APIView):
    @clerk_auth_required
    def post(self, request):
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        budget_id = request.data.get("budget_id")
        if budget_id:
            try:
                budget = Budget.objects.get(id=budget_id, budget_box_user=user)
            except Budget.DoesNotExist:
                return Response({"detail": "Budget not found"}, status=s.HTTP_404_NOT_FOUND)
        else:
            month_date = _parse_date_or_current_month(request.data.get("date"))
            budget = _get_or_create_budget(user, month_date)

        merchant_name = request.data.get("merchant_name", "")
        description = request.data.get("description", "")
        amount = request.data.get("amount", 0)

        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response({"detail": "Invalid amount"}, status=s.HTTP_400_BAD_REQUEST)

        if amount > 0:
            amount = -amount

        stream = ExpenseStream.objects.create(
            budget=budget,
            merchant_name=merchant_name,
            description=description,
            amount=amount,
            category="expense",
        )
        return Response(
            ExpanseStream_serializer(stream).data, status=s.HTTP_201_CREATED
        )

    @clerk_auth_required
    def put(self, request):
        """
        Payload must include: id
        Optional fields to update: merchant_name, description, amount, category, recurrence
        """
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        stream_id = request.data.get("id")
        if not stream_id:
            return Response(
                {"detail": "Missing 'id' for stream"}, status=s.HTTP_400_BAD_REQUEST
            )

        try:
            stream = ExpenseStream.objects.select_related(
                "budget", "budget__budget_box_user"
            ).get(id=stream_id)
        except ExpenseStream.DoesNotExist:
            return Response({"detail": "Stream not found"}, status=s.HTTP_404_NOT_FOUND)

        if stream.budget.budget_box_user_id != user.id:
            return Response({"detail": "Forbidden"}, status=s.HTTP_403_FORBIDDEN)

        updatable = ["merchant_name", "description", "amount", "category"]
        for field in updatable:
            if field in request.data:
                if field == "amount":
                    try:
                        val = Decimal(str(request.data["amount"]))
                        if val > 0:
                            val = -val
                    except Exception:
                        return Response(
                            {"detail": "Invalid amount"}, status=s.HTTP_400_BAD_REQUEST
                        )
                    setattr(stream, field, val)
                else:
                    setattr(stream, field, request.data[field])

        stream.save(update_fields=updatable)
        return Response(ExpanseStream_serializer(stream).data, status=s.HTTP_200_OK)

    @clerk_auth_required
    def delete(self, request):
        """Delete an expense stream"""
        clerk_user_id = request.clerk_user_id
        user = _get_or_create_user(clerk_user_id)

        stream_id = request.data.get("id")

        if not stream_id:
            return Response(
                {"detail": "Missing 'id' for stream"}, status=s.HTTP_400_BAD_REQUEST
            )

        try:
            stream = ExpenseStream.objects.select_related(
                "budget", "budget__budget_box_user"
            ).get(id=stream_id)
        except ExpenseStream.DoesNotExist:
            return Response({"detail": "Stream not found"}, status=s.HTTP_404_NOT_FOUND)

        if stream.budget.budget_box_user_id != user.id:
            return Response({"detail": "Forbidden"}, status=s.HTTP_403_FORBIDDEN)

        stream_info = {
            "id": stream.id,
            "merchant_name": stream.merchant_name,
            "description": stream.description,
            "amount": str(stream.amount),
            "category": stream.category,
        }

        stream.delete()

        return Response(
            {
                "message": "Expense stream deleted successfully",
                "deleted_stream": stream_info,
            },
            status=s.HTTP_200_OK,
        )
