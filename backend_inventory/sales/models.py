# sales/models.py
from decimal import Decimal, ROUND_HALF_UP
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from decimal import Decimal

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
    building_no = models.CharField(max_length=50, blank=True, null=True)
    street_no = models.CharField(max_length=50, blank=True, null=True)
    zone_no = models.CharField(max_length=50, blank=True, null=True)
    short_name = models.CharField(max_length=20, blank=True, null=True)
    logo = models.ImageField(upload_to="section_logos/", blank=True, null=True)

    class Meta:
        unique_together = (("channel", "name"),)
        indexes = [models.Index(fields=["channel", "name"])]

    def __str__(self):
        return f"{self.channel.name} - {self.name}"

class SectionProductPrice(models.Model):
    section = models.ForeignKey(SalesSection, on_delete=models.CASCADE, related_name="prices")
    product = models.ForeignKey("products.Product", on_delete=models.CASCADE, related_name="section_prices")

    # optional manual override
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_manual = models.BooleanField(default=False)

    class Meta:
        unique_together = (("section", "product"),)
        indexes = [models.Index(fields=["section", "product"])]

    def __str__(self):
        return f"{self.section} - {self.product} @ {self.final_price}"

    @property
    def final_price(self):
        """
        Returns either manual selling_price or cost+20% if not manual.
        """
        if self.is_manual and self.selling_price is not None:
            return self.selling_price
        # fallback → use product.cost + 20%
        return round(self.product.cost_price * Decimal("1.2"), 2)

class Sale(models.Model):
    PAYMENT_MODES = [
        ("Cash", "Cash"),
        ("Credit", "Credit"),
        ("Online", "Online"),
    ]

    invoice_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    channel = models.ForeignKey(SalesChannel, on_delete=models.PROTECT, related_name="sales")
    section = models.ForeignKey(SalesSection, on_delete=models.PROTECT, related_name="sales")

    sale_datetime = models.DateTimeField(default=timezone.now, db_index=True)

    customer = models.ForeignKey("customers.Customer", on_delete=models.SET_NULL, null=True, blank=True)
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

class SalesReturn(models.Model):
    REFUND_MODE_CHOICES = [
        ("cash", "Cash"),
        ("card", "Card"),
        ("online", "Online"),
        ("wallet", "Wallet"),
    ]
    sale = models.ForeignKey("Sale", on_delete=models.CASCADE, related_name="returns")
    customer = models.ForeignKey("customers.Customer", on_delete=models.SET_NULL, null=True, blank=True, related_name="returns")
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    # Computed in create() from items with proportional discount allocation
    refund_amount = models.DecimalField(max_digits=14, decimal_places=2)

    refund_mode = models.CharField(
        max_length=10, choices=REFUND_MODE_CHOICES, default="cash"
    )

    # If True -> credit wallet instead of giving cash
    refund_to_wallet = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_sales_returns"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"SalesReturn #{self.pk} for Sale {self.sale_id}"

class SalesReturnItem(models.Model):
    sales_return = models.ForeignKey(SalesReturn, on_delete=models.CASCADE, related_name="items")
    sale_item = models.ForeignKey("SaleItem", on_delete=models.PROTECT, related_name="return_items")

    # Keep strong links for stock operations and integrity
    product = models.ForeignKey("products.Product", on_delete=models.PROTECT)
    location = models.ForeignKey("products.Location", on_delete=models.PROTECT)

    # Use same precision as SaleItem.quantity
    quantity = models.DecimalField(max_digits=12, decimal_places=3)

    # Snapshot finance
    price = models.DecimalField(max_digits=12, decimal_places=2)  # unit price before discount allocation
    total = models.DecimalField(max_digits=14, decimal_places=2)  # line total after proportional discount allocation

    def __str__(self):
        return f"Return {self.product} x {self.quantity} to {self.location}"