import type { PurchaseProps, PurchaseItem, PurchaseItemLocation } from 'src/api/purchases';

import { useEffect, useState } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Avatar, Typography, Select, MenuItem
} from '@mui/material';

import { updatePurchase } from 'src/api/purchases';

import { Iconify } from 'src/components/iconify';

type PurchaseEditDialogProps = {
  open: boolean;
  purchase: PurchaseProps | null;
  onClose: () => void;
  onSuccess?: (updated: PurchaseProps) => void;
};

export default function PurchaseEditDialog({ open, purchase, onClose, onSuccess }: PurchaseEditDialogProps) {
  const [formData, setFormData] = useState<PurchaseProps | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Helper to recalc total amount
  const recalculateTotal = (items: PurchaseItem[], discount: number) => {
    const total = items.reduce((sum, item) => {
      const qtySum = item.item_locations.reduce((q, loc) => q + loc.quantity, 0);
      return sum + qtySum * item.rate;
    }, 0);
    return Math.max(0, total - discount);
  };

  useEffect(() => {
    let revoke: (() => void) | null = null;

    if (purchase) {
      // Calculate initial total amount
      const totalAmount = recalculateTotal(purchase.items, purchase.discount);

      setFormData({
        ...purchase,
        total_amount: totalAmount,
      });

      if (purchase.invoice_image instanceof File) {
        const url = URL.createObjectURL(purchase.invoice_image);
        setPreviewUrl(url);
        revoke = () => URL.revokeObjectURL(url);
        window.addEventListener('beforeunload', revoke);
      } else if (typeof purchase.invoice_image === 'string') {
        setPreviewUrl(purchase.invoice_image);
      }
    }

    return () => {
      if (revoke) {
        window.removeEventListener('beforeunload', revoke);
        revoke();
      }
    };
  }, [purchase]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => prev && ({ ...prev, invoice_image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (field: keyof PurchaseProps, value: any) => {
    if (!formData) return;

    const newFormData = { ...formData, [field]: value };

    // If discount changed, recalc total_amount
    if (field === 'discount') {
      const total = recalculateTotal(newFormData.items, value);
      newFormData.total_amount = total;
    }

    setFormData(newFormData);
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    if (!formData) return;
    const updatedItems = [...formData.items];
    (updatedItems[index] as any)[field] = value;

    const total = recalculateTotal(updatedItems, formData.discount);
    setFormData({ ...formData, items: updatedItems, total_amount: total });
  };

  const handleItemLocationChange = (itemIndex: number, locIndex: number, field: keyof PurchaseItemLocation, value: any) => {
    if (!formData) return;
    const updatedItems = [...formData.items];
    const updatedLocs = [...updatedItems[itemIndex].item_locations];
    (updatedLocs[locIndex] as any)[field] = value;
    updatedItems[itemIndex].item_locations = updatedLocs;

    const total = recalculateTotal(updatedItems, formData.discount);
    setFormData({ ...formData, items: updatedItems, total_amount: total });
  };

  const handleSubmit = async () => {
    if (!formData) return;

    const cleanedItems = formData.items.map(item => ({
      product: typeof item.product === 'object' ? (item.product as { id: number }).id : item.product,
      rate: item.rate,
      item_locations: item.item_locations.map(loc => ({
        location: typeof loc.location === 'object' ? (loc.location as { id: number }).id : loc.location,
        quantity: loc.quantity,
      })),
    }));

    const payload = {
      supplier_name: formData.supplier_name,
      invoice_number: formData.invoice_number || '',
      purchase_date: formData.purchase_date,
      discount: formData.discount,
      payment_mode: formData.payment_mode as 'Cash' | 'Credit' | 'Card' | 'Online',
      items: cleanedItems,
      // omit total_amount, it should be computed server-side
    };

    try {
      const updated = await updatePurchase(formData.id!, payload);
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update purchase.');
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Purchase</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Supplier Name"
          value={formData.supplier_name}
          onChange={(e) => handleChange('supplier_name', e.target.value)}
          fullWidth
        />

        <TextField
          label="Invoice Number"
          value={formData.invoice_number ?? ''}
          onChange={(e) => handleChange('invoice_number', e.target.value)}
          fullWidth
        />

        <TextField
          label="Purchase Date"
          type="date"
          value={formData.purchase_date}
          onChange={(e) => handleChange('purchase_date', e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

        <Select
          value={formData.payment_mode}
          onChange={(e) => handleChange('payment_mode', e.target.value)}
          fullWidth
        >
          <MenuItem value="Cash">Cash</MenuItem>
          <MenuItem value="Credit">Credit</MenuItem>
          <MenuItem value="Card">Card</MenuItem>
          <MenuItem value="Online">Online</MenuItem>
        </Select>

        <TextField
          label="Discount"
          type="number"
          value={formData.discount}
          onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
          fullWidth
        />

        <TextField
          label="Total Amount"
          type="number"
          value={formData.total_amount ?? 0}
          InputProps={{ readOnly: true }}
          fullWidth
        />

        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            src={previewUrl || '/assets/images/fallback-image.png'}
            variant="rounded"
            sx={{ width: 64, height: 64 }}
          />
          <Button variant="outlined" component="label">
            Upload Image
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </Button>
        </Box>

        <Typography variant="h6">Items</Typography>
        {formData.items.map((item, idx) => (
          <Box key={idx} p={2} border="1px dashed grey" borderRadius={2} mb={2}>
            <TextField
              label="Product ID"
              type="number"
              value={typeof item.product === 'object' ? (item.product as { id: number }).id : item.product}
              onChange={(e) => handleItemChange(idx, 'product', Number(e.target.value))}
              fullWidth
            />

            <TextField
              fullWidth
              label="Rate"
              type="number"
              value={item.rate}
              onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
              sx={{ mt: 2 }}
            />

            <Typography variant="subtitle1" mt={2}>
              Locations
            </Typography>
            {item.item_locations.map((loc, locIdx) => (
              <Box key={locIdx} display="flex" gap={1} mt={1}>
                <TextField
                  label="Location ID"
                  type="number"
                  value={typeof loc.location === 'object' ? (loc.location as { id: number }).id : loc.location}
                  onChange={(e) =>
                    handleItemLocationChange(idx, locIdx, 'location', Number(e.target.value))
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Quantity"
                  type="number"
                  value={loc.quantity}
                  onChange={(e) =>
                    handleItemLocationChange(idx, locIdx, 'quantity', parseInt(e.target.value) || 0)
                  }
                  sx={{ width: 100 }}
                />
              </Box>
            ))}
          </Box>
        ))}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
