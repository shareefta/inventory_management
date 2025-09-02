# customers/serializers.py
from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()  # for autocomplete display

    class Meta:
        model = Customer
        fields = ['id', 'name', 'mobile', 'wallet_balance', 'label']

    def get_label(self, obj):
        if obj.name:
            return f"{obj.name} ({obj.mobile})"
        return obj.mobile