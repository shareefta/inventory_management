// Import remains same...
import { useEffect, useState, useRef } from 'react';

import Grid from '@mui/material/Grid';
import {
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress,
  Box, IconButton, Typography
} from '@mui/material';

import { createPurchase } from 'src/api/purchases';
import { getProducts, getLocations } from 'src/api/products';

import { Iconify } from 'src/components/iconify';

import { ProductProps } from '../product/product-table-row';

type Location = { id: number; name: string };

type NewPurchaseDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function NewPurchaseDialog({ open, onClose, onSuccess }: NewPurchaseDialogProps) {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);
  const productRefs = useRef<(HTMLInputElement | null)[]>([]);
  const locationRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [form, setForm] = useState({
    supplier_name: '',
    invoice_number: '',
    purchase_date: '',
    payment_mode: '',
    purchased_by: '',
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
      payment_mode: '',
      purchased_by: '',
      discount: 0,
      invoice_image: null,
      items: [],
    });
  };

  const grandTotal = form.items.reduce((acc, item) => {
    const qty = item.item_locations.reduce((sum, l) => sum + l.quantity, 0);
    return acc + item.rate * qty;
  }, 0) - form.discount;

  useEffect(() => {
    if (!open) return;

    Promise.all([getProducts(), getLocations()])
      .then(([prods, locs]) => {
        setProducts(prods);
        setLocations(locs);
      })
      .catch(console.error);

    setTimeout(() => {
      dateRef.current?.focus();
    }, 100);
  }, [open]);

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...form.items];
    (updated[index] as any)[field] = value;
    setForm((f) => ({ ...f, items: updated }));
  };

  const handleItemLocationChange = (itemIndex: number, locIndex: number, field: string, value: any) => {
    const updated = [...form.items];
    if (field === 'location' || field === 'quantity') {
      updated[itemIndex].item_locations[locIndex][field] = value;
    }
    setForm((f) => ({ ...f, items: updated }));
  };

  const handleSubmit = async () => {
  setLoading(true);

  try {
    // Filter and clean up items before submission
    const cleanedItems = form.items
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

    // Build the full payload as a plain JSON object
    const payload = {
      supplier_name: form.supplier_name,
      invoice_number: form.invoice_number,
      purchase_date: form.purchase_date,
      discount: form.discount,
      payment_mode: form.payment_mode as 'Cash' | 'Credit' | 'Card' | 'Online',
      purchased_by: form.purchased_by as 'AZIZIYAH_SHOP' | 'ALWAB_SHOP' | 'MAIN_STORE' | 'JAMSHEER' | 'FAWAS' | 'IRSHAD' | 'MOOSA' | 'FATHIH' | 'FIROZ',
      total_amount: grandTotal,
      items: cleanedItems,
    };

    // Make the POST request
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

  const isFormValid = form.items.length > 0 && form.items.every(
    item => item.product !== '' && item.item_locations.length > 0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create New Purchase</DialogTitle>
      <DialogContent dividers>

        {/* Section 1: Purchase Details */}
        <Typography variant="h6" gutterBottom>Purchase Details</Typography>
        <Grid container spacing={1} mb={3}>
          <Grid size={{ sm:6, md: 2 }}>
            <TextField label="Purchase Date" type="date" fullWidth InputLabelProps={{ shrink: true }}
              value={form.purchase_date}
              onChange={(e) => handleFormChange('purchase_date', e.target.value)} 
              inputRef={dateRef}
            />
          </Grid>
          <Grid size={{ sm:12, md: 4 }}>
            <TextField label="Supplier Name" fullWidth
              value={form.supplier_name}
              onChange={(e) => handleFormChange('supplier_name', e.target.value)} />
          </Grid>
          <Grid size={{ sm:4, md: 2 }}>
            <TextField label="Invoice Number" fullWidth
              value={form.invoice_number}
              onChange={(e) => handleFormChange('invoice_number', e.target.value)} />
          </Grid>
          <Grid size={{ sm:4, md: 2 }} sx={{ minWidth: 150 }}>
            <Autocomplete
              options={['Cash', 'Credit', 'Online', 'Card']}
              value={form.payment_mode}
              onChange={(_, newValue) => handleFormChange('payment_mode', newValue || '')}
              renderInput={(params) => <TextField {...params} label="Payment Mode" fullWidth />}
            />
          </Grid>
          <Grid size={{ sm:4, md: 2 }} sx={{ minWidth: 150 }}>
            <Autocomplete
              options={['AZIZIYAH_SHOP', 'ALWAB_SHOP', 'MAIN_STORE', 'JAMSHEER', 'FAWAS', 'IRSHAD', 'MOOSA', 'FATHIH', 'FIROZ']}
              value={form.purchased_by}
              onChange={(_, newValue) => handleFormChange('purchased_by', newValue || '')}
              renderInput={(params) => <TextField {...params} label="Purchased By" fullWidth />}
            />
          </Grid>
        </Grid>

        {/* Section 2: Products */}
        <Typography variant="h6" gutterBottom>Products</Typography>
        {form.items.map((item, index) => {
          const totalQty = item.item_locations.reduce((sum, l) => sum + l.quantity, 0);
          const rowTotal = item.rate * totalQty;

          return (
            <Grid  container spacing={1} key={index} alignItems="flex-start" >
              <Grid size={{ sm:12, md: 9 }}>
                <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Grid size={{ sm:10, md: 4 }} sx={{ minWidth: 150 }}>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(option) => option.itemName}
                      value={products.find(p => p.id === item.product) || null}
                      onChange={(_, newValue) =>
                        handleItemChange(index, 'product', newValue ? newValue.id : '')
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Product"
                          fullWidth
                          inputRef={(el) => {
                            productRefs.current[index] = el;
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ sm:2, md: 1.5 }}>
                    <TextField label="Rate" type="number" fullWidth
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', Math.max(0, Number(e.target.value)))} 
                      onWheel={(e) => (e.target as HTMLElement).blur()}  
                    />
                  </Grid>

                  {item.item_locations.map((loc, locIndex) => (
                    <Grid size={{ sm:6, md: 4}} key={locIndex} sx={{ display: 'flex', gap: 1 }}>
                      <Autocomplete
                        options={locations.filter((l) =>
                          !item.item_locations.some((il, i) => il.location === l.id && i !== locIndex)
                        )}
                        getOptionLabel={(option) => option.name}
                        value={locations.find(l => l.id === loc.location) || null}
                        onChange={(_, newValue) =>
                          handleItemLocationChange(index, locIndex, 'location', newValue ? newValue.id : '')
                        }
                        renderInput={(params) => {
                          const key = `${index}-${locIndex}`;
                          return (
                            <TextField
                              {...params}
                              label="Location"
                              sx={{ flex: 1, minWidth: 150 }}
                              inputRef={(el) => {
                                locationRefs.current[key] = el;
                              }}
                            />
                          );
                        }}
                      />
                      <TextField label="Qty" type="number" value={loc.quantity}
                        onChange={(e) => handleItemLocationChange(index, locIndex, 'quantity', Number(e.target.value))}
                        sx={{ width: 80 }} onWheel={(e) => (e.target as HTMLElement).blur()} />

                      <IconButton onClick={() => {
                        const updated = [...form.items];
                        updated[index].item_locations = updated[index].item_locations.filter((_, i) => i !== locIndex);
                        setForm((f) => ({ ...f, items: updated }));
                      }}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Grid>
                  ))}

                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      const updated = [...form.items];
                      updated[index].item_locations.push({ location: '', quantity: 0 });
                      setForm((f) => ({ ...f, items: updated }));

                      setTimeout(() => {
                        const key = `${index}-${updated[index].item_locations.length - 1}`;
                        locationRefs.current[key]?.focus();
                      }, 100);
                    }}
                  >
                    + Stock
                  </Button>
                </Grid>
              </Grid>
              <Grid size={{ sm:12, md: 3 }}>
                <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Grid size={{ sm:6, md: 8 }}>
                    <Box
                      sx={{
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        padding: 1,
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      <Typography variant="subtitle2">Product Total</Typography>
                      <Typography sx={{ minWidth: 150 }} fontWeight="bold">{rowTotal.toFixed(2)}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ sm:6, md: 4 }}>
                    <IconButton onClick={() => {
                      const updated = [...form.items];
                      updated.splice(index, 1);
                      setForm((f) => ({ ...f, items: updated }));
                    }}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Grid>
                </Grid> 
              </Grid>                                         
            </Grid>
          );
        })}

        <Box textAlign="right" mb={3}>
          <Button
            variant="contained"
            onClick={() => {
              setForm((f) => ({
                ...f,
                items: [...f.items, { product: '', rate: 0, item_locations: [] }],
              }));

              setTimeout(() => {
                const lastIndex = productRefs.current.length - 1;
                productRefs.current[lastIndex]?.focus();
              }, 100);
            }}
          >
            + Add Item
          </Button>
        </Box>

        {/* Section 3: Summary */}
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Grid container spacing={1} alignItems="center">
          <Grid size={{ sm:4, md: 3 }}>
            <TextField label="Discount" type="number" fullWidth
              value={form.discount}
              onChange={(e) => handleFormChange('discount', Number(e.target.value))} />
          </Grid>
          <Grid size={{ sm:6, md: 3 }}>
            <Box
              sx={{
                border: '1px solid #ccc',
                borderRadius: 2,
                padding: 1,
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
              }}
            >
              <Typography variant="subtitle2">Grand Total</Typography>
              <Typography sx={{ minWidth: 150 }} variant="h6">{(Number(grandTotal) || 0).toFixed(2)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => { resetForm(); onClose(); }} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !isFormValid}>
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}