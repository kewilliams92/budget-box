from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Budget(models.Model):
    budget_box_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="budgets", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100, default="My Budget", blank=True)
    date = models.DateField()

    class Meta:
        unique_together = ("budget_box_user", "name", "date")
        ordering = ["-date"]

    def __str__(self):
        label = self.name or "My Budget"
        return f"{self.budget_box_user.email} - {label} ({self.date.strftime('%Y-%m')})"


class ExpenseStream(models.Model):
    budget = models.ForeignKey(
        Budget, related_name="expenses", on_delete=models.CASCADE
    )

    merchant_name = models.CharField(max_length=100)
    description = models.CharField(max_length=100)
    amount = models.DecimalField(
        max_digits=20, decimal_places=2, default=Decimal("0.00")
    )
    category = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.merchant_name}: ${self.amount}"


class IncomeStream(models.Model):
    budget = models.ForeignKey(
        Budget, related_name="incomes", on_delete=models.CASCADE
    )

    merchant_name = models.CharField(max_length=100)
    description = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(
        max_digits=20, decimal_places=2, 
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.01"))]
    )
    category = models.CharField(max_length=100, default="salary")

    class Meta:
        ordering = ["-id"]

    def clean(self):
        if self.amount <= 0:
            from django.core.exceptions import ValidationError
            raise ValidationError("Income amount must be positive")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.merchant_name}: +${self.amount}"
