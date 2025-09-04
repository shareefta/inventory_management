# customers/urls.py
from django.urls import path
from .views import CustomerListAPIView, WalletOperationAPIView, customer_wallet_balance

urlpatterns = [
    path("customers_list/", CustomerListAPIView.as_view(), name="customers-list"),
    path("<int:pk>/wallet/<str:action>/", WalletOperationAPIView.as_view(), name="wallet-operation"),
    path("<int:pk>/wallet/balance/", customer_wallet_balance, name="wallet-balance"),
]