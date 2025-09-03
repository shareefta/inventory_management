# customers/models.py
from django.db import models, transaction

class Customer(models.Model):
    name = models.CharField(max_length=150, blank=True, null=True)
    mobile = models.CharField(max_length=20, unique=True, db_index=True)
    wallet_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name or self.mobile} • Wallet: {self.wallet_balance:.2f}"

class WalletTransaction(models.Model):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"
    TYPES = [(CREDIT, "Credit"), (DEBIT, "Debit")]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="wallet_transactions")
    tx_type = models.CharField(max_length=10, choices=TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Optional references to sales/returns (string to avoid circular import)
    sale_id = models.PositiveIntegerField(null=True, blank=True)
    sales_return_id = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        sign = "+" if self.tx_type == self.CREDIT else "-"
        return f"{self.customer} {sign}{self.amount} @ {self.created_at:%Y-%m-%d %H:%M}"

    @classmethod
    def credit(cls, customer, amount, *, note="", sale_id=None, sales_return_id=None):
        from django.db.models import F
        with transaction.atomic():
            tx = cls.objects.create(
                customer=customer,
                tx_type=cls.CREDIT,
                amount=amount,
                note=note,
                sale_id=sale_id,
                sales_return_id=sales_return_id,
            )
            # Atomic balance update
            Customer.objects.filter(pk=customer.pk).update(wallet_balance=F("wallet_balance") + amount)
            customer.refresh_from_db(fields=["wallet_balance"])
            return tx