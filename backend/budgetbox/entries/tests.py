from datetime import date

from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.test import TestCase

from .models import Budget, ExpenseStream, IncomeStream


class BudgetTotalsTest(TestCase):
    def setUp(self):
        self.User = get_user_model()

    def test_budget_with_name_and_streams_totals(self):
        # Arrange: create user and budget named "vacation" for 2025-07
        user = self.User.objects.create(email="test@example.com", budget_id="b1")
        month = date(2025, 7, 1)
        budget = Budget.objects.create(budget_box_user=user, name="vacation", date=month)

        # Income: 2000 from work
        IncomeStream.objects.create(
            budget=budget,
            merchant_name="work",
            description="paycheck",
            amount=2000,
            category="salary",
        )

        # Expenses: -100, -200
        ExpenseStream.objects.create(
            budget=budget,
            merchant_name="groceries",
            description="weekly",
            amount=-100,
            category="expense",
        )
        ExpenseStream.objects.create(
            budget=budget,
            merchant_name="gas",
            description="fuel",
            amount=-200,
            category="expense",
        )

        # Act: compute totals like the view does
        income_total = budget.incomes.aggregate(total=Sum("amount")).get("total") or 0
        expense_total = budget.expenses.aggregate(total=Sum("amount")).get("total") or 0
        net_total = income_total + expense_total

        # Assert
        self.assertEqual(budget.name, "vacation")
        self.assertEqual(income_total, 2000)
        self.assertEqual(expense_total, -300)
        self.assertEqual(net_total, 1700)
