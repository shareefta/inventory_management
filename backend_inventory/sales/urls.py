# sales/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalesChannelViewSet,
    SalesSectionViewSet,
    SectionProductPriceViewSet,
    SaleViewSet,
    SalesReturnViewSet,
    sales_stats
)

router = DefaultRouter()
router.register(r"channels", SalesChannelViewSet, basename="sales-channels")
router.register(r"sections", SalesSectionViewSet, basename="sales-sections")
router.register(r"prices", SectionProductPriceViewSet, basename="sales-prices")
router.register(r"sales", SaleViewSet, basename="sales")
router.register(r"sales-returns", SalesReturnViewSet, basename="sales-returns")

urlpatterns = [
    path('', include(router.urls)),
    path('sales-stats/', sales_stats, name='sales_stats'),
]