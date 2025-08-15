import { useEffect, useState } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, CircularProgress, Box, Grid, Typography, Autocomplete
} from '@mui/material';

import { Sale, SaleItem, updateSale } from 'src/api/sales';

type SaleEditDialogProps = {
  open: boolean;
  sale: Sale;          // the sale object to edit
  onClose: () => void;
  onSaved: () => void;
};

export default function SaleEditDialog({ open, sale, onClose, onSaved }: SaleEditDialogProps) {
  const [form, setForm] = useState<Sale>({ ...sale });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sale) setForm({ ...sale, items: sale.items ?? [] });
  }, [sale]);

  const handleChange = (field: keyof Sale, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
    const updated = [...(form.items ?? [])];
    updated[index] = { ...updated[index], [field]: value };
    setForm(prev => ({ ...prev, items: updated }));
  };

  const grandTotal = (form.items ?? []).reduce((acc, item) => acc + (item.total || 0), 0) - (form.discount || 0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateSale(form.id!, form); // send updated sale to backend
      onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to update sale:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Sale</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Invoice Number"
              fullWidth
              value={form.invoice_number || ''}
              onChange={(e) => handleChange('invoice_number', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Customer Name"
              fullWidth
              value={form.customer_name || ''}
              onChange={(e) => handleChange('customer_name', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Customer Mobile"
              fullWidth
              value={form.customer_mobile || ''}
              onChange={(e) => handleChange('customer_mobile', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Autocomplete
              options={['Cash', 'Credit', 'Online']}
              value={form.payment_mode}
              onChange={(_, v) => handleChange('payment_mode', v || 'Cash')}
              renderInput={(params) => <TextField {...params} label="Payment Mode" fullWidth />}
            />
          </Grid>
        </Grid>

        <Typography variant="h6">Items</Typography>
        {(form.items ?? []).map((item, idx) => (
          <Grid container spacing={1} key={idx} mb={1}>
            <Grid size={{ xs: 3 }}>
              <TextField
                label="Product Name"
                fullWidth
                value={item.product_name || ''}
                onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 2 }}>
              <TextField
                label="Price"
                type="number"
                fullWidth
                value={item.price || 0}
                onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
              />
            </Grid>
            <Grid size={{ xs: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={item.quantity || 0}
                onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
              />
            </Grid>
            <Grid size={{ xs: 2 }}>
              <TextField
                label="Total"
                type="number"
                fullWidth
                value={item.total || 0}
                onChange={(e) => handleItemChange(idx, 'total', Number(e.target.value))}
              />
            </Grid>
          </Grid>
        ))}

        <Box mt={2} textAlign="right">
          <Typography variant="h6">Grand Total: {grandTotal.toFixed(2)}</Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
