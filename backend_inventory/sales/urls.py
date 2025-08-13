# sales/urls.py
from rest_framework.routers import DefaultRouter
from .views import SalesChannelViewSet, SalesSectionViewSet, SectionProductPriceViewSet, SaleViewSet

router = DefaultRouter()
router.register(r"channels", SalesChannelViewSet, basename="sales-channels")
router.register(r"sections", SalesSectionViewSet, basename="sales-sections")
router.register(r"prices", SectionProductPriceViewSet, basename="sales-prices")
router.register(r"sales", SaleViewSet, basename="sales")

urlpatterns = router.urls
