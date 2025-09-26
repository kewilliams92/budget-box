from rest_framework import serializers

from .models import BankAccount, Transaction


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            "id",
            "plaid_account_id",
            "account_name",
            "account_type",
            "account_subtype",
            "mask",
            "institution_name",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TransactionSerializer(serializers.ModelSerializer):
    bank_account_name = serializers.CharField(
        source="bank_account.account_name", read_only=True
    )
    institution_name = serializers.CharField(
        source="bank_account.institution_name", read_only=True
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "amount",
            "merchant_name",
            "authorized_date",
            "date_paid",
            "category",
            "plaid_transaction_id",
            "bank_account",
            "bank_account_name",
            "institution_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "plaid_transaction_id", "created_at", "updated_at"]


class TransactionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating transaction details"""

    class Meta:
        model = Transaction
        fields = ["merchant_name", "category", "authorized_date", "date_paid"]


class TransactionApprovalSerializer(serializers.Serializer):
    """Serializer for approving a transaction to create an ExpenseStream entry"""

    transaction_id = serializers.IntegerField()
    description = serializers.CharField(
        max_length=100, required=False, allow_blank=True
    )
    # recurrence = serializers.BooleanField(required=False, default=False)

    def validate_transaction_id(self, value: int) -> int:
        if value <= 0:
            raise serializers.ValidationError(
                "Transaction ID must be a positive integer."
            )
        return value
