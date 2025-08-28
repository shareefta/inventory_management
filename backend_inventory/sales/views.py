# sales/views.py
from rest_framework import viewsets, permissions, status, parsers
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework import serializers
from django.db import transaction
from django.db.models import F, Sum
from decimal import Decimal
from products.models import ProductLocation
from customers.models import WalletTransaction
from .models import SalesChannel, SalesSection, SectionProductPrice, Sale, SaleItem, SalesReturn, SalesReturnItem, round_to_last_digit_5
from .serializers import (
    SalesChannelSerializer,
    SalesSectionSerializer,
    SectionProductPriceSerializer,
    SaleSerializer, SalesReturnSerializer
)
from products.models import Product
from django.utils.timezone import now
from calendar import monthrange
from datetime import date

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
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

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
        sections = request.data.get("sections")
        items = request.data.get("items", [])

        if isinstance(sections, int):
            sections = [sections]
        elif not isinstance(sections, list) or not all(isinstance(s, int) for s in sections):
            return Response({"detail": "Invalid sections"}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(items, list):
            return Response({"detail": "Invalid items"}, status=status.HTTP_400_BAD_REQUEST)

        created, updated = 0, 0
        for section_id in sections:
            for row in items:
                product = row.get("product")
                price = row.get("price", None)

                if not product:
                    continue

                # Do NOT round manual prices; save as-is
                selling_price = Decimal(price) if price is not None else None

                obj, was_created = SectionProductPrice.objects.update_or_create(
                    section_id=section_id,
                    product_id=product,
                    defaults={
                        "selling_price": selling_price,
                        "is_manual": price is not None,
                    },
                )
                created += int(was_created)
                updated += int(not was_created)

        return Response({"created": created, "updated": updated})

    @action(detail=False, methods=["get"], url_path="lookup")
    def lookup(self, request):
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
        else:
            prod = Product.objects.filter(id=product_id).first()

        spp = SectionProductPrice.objects.filter(section_id=section_id, product_id=product_id).first()
        if spp:
            return Response({
                "product": int(product_id),
                "section": int(section_id),
                "price": float(spp.final_price),
                "is_manual": spp.is_manual,
            })

        # If no SectionProductPrice exists → fallback to auto
        if prod:
            auto_price = round_to_last_digit_5(prod.rate * Decimal("1.2"))
            return Response({
                "product": int(product_id),
                "section": int(section_id),
                "price": float(auto_price),
                "is_manual": False,
            })

        return Response({"detail": "Price not found for this section/product"}, status=404)   
    
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related("channel", "section", "created_by").prefetch_related("items")
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        read_serializer = SaleSerializer(sale)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

class SalesReturnViewSet(viewsets.ModelViewSet):
    """
    CRUD API for SalesReturn and associated items.
    """
    queryset = SalesReturn.objects.select_related("sale", "customer", "created_by").prefetch_related("items")
    serializer_class = SalesReturnSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sale = serializer.validated_data["sale"]
        customer = serializer.validated_data.get("customer") or sale.customer
        refund_mode = serializer.validated_data.get("refund_mode", "cash")
        refund_to_wallet = refund_mode == "wallet"
        items_data = serializer.validated_data["items_write"]

        total_refund = Decimal("0.00")
        return_items = []

        # --- Calculate total refund and prepare items ---
        total_sale_before_discount = sum(i.price * i.quantity for i in sale.items.all())
        discount_ratio = (sale.discount / total_sale_before_discount) if total_sale_before_discount else Decimal("0")

        for item in items_data:
            sale_item = SaleItem.objects.get(id=item["sale_item"])
            qty = Decimal(item["quantity"])

            # Ensure not returning more than sold minus already returned
            total_returned = (
                SalesReturnItem.objects.filter(sale_item_id=sale_item.id)
                .aggregate(total=Sum("quantity"))["total"]
                or Decimal("0")
            )
            if qty > (sale_item.quantity - total_returned):
                raise serializers.ValidationError(
                    f"Cannot return more than available for {sale_item.product_name}"
                )

            # Proportional discount
            line_total_before_disc = sale_item.price * qty
            line_discount = line_total_before_disc * discount_ratio
            line_total = line_total_before_disc - line_discount

            total_refund += line_total

            return_items.append({
                "sale_item": sale_item,
                "product": sale_item.product,
                "location": sale_item.location,
                "quantity": qty,
                "price": sale_item.price,
                "total": line_total,
            })

        # --- Create SalesReturn ---
        sales_return = SalesReturn.objects.create(
            sale=sale,
            customer=customer,
            refund_amount=total_refund,
            refund_to_wallet=refund_to_wallet,
            refund_mode=refund_mode,
            created_by=request.user,
        )

        # --- Create SalesReturnItems and update stock ---
        for ri in return_items:
            SalesReturnItem.objects.create(
                sales_return=sales_return,
                sale_item=ri["sale_item"],
                product=ri["product"],
                location=ri["location"],
                quantity=ri["quantity"],
                price=ri["price"],
                total=ri["total"],
            )
            # Update stock
            pl = ProductLocation.objects.select_for_update().filter(
                product=ri["product"], location=ri["location"]
            ).first()
            if pl:
                pl.quantity = F("quantity") + ri["quantity"]
                pl.save(update_fields=["quantity"])
            else:
                ProductLocation.objects.create(
                    product=ri["product"], location=ri["location"], quantity=ri["quantity"]
                )

        # --- Handle wallet credit if chosen ---
        if refund_to_wallet and customer:
            WalletTransaction.objects.create(
                customer=customer,
                amount=total_refund,
                transaction_type="CREDIT",
                description=f"Refund for SalesReturn #{sales_return.id}",
            )
            customer.wallet_balance = F("wallet_balance") + total_refund
            customer.save(update_fields=["wallet_balance"])

        read_serializer = SalesReturnSerializer(sales_return)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def sales_stats(request):
    today = now().date()
    month_start = today.replace(day=1)
    fy_start = today.replace(month=4, day=1)
    if today.month < 4:
        fy_start = today.replace(year=today.year - 1, month=4, day=1)

    # Helper function to calculate totals net of returns for a period
    def period_stats(start_date, end_date=None):
        end_date = end_date or start_date

        total_sales = Sale.objects.filter(
            sale_datetime__date__gte=start_date,
            sale_datetime__date__lte=end_date
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        total_returns = SalesReturn.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).aggregate(total=Sum('refund_amount'))['total'] or 0

        return {
            "total_amount": total_sales,
            "after_return": total_sales - total_returns
        }

    # Compute period stats
    today_stats = period_stats(today)
    month_stats = period_stats(month_start, today)
    fy_stats = period_stats(fy_start, today)

    # Month-wise totals for chart (Apr → Mar)
    month_totals = []
    for i in range(12):
        month = (4 + i - 1) % 12 + 1  # Apr=1, May=2,... Mar=12
        year = today.year if month >= 4 else today.year + 1 if today.month >= 4 else today.year
        start_date = date(year, month, 1)
        end_day = monthrange(year, month)[1]
        end_date = date(year, month, end_day)

        total_sales = Sale.objects.filter(
            sale_datetime__date__gte=start_date,
            sale_datetime__date__lte=end_date
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        total_returns = SalesReturn.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).aggregate(total=Sum('refund_amount'))['total'] or 0

        month_totals.append(total_sales - total_returns)

    # Aggregate totals
    sales_total = Sale.objects.aggregate(total_sales=Sum('total_amount'))['total_sales'] or 0
    sales_return_total = SalesReturn.objects.aggregate(total_return=Sum('refund_amount'))['total_return'] or 0

    return Response({
        "sales_total": sales_total,
        "sales_after_return": sales_total - sales_return_total,
        "sales_today": today_stats["total_amount"],
        "sales_today_after_return": today_stats["after_return"],
        "sales_month": month_stats["total_amount"],
        "sales_month_after_return": month_stats["after_return"],
        "sales_fy": fy_stats["total_amount"],
        "sales_fy_after_return": fy_stats["after_return"],
        "sales_return_total": sales_return_total,
        "sales_return_today": SalesReturn.objects.filter(created_at__date=today).aggregate(total=Sum('refund_amount'))['total'] or 0,
        "sales_return_month": SalesReturn.objects.filter(created_at__date__gte=month_start).aggregate(total=Sum('refund_amount'))['total'] or 0,
        "sales_return_fy": SalesReturn.objects.filter(created_at__date__gte=fy_start).aggregate(total=Sum('refund_amount'))['total'] or 0,
        "today": today_stats,
        "current_month": month_stats,
        "financial_year": fy_stats,
        "month_totals": month_totals
    })