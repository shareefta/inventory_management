import { useEffect, useState, useRef } from 'react';

import Grid from '@mui/material/Grid';
import {
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, CircularProgress, Box, IconButton, Typography
} from '@mui/material';

import { getProducts, getLocations } from 'src/api/products';
import { PurchaseProps, updatePurchase, getPurchase } from 'src/api/purchases';

import { Iconify } from 'src/components/iconify';

import { ProductProps } from '../product/product-table-row';

type Location = { id: number; name: string };

type PurchaseEditDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: PurchaseProps) => void;
  purchaseId: number;
};

export default function PurchaseEditDialog({ open, onClose, onSuccess, purchaseId }: PurchaseEditDialogProps) {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

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
      id?: number;  // for existing item IDs
      product: ProductProps | '';
      rate: number;
      item_locations: { id?: number; location: number | ''; quantity: number }[];
    }[],
  });

  useEffect(() => {
    if (!open) return;

    setLoadingData(true);
    Promise.all([getProducts(), getLocations(), getPurchase(purchaseId)])
      .then(([prods, locs, purchase]) => {
        setProducts(prods);
        setLocations(locs);

        // Map purchase data to form shape with '' for empty selections
        setForm({
          supplier_name: purchase.supplier_name,
          invoice_number: purchase.invoice_number,
          purchase_date: purchase.purchase_date,
          payment_mode: purchase.payment_mode,
          purchased_by: purchase.purchased_by,
          discount: purchase.discount,
          invoice_image: null,
          items: purchase.items.map((item: any) => ({
            id: item.id,
            product: item.product.id ?? '' ,
            rate: item.rate,
            item_locations: item.item_locations.map((loc: any) => ({
              id: loc.id,
              location: loc.location.id ?? '',
              quantity: loc.quantity,
            })),
          })),
        });
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [open, purchaseId]);

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
      // Prepare items, convert '' to numbers and filter out empty entries
      const cleanedItems = form.items
        .filter(item => item.product !== '')
        .map(item => ({
          id: item.id,
          product: Number(item.product),
          rate: item.rate,
          item_locations: item.item_locations
            .filter(loc => loc.location !== '')
            .map(loc => ({
              id: loc.id,
              location: Number(loc.location),
              quantity: loc.quantity,
            })),
        }));

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

      const updated = await updatePurchase(purchaseId, payload);
      onSuccess(updated);
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('❌ Purchase update failed:', error);
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
      <DialogTitle>Edit Purchase</DialogTitle>
      <DialogContent dividers>
        {loadingData ? (
          <Box textAlign="center" py={4}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>Purchase Details</Typography>
            <Grid container spacing={1} mb={3}>
              <Grid size={{ xs:12, md:2 }}>
                <TextField
                  label="Purchase Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.purchase_date}
                  onChange={(e) => handleFormChange('purchase_date', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs:12, md:4 }}>
                <TextField
                  label="Supplier Name"
                  fullWidth
                  value={form.supplier_name}
                  onChange={(e) => handleFormChange('supplier_name', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs:12, md:2 }}>
                <TextField
                  label="Invoice Number"
                  fullWidth
                  value={form.invoice_number}
                  onChange={(e) => handleFormChange('invoice_number', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs:12, md:2 }} sx={{ minWidth: 150 }}>
                <Autocomplete
                  options={['Cash', 'Credit', 'Online', 'Card']}
                  value={form.payment_mode}
                  onChange={(_, newValue) => handleFormChange('payment_mode', newValue || '')}
                  renderInput={(params) => <TextField {...params} label="Payment Mode" fullWidth />}
                />
              </Grid>
              <Grid size={{ xs:12, md:2 }} sx={{ minWidth: 150 }}>
                <Autocomplete
                  options={['AZIZIYAH_SHOP', 'ALWAB_SHOP', 'MAIN_STORE', 'JAMSHEER', 'FAWAS', 'IRSHAD', 'MOOSA', 'FATHIH', 'FIROZ']}
                  value={form.purchased_by}
                  onChange={(_, newValue) => handleFormChange('purchased_by', newValue || '')}
                  renderInput={(params) => <TextField {...params} label="Purchased By" fullWidth />}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>Products</Typography>
            {form.items.map((item, index) => {
              const totalQty = item.item_locations.reduce((sum, l) => sum + l.quantity, 0);
              const rowTotal = item.rate * totalQty;

              return (
                <Grid container spacing={1} key={index} alignItems="flex-start">
                  <Grid size={{ xs:12, md:9 }}>
                    <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Grid size={{ xs:12, md:4 }} sx={{ minWidth: 150 }}>
                        <Autocomplete
                          options={products}
                          getOptionLabel={(option) => option.itemName}
                          value={products.find(p => p.id === item.product) || null}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          onChange={(_, newValue) =>
                            handleItemChange(index, 'product', newValue || '')
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Product"
                              fullWidth
                              inputRef={(el) => { productRefs.current[index] = el; }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs:12, md:1.5 }}>
                        <TextField
                          label="Rate"
                          type="number"
                          fullWidth
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', Math.max(0, Number(e.target.value)))}
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                        />
                      </Grid>

                      {item.item_locations.map((loc, locIndex) => (
                        <Grid size={{ xs:12, md:4 }} key={locIndex} sx={{ display: 'flex', gap: 1 }}>
                          <Autocomplete
                            options={locations.filter((l) =>
                              !item.item_locations.some((il, i) => il.location === l.id && i !== locIndex)
                            )}
                            getOptionLabel={(option) => option.name}
                            value={locations.find(l => l.id === loc.location) || null}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
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
                                  inputRef={(el) => { locationRefs.current[key] = el; }}
                                />
                              );
                            }}
                          />
                          <TextField
                            label="Qty"
                            type="number"
                            value={loc.quantity}
                            onChange={(e) => handleItemLocationChange(index, locIndex, 'quantity', Number(e.target.value))}
                            sx={{ width: 80 }}
                            onWheel={(e) => (e.target as HTMLElement).blur()}
                          />
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

                  <Grid size={{ xs:12, md:3 }}>
                    <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Grid size={{ xs:6, md:8 }}>
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
                      <Grid size={{ xs:6, md:4 }}>
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

            <Typography variant="h6" gutterBottom>Summary</Typography>
            <Grid container spacing={1} alignItems="center">
              <Grid size={{ xs:12, md:3 }}>
                <TextField
                  label="Discount"
                  type="number"
                  fullWidth
                  value={form.discount}
                  onChange={(e) => handleFormChange('discount', Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs:12, md:3 }}>
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
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => { resetForm(); onClose(); }} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !isFormValid}>
          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}