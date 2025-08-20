# products/signals.py
from decimal import Decimal
import math
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Product
from sales.models import SalesSection, SectionProductPrice

def round_up_to_next_5_custom(value: Decimal) -> Decimal:
    rounded = Decimal(math.ceil(value / 5) * 5)
    if rounded == value:
        rounded += 5
    return rounded

@receiver(post_save, sender=Product)
def create_or_update_section_prices(sender, instance: Product, created, **kwargs):
    """
    Create SectionProductPrice entries for all sections on product creation.
    Update auto_price on rate update if manual_price is empty.
    """
    for section in SalesSection.objects.all():
        spp, _ = SectionProductPrice.objects.get_or_create(
            section=section,
            product=instance,
            defaults={
                "auto_price": round_up_to_next_5_custom(instance.rate * Decimal("1.2"))
            }
        )
        if not spp.manual_price:
            spp.auto_price = round_up_to_next_5_custom(instance.rate * Decimal("1.2"))
            spp.save()
