# customers/serializers.py
from rest_framework import serializers
from .models import Customer, WalletTransaction

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ["id", "tx_type", "amount", "note", "created_at"]

class CustomerSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ["id", "name", "mobile", "wallet_balance", "label", "recent_transactions"]

    def get_recent_transactions(self, obj):
        transactions = getattr(obj, 'last_transactions', obj.wallet_transactions.all())
        return WalletTransactionSerializer(transactions[:5], many=True).data

    def get_label(self, obj):
        if obj.name:
            return f"{obj.name} ({obj.mobile})"
        return obj.mobile

class WalletOperationSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    note = serializers.CharField(required=False, allow_blank=True)

    def save(self, **kwargs):
        customer = self.context["customer"]
        amount = self.validated_data["amount"]
        note = self.validated_data.get("note", "")

        if self.context.get("action") == "credit":
            return WalletTransaction.credit(customer, amount, note=note)
        elif self.context.get("action") == "debit":
            return WalletTransaction.debit(customer, amount, note=note)
        raise serializers.ValidationError("Invalid action")