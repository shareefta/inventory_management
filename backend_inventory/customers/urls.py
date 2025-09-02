# customers/urls.py
from django.urls import path
from .views import CustomerListAPIView

urlpatterns = [
    path("customers_list/", CustomerListAPIView.as_view(), name="customer-list"),
]