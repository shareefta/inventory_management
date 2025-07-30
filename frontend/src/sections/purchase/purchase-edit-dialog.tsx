import type { PurchaseProps, PurchaseItemEntry, PurchaseItemLocationEntry } from 'src/api/purchases';

import { useEffect, useState } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Avatar, IconButton,
  Typography, Select, MenuItem
} from '@mui/material';

import { updatePurchase } from 'src/api/purchases';

import { Iconify } from 'src/components/iconify';

type PurchaseEditDialogProps = {
  open: boolean;
  purchase: PurchaseProps | null;
  onClose: () => void;
  onSuccess?: (updated: PurchaseProps) => void;
};

// Placeholder product and location lists — replace with dynamic data
const mockProducts = [
  { id: 1, itemName: 'Product A' },
  { id: 2, itemName: 'Product B' }
];

const mockLocations = [
  { id: 1, name: 'Warehouse A' },
  { id: 2, name: 'Warehouse B' }
];

export default function PurchaseEditDialog({ open, purchase, onClose, onSuccess }: PurchaseEditDialogProps) {
  const [formData, setFormData] = useState<PurchaseProps | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoke: (() => void) | null = null;

    if (purchase) {
      setFormData({ ...purchase });

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
    setFormData((prev) => prev && ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemEntry, value: any) => {
    if (!formData) return;
    const updatedItems = [...formData.items];
    (updatedItems[index] as any)[field] = value;
    setFormData({ ...formData, items: updatedItems });
  };

  const handleItemLocationChange = (itemIndex: number, locIndex: number, field: keyof PurchaseItemLocationEntry, value: any) => {
    if (!formData) return;
    const updatedItems = [...formData.items];
    const updatedLocs = [...updatedItems[itemIndex].item_locations];
    (updatedLocs[locIndex] as any)[field] = value;
    updatedItems[itemIndex].item_locations = updatedLocs;
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = async () => {
    if (!formData) return;

    const fd = new FormData();
    fd.append('supplier_name', formData.supplier_name);
    fd.append('purchase_date', formData.purchase_date);
    fd.append('discount', String(formData.discount));
    fd.append('total_amount', String(formData.total_amount ?? 0));
    fd.append('invoice_number', formData.invoice_number || '');

    if (formData.invoice_image instanceof File) {
      fd.append('invoice_image', formData.invoice_image);
    }

    // Nested item and item_locations
    const itemsPayload = formData.items.map((item) => ({
      product: typeof item.product === 'object' ? item.product.id : item.product,
      rate: item.rate,
      item_locations: item.item_locations.map((loc) => ({
        location: typeof loc.location === 'object' ? loc.location.id : loc.location,
        quantity: loc.quantity,
      })),
    }));

    fd.append('items', JSON.stringify(itemsPayload));

    try {
      const updated = await updatePurchase(formData.id!, fd);
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
        <TextField label="Supplier Name" value={formData.supplier_name} onChange={(e) => handleChange('supplier_name', e.target.value)} />
        <TextField label="Invoice Number" value={formData.invoice_number ?? ''} onChange={(e) => handleChange('invoice_number', e.target.value)} />
        <TextField label="Purchase Date" type="date" value={formData.purchase_date} onChange={(e) => handleChange('purchase_date', e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Discount" type="number" value={formData.discount} onChange={(e) => handleChange('discount', parseFloat(e.target.value))} />
        <TextField label="Total Amount" type="number" value={formData.total_amount ?? ''} onChange={(e) => handleChange('total_amount', parseFloat(e.target.value))} />

        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={previewUrl || '/assets/images/fallback-image.png'} variant="rounded" sx={{ width: 64, height: 64 }} />
          <Button variant="outlined" component="label">
            Upload Image
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </Button>
        </Box>

        <Typography variant="h6">Items</Typography>
        {formData.items.map((item, idx) => (
          <Box key={idx} p={2} border="1px dashed grey" borderRadius={2} mb={2}>
            <Select
              fullWidth
              value={typeof item.product === 'object' ? item.product.id : item.product}
              onChange={(e) => handleItemChange(idx, 'product', Number(e.target.value))}
            >
              {mockProducts.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.itemName}</MenuItem>
              ))}
            </Select>

            <TextField
              fullWidth
              label="Rate"
              type="number"
              value={item.rate}
              onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value))}
              sx={{ mt: 2 }}
            />

            <Typography variant="subtitle1" mt={2}>Locations</Typography>
            {item.item_locations.map((loc, locIdx) => (
              <Box key={locIdx} display="flex" gap={1} mt={1}>
                <Select
                  value={typeof loc.location === 'object' ? loc.location.id : loc.location}
                  onChange={(e) =>
                    handleItemLocationChange(idx, locIdx, 'location', Number(e.target.value))
                  }
                  sx={{ flex: 1 }}
                >
                  {mockLocations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                  ))}
                </Select>
                <TextField
                  label="Quantity"
                  type="number"
                  value={loc.quantity}
                  onChange={(e) =>
                    handleItemLocationChange(idx, locIdx, 'quantity', parseInt(e.target.value))
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
