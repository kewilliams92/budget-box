from rest_framework import serializers

from .models import Budget, ExpenseStream, IncomeStream


class Budget_serializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = "__all__"


class ExpanseStream_serializer(serializers.ModelSerializer):  
    class Meta:
        model = ExpenseStream
        fields = "__all__"


class IncomeStream_serializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeStream
        fields = "__all__"
