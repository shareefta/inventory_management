# sales/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone

# Use string app labels to avoid circular imports; they match your current setup
# (Category, Location, Product live in "products")
# - Product has fields: unique_id, item_name, brand, variants, serial_number, rate
# - ProductLocation holds per-location stock
# - Location is your store/branch/warehouse
# NOTE: We reference them as "products.Product" / "products.Location"
#       (same style you used in Purchase models).

class SalesChannel(models.Model):
    """
    High-level channels, e.g. 'Online', 'Offline'.
    """
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        verbose_name = "Sales Channel"
        verbose_name_plural = "Sales Channels"

    def __str__(self):
        return self.name


class SalesSection(models.Model):
    """
    A section belongs to a channel and ALWAYS maps to a Location for stock deduction.

    - OFFLINE: Create one section per Location (name mirrors location.name).
    - ONLINE: Create custom sections like 'Snoonu', 'Talabat', 'Rafeeq' and map each to
              a Location from which stock will be deducted (e.g., Main Store).
    """
    channel = models.ForeignKey(SalesChannel, on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=100)
    location = models.ForeignKey("products.Location", on_delete=models.PROTECT, related_name="sales_sections")

    class Meta:
        unique_together = (("channel", "name"),)
        indexes = [models.Index(fields=["channel", "name"])]

    def __str__(self):
        return f"{self.channel.name} - {self.name}"


class SectionProductPrice(models.Model):
    """
    Per-section (per-department) selling prices for products.
    Use the bulk API to set/update prices in bulk.
    """
    section = models.ForeignKey(SalesSection, on_delete=models.CASCADE, related_name="prices")
    product = models.ForeignKey("products.Product", on_delete=models.CASCADE, related_name="section_prices")
    price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = (("section", "product"),)
        indexes = [models.Index(fields=["section", "product"])]

    def __str__(self):
        return f"{self.section} - {self.product} @ {self.price}"


class Sale(models.Model):
    PAYMENT_MODES = [
        ("Cash", "Cash"),
        ("Credit", "Credit"),
        ("Online", "Online"),  # TAP / gateways
    ]

    channel = models.ForeignKey(SalesChannel, on_delete=models.PROTECT, related_name="sales")
    section = models.ForeignKey(SalesSection, on_delete=models.PROTECT, related_name="sales")

    sale_datetime = models.DateTimeField(default=timezone.now, db_index=True)

    customer_name = models.CharField(max_length=150, blank=True, null=True)
    customer_mobile = models.CharField(max_length=20, blank=True, null=True)

    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODES)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_sales"
    )

    class Meta:
        ordering = ["-sale_datetime"]

    def __str__(self):
        return f"Sale #{self.pk} • {self.channel.name}/{self.section.name} • {self.sale_datetime:%Y-%m-%d %H:%M}"


class SaleItem(models.Model):
    """
    Denormalized snapshot so history survives even if Product is deleted.
    """
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")

    # Soft link to product (optional); keep snapshot fields permanently:
    product = models.ForeignKey("products.Product", on_delete=models.SET_NULL, null=True, blank=True, related_name="sale_items")

    product_name = models.CharField(max_length=255)
    product_barcode = models.CharField(max_length=100, blank=True, null=True)  # your Product.unique_id
    product_brand = models.CharField(max_length=100, blank=True)
    product_variant = models.CharField(max_length=200, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)

    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    total = models.DecimalField(max_digits=14, decimal_places=2)

    # For traceability/debug; set from sale.section.location at creation:
    location = models.ForeignKey("products.Location", on_delete=models.PROTECT, related_name="sale_items")

    def __str__(self):
        return f"{self.product_name} x {self.quantity} = {self.total}"