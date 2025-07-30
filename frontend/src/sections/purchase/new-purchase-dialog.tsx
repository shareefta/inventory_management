import type { PurchaseItem, PurchaseFormData } from 'src/api/purchases';

import { useEffect, useState } from 'react';
import imageCompression from 'browser-image-compression';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Box,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';

import { createPurchase } from 'src/api/purchases';
import { getProducts, getLocations } from 'src/api/products';

import { Iconify } from 'src/components/iconify';

import { ProductProps } from '../product/product-table-row';

type Product = { id: number; itemName: string };
type Location = { id: number; name: string };

type NewPurchaseDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function NewPurchaseDialog({ open, onClose, onSuccess, }: NewPurchaseDialogProps) {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    supplier_name: '',
    invoice_number: '',
    purchase_date: '',
    discount: 0,
    invoice_image: null as File | null,
    items: [] as {
      product: number | '';
      rate: number;
      item_locations: { location: number | ''; quantity: number }[];
    }[],
  });

  const resetForm = () => {
    setForm({
      supplier_name: '',
      invoice_number: '',
      purchase_date: '',
      discount: 0,
      invoice_image: null,
      items: [],
    });
  };

  useEffect(() => {
    if (open) {
      Promise.all([getProducts(), getLocations()])
        .then(([prods, locs]) => {
          setProducts(prods);
          setLocations(locs);
        })
        .catch(console.error);
    }
  }, [open]);

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...form.items];
    (updated[index] as any)[field] = value;
    setForm((f) => ({ ...f, items: updated }));
  };

  const handleItemLocationChange = (
    itemIndex: number,
    locIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...form.items];
    if (field === 'location' || field === 'quantity') {
      updated[itemIndex].item_locations[locIndex][field] = value;
    }
    setForm((f) => ({ ...f, items: updated }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
    const cleanedItems: PurchaseItem[] = form.items
      .filter((item) => item.product !== '')
      .map((item) => ({
        product: Number(item.product),
        rate: item.rate,
        item_locations: item.item_locations
          .filter((loc) => loc.location !== '')
          .map((loc) => ({
            location: Number(loc.location),
            quantity: loc.quantity,
          })),
      }));

    const payload: PurchaseFormData = {
      ...form,
      total_amount: 0,
      items: cleanedItems,
    };

    console.log('🧾 Payload:', payload); // Debug

    await createPurchase(payload);
    onSuccess();
    onClose();
    resetForm();
    } catch (error: any) {
      console.error('❌ Purchase create failed:', error);
      if (error.response?.data) {
        console.error('📩 Server response:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Purchase</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Supplier Name"
          fullWidth
          margin="normal"
          value={form.supplier_name}
          onChange={(e) => handleFormChange('supplier_name', e.target.value)}
        />

        <TextField
          label="Invoice Number"
          fullWidth
          margin="normal"
          value={form.invoice_number}
          onChange={(e) => handleFormChange('invoice_number', e.target.value)}
        />

        <TextField
          label="Purchase Date"
          type="date"
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={form.purchase_date}
          onChange={(e) => handleFormChange('purchase_date', e.target.value)}
        />

        <TextField
          label="Discount"
          type="number"
          fullWidth
          margin="normal"
          value={form.discount}
          onChange={(e) => handleFormChange('discount', Number(e.target.value))}
        />

        {/* Items */}
        <Box mt={2}>
          {form.items.map((item, index) => (
            <Box key={index} sx={{ border: '1px solid #ccc', p: 2, mb: 2, borderRadius: 2 }}>
              <TextField
                label="Product"
                select
                fullWidth
                value={item.product}
                onChange={(e) => handleItemChange(index, 'product', Number(e.target.value))}
                sx={{ mb: 2 }}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.itemName}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Rate"
                type="number"
                fullWidth
                value={item.rate}
                onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                sx={{ mb: 2 }}
              />

              {/* Item Locations */}
              {item.item_locations.map((loc, locIndex) => (
                <Box key={locIndex} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <TextField
                    label="Location"
                    select
                    value={loc.location}
                    onChange={(e) =>
                      handleItemLocationChange(index, locIndex, 'location', Number(e.target.value))
                    }
                    sx={{ flex: 1 }}
                  >
                    {locations.map((l) => (
                      <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Qty"
                    type="number"
                    value={loc.quantity}
                    onChange={(e) =>
                      handleItemLocationChange(index, locIndex, 'quantity', Number(e.target.value))
                    }
                    sx={{ width: 100 }}
                  />

                  <IconButton
                    onClick={() => {
                      const updated = [...form.items];
                      updated[index].item_locations = updated[index].item_locations.filter((_, i) => i !== locIndex);
                      setForm((f) => ({ ...f, items: updated }));
                    }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Box>
              ))}

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const updated = [...form.items];
                  updated[index].item_locations.push({ location: '', quantity: 0 });
                  setForm((f) => ({ ...f, items: updated }));
                }}
              >
                Add Location
              </Button>
            </Box>
          ))}

          <Button
            variant="contained"
            onClick={() =>
              setForm((f) => ({
                ...f,
                items: [...f.items, { product: '', rate: 0, item_locations: [] }],
              }))
            }
          >
            Add Item
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
