from django.urls import path

from .views import BudgetView, ExpenseStreamView, IncomeStreamView, BudgetListView

urlpatterns = [
    path("budget/", BudgetView.as_view(), name="budget"),
    path("budgets/", BudgetListView.as_view(), name="budget-list"),
    path("income-stream/", IncomeStreamView.as_view(), name="incomestream"),
    path("expense-stream/", ExpenseStreamView.as_view(), name="expensestream"),
]
