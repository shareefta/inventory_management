import type { ProductProps } from 'src/sections/product/product-table-row';

import { useEffect, useState, useRef } from 'react';

import {
  Grid, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Box, IconButton, Typography, Autocomplete, Snackbar, Alert
} from '@mui/material';

import { getProducts, getLocations } from 'src/api/products';
import { PurchaseProps, updatePurchase, getPurchase, PaymentMode, PurchasedBy, PurchaseUpdatePayload, getPaymentModes, getPurchasedBys, getSuppliers } from 'src/api/purchases';

import { Iconify } from 'src/components/iconify';

type Location = { id: number; name: string };

// Form-specific types (object-based)
type PurchaseFormItemLocation = { id?: number; location: Location | null; quantity: number };
type PurchaseFormItem = { id?: number; product: ProductProps | null; rate: number; item_locations: PurchaseFormItemLocation[] };
type PurchaseForm = {
  supplier_name: string;
  invoice_number: string;
  purchase_date: string;
  payment_mode: PaymentMode | null;
  purchased_by: PurchasedBy | null;
  discount: number;
  invoice_image: string | null;
  items: PurchaseFormItem[];
};

type PurchaseEditDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: PurchaseProps) => void;
  purchaseId: number;
};

export default function PurchaseEditDialog({ open, onClose, onSuccess, purchaseId }: PurchaseEditDialogProps) {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [purchasedBys, setPurchasedBys] = useState<PurchasedBy[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const productRefs = useRef<(HTMLInputElement | null)[]>([]);
  const locationRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [form, setForm] = useState<PurchaseForm>({
    supplier_name: '',
    invoice_number: '',
    purchase_date: '',
    payment_mode: null,
    purchased_by: null,
    discount: 0,
    invoice_image: null,
    items: [],
  });

  useEffect(() => {
    if (!open) return;

    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const res = await getSuppliers();
        setSuppliers(res);
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [open]);

  // Load initial data and purchase
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoadingData(true);

      try {
        const [prodsRes, locsRes, paymentModesRes, purchasedBysRes, purchase] = await Promise.all([
          getProducts(),
          getLocations(),
          getPaymentModes(),
          getPurchasedBys(),
          getPurchase(purchaseId),
        ]);

        const productsData = prodsRes.data || prodsRes;
        const locationsData: Location[] = locsRes || [];
        const paymentModesData: PaymentMode[] = paymentModesRes || [];
        const purchasedBysData: PurchasedBy[] = purchasedBysRes || [];

        setProducts(productsData);
        setLocations(locationsData);
        setPaymentModes(paymentModesData);
        setPurchasedBys(purchasedBysData);

        // Map purchase items using freshly fetched arrays
        const mappedItems: PurchaseFormItem[] = purchase.items.map((item: any) => ({
          id: item.id,
          product: productsData.find(p => p.id === item.product) || null,
          rate: item.rate,
          item_locations: item.item_locations.map((loc: any) => ({
            id: loc.id,
            location: locationsData.find(l => l.id === loc.location) || null,
            quantity: loc.quantity,
          })),
        }));

        // Map current payment_mode / purchased_by to options
      const selectedPaymentMode = paymentModesData.find(pm => pm.id === purchase.payment_mode?.id) || null;
      const selectedPurchasedBy = purchasedBysData.find(pb => pb.id === purchase.purchased_by?.id) || null;

        setForm({
          supplier_name: purchase.supplier_name,
          invoice_number: purchase.invoice_number,
          purchase_date: purchase.purchase_date,
          payment_mode: selectedPaymentMode,
          purchased_by: selectedPurchasedBy,
          discount: purchase.discount,
          invoice_image: null,
          items: mappedItems,
        });
      } catch (error) {
        console.error('Failed to fetch purchase data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [open, purchaseId]);

  const resetForm = () => setForm({ supplier_name: '', invoice_number: '', purchase_date: '', payment_mode: null, purchased_by: null, discount: 0, invoice_image: null, items: [] });

  const grandTotal = form.items.reduce((acc, item) => {
    const qty = item.item_locations.reduce((sum, l) => sum + l.quantity, 0);
    return acc + item.rate * qty;
  }, 0) - form.discount;

  const handleFormChange = (field: keyof PurchaseForm, value: any) => setForm(f => ({ ...f, [field]: value }));
  
  const handleItemChange = (itemIndex: number, field: keyof PurchaseFormItem, value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === itemIndex ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleItemLocationChange = (
    itemIndex: number,
    locIndex: number,
    field: keyof PurchaseFormItemLocation,
    value: any
  ) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== itemIndex) return item;
        return {
          ...item,
          item_locations: item.item_locations.map((loc, j) =>
            j === locIndex ? { ...loc, [field]: value } : loc
          ),
        };
      }),
    }));
  };

  const handleSubmit = async () => {
    if (!form.payment_mode || !form.purchased_by) {
      setSnackbar({ open: true, message: 'Please select Payment Mode and Purchased By', severity: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Filter and map items safely
      const cleanedItems: PurchaseUpdatePayload['items'] = form.items
      .filter(item => item.product && item.item_locations.length > 0)
      .map(item => {
        const productId = (item.product as ProductProps).id;

        const cleanedLocations = item.item_locations
          .filter(loc => loc.location && loc.quantity > 0)
          .map(loc => ({
            id: loc.id ?? undefined, // preserve id if exists
            location: typeof loc.location === 'object' ? (loc.location as Location).id : loc.location,
            quantity: Number(loc.quantity),
          }));

        return {
          id: item.id ?? undefined, // preserve item id if exists
          product: Number(productId),
          rate: Number(item.rate) || 0,
          item_locations: cleanedLocations,
        };
      })
      .filter(item => item.item_locations.length > 0);

      if (cleanedItems.length === 0) {
        setSnackbar({ open: true, message: 'Please add at least one product with valid stock', severity: 'error' });
        setLoading(false);
        return;
      }

      const payload: PurchaseUpdatePayload = {
        supplier_name: form.supplier_name,
        invoice_number: form.invoice_number,
        purchase_date: form.purchase_date,
        discount: Number(form.discount) || 0,
        invoice_image: form.invoice_image || null,
        payment_mode_id: form.payment_mode.id!,
        purchased_by_id: form.purchased_by.id!,
        total_amount: grandTotal,
        items: cleanedItems,
      };

      const updated = await updatePurchase(purchaseId, payload);

      setSnackbar({ open: true, message: 'Purchase updated successfully', severity: 'success' });
      onSuccess(updated);
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('❌ Purchase update failed:', error);
      setSnackbar({ open: true, message: 'Failed to update purchase', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = form.items.some(item => item.product && item.item_locations.length > 0);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Edit Purchase</DialogTitle>
        <DialogContent dividers>
          {loadingData ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
            <>
              {/* Purchase Details */}
              <Typography variant="h6" gutterBottom>Purchase Details</Typography>
              <Grid container spacing={1} mb={3}>
                <Grid size={{ xs: 12, md: 2 }} >
                  <TextField label="Purchase Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.purchase_date} onChange={e => handleFormChange('purchase_date', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    freeSolo
                    options={suppliers}
                    value={form.supplier_name}
                    onChange={(_, val) => handleFormChange('supplier_name', val ?? '')}
                    onInputChange={(_, val) => handleFormChange('supplier_name', val)}
                    loading={loadingSuppliers}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Supplier Name"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingSuppliers ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }} >
                  <TextField label="Invoice Number" fullWidth value={form.invoice_number} onChange={e => handleFormChange('invoice_number', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }} >
                  <Autocomplete
                    options={paymentModes}
                    getOptionLabel={o => o.name}
                    value={form.payment_mode}
                    onChange={(_, val) => handleFormChange('payment_mode', val)}
                    renderInput={params => <TextField {...params} label="Payment Mode" fullWidth />}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }} >
                  <Autocomplete
                    options={purchasedBys}
                    getOptionLabel={o => o.name}
                    value={form.purchased_by}
                    onChange={(_, val) => handleFormChange('purchased_by', val)}
                    renderInput={params => <TextField {...params} label="Purchased By" fullWidth />}
                  />
                </Grid>
              </Grid>

              {/* Products */}
              <Typography variant="h6" gutterBottom>Products</Typography>
              {form.items.map((item, index) => {
                const totalQty = item.item_locations.reduce((sum, l) => sum + l.quantity, 0);
                const rowTotal = item.rate * totalQty;

                return (
                  <Grid container spacing={1} key={index} alignItems="flex-start">
                    <Grid size={{ xs: 12, md: 9 }} >
                      <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, md: 4 }} >
                          <Autocomplete
                            options={products}
                            getOptionLabel={p => p.itemName}
                            value={item.product}
                            onChange={(_, val) => handleItemChange(index, 'product', val)}
                            renderInput={params => <TextField {...params} label="Product" fullWidth inputRef={el => { productRefs.current[index] = el; }} />}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.5 }}>
                          <TextField label="Rate" type="number" fullWidth value={item.rate} onChange={e => handleItemChange(index, 'rate', Number(e.target.value))} onWheel={e => (e.target as HTMLElement).blur()} />
                        </Grid>

                        {item.item_locations.map((loc, locIndex) => (
                          <Grid size={{ xs: 12, md: 4 }} key={locIndex} sx={{ display: 'flex', gap: 1 }}>
                            <Autocomplete
                              options={locations.filter(l => !item.item_locations.some((il, i) => il.location?.id === l.id && i !== locIndex))}
                              getOptionLabel={l => l.name}
                              value={loc.location}
                              onChange={(_, val) => handleItemLocationChange(index, locIndex, 'location', val)}
                              renderInput={params => <TextField {...params} label="Location" sx={{ flex: 1, minWidth: 150 }} inputRef={el => { locationRefs.current[`${index}-${locIndex}`] = el; }} />}
                            />
                            <TextField label="Qty" type="number" value={loc.quantity} onChange={e => handleItemLocationChange(index, locIndex, 'quantity', Number(e.target.value))} sx={{ width: 80 }} onWheel={e => (e.target as HTMLElement).blur()} />
                            <IconButton onClick={() => {
                              const updated = [...form.items];
                              updated[index].item_locations = updated[index].item_locations.filter((_, i) => i !== locIndex);
                              setForm(f => ({ ...f, items: updated }));
                            }}>
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Grid>
                        ))}

                        <Button
                          variant="text"
                          size="small"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              items: prev.items.map((itm, i) =>
                                i === index
                                  ? {
                                      ...itm,
                                      item_locations: [
                                        ...itm.item_locations,
                                        { id: undefined, location: null, quantity: 0 }, // id undefined for new rows
                                      ],
                                    }
                                  : itm
                              ),
                            }));

                            // Correct focus: new row is last index
                            setTimeout(() => {
                              const newLocIndex = form.items[index].item_locations.length;
                              locationRefs.current[`${index}-${newLocIndex}`]?.focus();
                            }, 100);
                          }}
                        >
                          + Stock
                        </Button>
                      </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6, md: 8 }} >
                          <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, textAlign: 'center', bgcolor: '#f9f9f9' }}>
                            <Typography variant="subtitle2">Product Total</Typography>
                            <Typography sx={{ minWidth: 150 }} fontWeight="bold">{rowTotal.toFixed(2)}</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, md: 4 }}>
                          <IconButton onClick={() => {
                            const updated = [...form.items];
                            updated.splice(index, 1);
                            setForm(f => ({ ...f, items: updated }));
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
                <Button variant="contained" onClick={() => {
                  setForm(f => ({ ...f, items: [...f.items, { product: null, rate: 0, item_locations: [] }] }));
                  setTimeout(() => { productRefs.current[productRefs.current.length - 1]?.focus(); }, 100);
                }}>+ Add Item</Button>
              </Box>

              {/* Summary */}
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Grid container spacing={1} alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Discount" type="number" fullWidth value={form.discount} onChange={e => handleFormChange('discount', Number(e.target.value))} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, textAlign: 'center', bgcolor: '#f9f9f9' }}>
                    <Typography variant="subtitle2">Grand Total</Typography>
                    <Typography sx={{ minWidth: 150 }} variant="h6">{grandTotal.toFixed(2)}</Typography>
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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
