from django.contrib.auth.models import AbstractUser
from django.db import models


class BudgetBoxUser(AbstractUser):
    budget_id = models.CharField(max_length=255, unique=False, null=False, blank=False)
    username = None
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    clerk_user_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
