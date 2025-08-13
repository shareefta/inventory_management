# sales/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import SalesChannel, SalesSection, SectionProductPrice, Sale
from .serializers import (
    SalesChannelSerializer,
    SalesSectionSerializer,
    SectionProductPriceSerializer,
    SaleSerializer,
)
from products.models import Product


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(request.user and request.user.is_staff)


class SalesChannelViewSet(viewsets.ModelViewSet):
    queryset = SalesChannel.objects.all().order_by("name")
    serializer_class = SalesChannelSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]


class SalesSectionViewSet(viewsets.ModelViewSet):
    queryset = SalesSection.objects.select_related("channel", "location").all()
    serializer_class = SalesSectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        channel_id = self.request.query_params.get("channel_id")
        channel_name = self.request.query_params.get("channel")
        if channel_id:
            qs = qs.filter(channel_id=channel_id)
        if channel_name:
            qs = qs.filter(channel__name__iexact=channel_name)
        return qs.order_by("channel__name", "name")


class SectionProductPriceViewSet(viewsets.ModelViewSet):
    queryset = SectionProductPrice.objects.select_related("section", "product").all()
    serializer_class = SectionProductPriceSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        section_id = self.request.query_params.get("section_id")
        if section_id:
            qs = qs.filter(section_id=section_id)
        return qs

    @action(detail=False, methods=["post"], url_path="bulk-set")
    def bulk_set(self, request):
        """
        Bulk set/update per-section prices.

        Body:
        {
          "section": 123,
          "items": [
            {"product": 1, "price": "12.50"},
            {"product": 2, "price": "9.99"}
          ]
        }
        """
        section = request.data.get("section")
        items = request.data.get("items", [])
        if not section or not isinstance(items, list):
            return Response({"detail": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)

        created, updated = 0, 0
        for row in items:
            product = row.get("product")
            price = row.get("price")
            if not product or price is None:
                continue
            obj, was_created = SectionProductPrice.objects.update_or_create(
                section_id=section, product_id=product, defaults={"price": price}
            )
            created += int(was_created)
            updated += int(not was_created)

        return Response({"created": created, "updated": updated})

    @action(detail=False, methods=["get"], url_path="lookup")
    def lookup(self, request):
        """
        Get per-section price for a product (by product id or barcode).

        /api/sales/prices/lookup/?section_id=1&product=5
        /api/sales/prices/lookup/?section_id=1&barcode=ABC12345
        """
        section_id = request.query_params.get("section_id")
        product_id = request.query_params.get("product")
        barcode = request.query_params.get("barcode")

        if not section_id:
            return Response({"detail": "section_id is required"}, status=400)

        if not (product_id or barcode):
            return Response({"detail": "Send product id or barcode"}, status=400)

        if barcode:
            prod = Product.objects.filter(unique_id=barcode).first()
            if not prod:
                return Response({"detail": "Product not found for barcode"}, status=404)
            product_id = prod.id

        spp = SectionProductPrice.objects.filter(section_id=section_id, product_id=product_id).first()
        if not spp:
            return Response({"detail": "Price not found for this section/product"}, status=404)

        return Response({"product": int(product_id), "section": int(section_id), "price": str(spp.price)})
    

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related("channel", "section", "created_by").prefetch_related("items")
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # created_by & sale_datetime handled in serializer.create (using request.user & default)
        serializer.context["request"] = self.request
        serializer.save()
