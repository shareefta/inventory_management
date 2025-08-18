# sales/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    SalesChannelViewSet,
    SalesSectionViewSet,
    SectionProductPriceViewSet,
    SaleViewSet,
    SalesReturnViewSet,
)

router = DefaultRouter()
router.register(r"channels", SalesChannelViewSet, basename="sales-channels")
router.register(r"sections", SalesSectionViewSet, basename="sales-sections")
router.register(r"prices", SectionProductPriceViewSet, basename="sales-prices")
router.register(r"sales", SaleViewSet, basename="sales")
router.register(r"sales-returns", SalesReturnViewSet, basename="sales-returns")

urlpatterns = router.urls