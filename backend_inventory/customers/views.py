# customers/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from .models import Customer, WalletTransaction
from .serializers import CustomerSerializer, WalletOperationSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Prefetch, OuterRef
from rest_framework.decorators import api_view, permission_classes

class CustomerListAPIView(generics.ListAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        search = self.request.query_params.get('search', '')
        try:
            limit = int(self.request.query_params.get('limit', 50))
        except ValueError:
            limit = 50

        # Base queryset
        qs = Customer.objects.all()

        # Apply search filter
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(mobile__icontains=search))

        # Prefetch all transactions ordered by created_at descending
        last_transactions_qs = WalletTransaction.objects.order_by('-created_at')

        qs = qs.prefetch_related(
            Prefetch(
                'wallet_transactions',
                queryset=last_transactions_qs,
                to_attr='last_transactions'  # use a separate attribute
            )
        )

        # Order customers by name and limit
        return qs.order_by('name')[:limit]

class WalletOperationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, action):
        """
        POST /api/customers/{pk}/wallet/{action}/
        action = 'credit' or 'debit'
        """
        try:
            customer = Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = WalletOperationSerializer(
            data=request.data,
            context={"customer": customer, "action": action}
        )
        serializer.is_valid(raise_exception=True)
        tx = serializer.save()

        return Response(
            {
                "customer_id": customer.id,
                "new_balance": customer.wallet_balance,
                "transaction": {
                    "id": tx.id,
                    "type": tx.tx_type,
                    "amount": tx.amount,
                    "note": tx.note,
                    "created_at": tx.created_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_wallet_balance(request, pk):
    try:
        customer = Customer.objects.get(pk=pk)
    except Customer.DoesNotExist:
        return Response({"detail": "Customer not found"}, status=404)
    return Response({"wallet_balance": customer.wallet_balance})