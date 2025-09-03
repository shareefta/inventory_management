import debounce from 'lodash/debounce';
import { useEffect, useState, useRef, useMemo } from 'react';

import {
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, CircularProgress, Box, IconButton, Typography
} from '@mui/material';

import { createPurchase } from 'src/api/purchases';
import { getProducts, getLocations } from 'src/api/products';
import { getPaymentModes, getPurchasedBys, PaymentMode, PurchasedBy, PurchaseCreatePayload, getSuppliers } from 'src/api/purchases';

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
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [purchasedBys, setPurchasedBys] = useState<PurchasedBy[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductProps[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const dateRef = useRef<HTMLInputElement>(null);
  const productRefs = useRef<(HTMLInputElement | null)[]>([]);
  const locationRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [errors, setErrors] = useState<{ [key: string]: string }>({});  

  const [form, setForm] = useState({
    supplier_name: '',
    invoice_number: '',
    purchase_date: '',
    payment_mode: null as PaymentMode | null,
    purchased_by: null as PurchasedBy | null,
    discount: 0,
    items: [] as {
      product: ProductProps | null;
      rate: number;
      item_locations: { location: number | null; quantity: number }[];
    }[],
  });

  const resetForm = () => {
    setForm({
      supplier_name: '',
      invoice_number: '',
      purchase_date: '',
      payment_mode: null,
      purchased_by: null,
      discount: 0,
      items: [],
    });
  };

  const grandTotal = form.items.reduce((acc, item) => {
    const qty = item.item_locations.reduce((sum, l) => sum + l.quantity, 0);
    return acc + item.rate * qty;
  }, 0) - form.discount;

  useEffect(() => {
    if (!open) return;

    Promise.all([getProducts(), getLocations(), getPaymentModes(), getPurchasedBys()])
      .then(([prods, locs, modes, bys]) => {
        setProducts(prods.data);
        setLocations(locs);
        setPaymentModes(modes);
        setPurchasedBys(bys);
      })
      .catch(console.error);

    setTimeout(() => {
      dateRef.current?.focus();
    }, 100);
  }, [open]);

  // fetch products from API dynamically based on search
  const fetchProducts = async (search: string) => {
    setLoadingProducts(true);
    try {
      const res = await getProducts(1, 50, search);
      setProductOptions(res.data);
    } catch (err) {
      console.error(err);
      setProductOptions([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // debounce so we don't spam API
  const debouncedFetchProducts = useMemo(() => debounce(fetchProducts, 500), []);

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

  const handleFormChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleItemChange = (
    index: number,
    field: "product" | "rate",
    value: any
  ) => {
    const updated = [...form.items];

    if (field === "product") {
      updated[index].product = value;
      if (value && updated[index].rate === 0) {
        updated[index].rate = value.rate || 0;
      }
      setErrors((prev) => ({ ...prev, [`item_${index}_product`]: "" }));
    }

    if (field === "rate") {
      updated[index].rate = value;
      setErrors((prev) => ({ ...prev, [`item_${index}_rate`]: "" }));
    }

    setForm((f) => ({ ...f, items: updated }));
  };

  const handleItemLocationChange = (
    itemIndex: number,
    locIndex: number,
    field: "location" | "quantity",
    value: number | null
  ) => {
    const updated = [...form.items];

    if (field === "location") {
      // location can be number or null
      updated[itemIndex].item_locations[locIndex].location = value;
    } else {
      // quantity must be number
      updated[itemIndex].item_locations[locIndex].quantity = value ?? 0;
    }

    setForm((f) => ({ ...f, items: updated }));
    setErrors((prev) => ({
      ...prev,
      [`item_${itemIndex}_loc_${locIndex}_${field}`]: "",
    }));
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { product: null, rate: 0, item_locations: [] }] }));
    setTimeout(() => {
      productRefs.current[form.items.length]?.focus();
    }, 100);
  };

  const addLocation = (itemIdx: number) => {
    const updated = [...form.items];
    updated[itemIdx].item_locations.push({ location: null, quantity: 0 });
    setForm(f => ({ ...f, items: updated }));
    setTimeout(() => {
      locationRefs.current[`${itemIdx}-${updated[itemIdx].item_locations.length - 1}`]?.focus();
    }, 100);
  };

  const validateForm = (): boolean => {
    let valid = true;
    const newErrors: { [key: string]: string } = {};

    if (!form.purchase_date) { newErrors.purchase_date = 'Purchase date is required'; valid = false; }
    if (!form.supplier_name) { newErrors.supplier_name = 'Supplier is required'; valid = false; }
    if (!form.invoice_number) { newErrors.invoice_number = 'Invoice number is required'; valid = false; }
    if (!form.payment_mode) { newErrors.payment_mode = 'Payment mode is required'; valid = false; }
    if (!form.purchased_by) { newErrors.purchased_by = 'Purchased by is required'; valid = false; }

    form.items.forEach((item, i) => {
      if (!item.product) { newErrors[`item_${i}_product`] = 'Product is required'; valid = false; }
      if (item.rate <= 0) { newErrors[`item_${i}_rate`] = 'Rate must be greater than 0'; valid = false; }
      if (item.item_locations.length === 0) { newErrors[`item_${i}_loc`] = 'At least one location is required'; valid = false; }
      item.item_locations.forEach((loc, j) => {
        if (!loc.location) { newErrors[`item_${i}_loc_${j}_location`] = 'Location is required'; valid = false; }
        if (loc.quantity <= 0) { newErrors[`item_${i}_loc_${j}_quantity`] = 'Quantity must be > 0'; valid = false; }
      });
    });

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const cleanedItems = form.items
        .filter(item => item.product)
        .map(item => ({
          product_id: Number(item.product!.id),
          rate: item.rate,
          item_locations: item.item_locations
            .filter(loc => loc.location !== null)
            .map(loc => ({ location: Number(loc.location), quantity: loc.quantity })),
        }));

      const payload: PurchaseCreatePayload = {
        supplier_name: form.supplier_name,
        invoice_number: form.invoice_number,
        purchase_date: form.purchase_date,
        discount: form.discount,
        payment_mode_id: form.payment_mode!.id!,
        purchased_by_id: form.purchased_by!.id!,
        total_amount: grandTotal,
        items: cleanedItems,
      };

      await createPurchase(payload);
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('❌ Purchase create failed:', error);
      if (error.response?.data) console.error('📩 Server response:', error.response.data);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = form.items.length > 0 && form.items.every(item => item.product && item.item_locations.length > 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Create New Purchase</DialogTitle>
      <DialogContent dividers>
        {/* Purchase Details */}
        <Typography variant="h6" gutterBottom>Purchase Details</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            label="Purchase Date"
            type="date"
            value={form.purchase_date}
            onChange={e => handleFormChange('purchase_date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
            inputRef={dateRef}
            error={!!errors.purchase_date}
            helperText={errors.purchase_date}
          />
          <Autocomplete
            freeSolo
            options={suppliers}
            value={form.supplier_name}
            onChange={(_, val) => handleFormChange('supplier_name', val ?? '')}
            onInputChange={(_, val) => handleFormChange('supplier_name', val)}
            loading={loadingSuppliers}
            sx={{ minWidth: 200 }}
            renderInput={params => (
              <TextField {...params} label="Supplier Name" fullWidth
                error={!!errors.supplier_name}
                helperText={errors.supplier_name}
                InputProps={{ ...params.InputProps, endAdornment: loadingSuppliers ? <CircularProgress size={20} /> : params.InputProps.endAdornment }}
              />
            )}
          />
          <TextField
            label="Invoice Number"
            value={form.invoice_number}
            onChange={e => handleFormChange('invoice_number', e.target.value)}
            sx={{ minWidth: 150 }}
            error={!!errors.invoice_number}
            helperText={errors.invoice_number}
          />
          <Autocomplete
            options={paymentModes}
            getOptionLabel={option => option.name}
            value={form.payment_mode}
            onChange={(_, val) => handleFormChange('payment_mode', val)}
            sx={{ minWidth: 200 }}
            renderInput={params => (
              <TextField
                {...params}
                label="Payment Mode"
                fullWidth
                error={!!errors.payment_mode}
                helperText={errors.payment_mode}
              />
            )}
          />

          <Autocomplete
            options={purchasedBys}
            getOptionLabel={option => option.name}
            value={form.purchased_by}
            onChange={(_, val) => handleFormChange('purchased_by', val)}
            sx={{ minWidth: 200 }}
            renderInput={params => (
              <TextField
                {...params}
                label="Purchased By"
                fullWidth
                error={!!errors.purchased_by}
                helperText={errors.purchased_by}
              />
            )}
          />
        </Box>

        {/* Add Item Button */}
        <Box textAlign="right" mb={1}>
          <Button variant="contained" onClick={() =>
            setForm(f => ({ ...f, items: [...f.items, { product: null, rate: 0, item_locations: [] }] }))
          }>+ Add Item</Button>
        </Box>

        {/* Products Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ccc' }}>Sl. No.</th>
                <th style={{ border: '1px solid #ccc' }}>Item Name</th>
                <th style={{ border: '1px solid #ccc' }}>Rate</th>
                <th style={{ border: '1px solid #ccc' }}>Location & Qty</th>
                <th style={{ border: '1px solid #ccc' }}>Total Qty</th>
                <th style={{ border: '1px solid #ccc' }}>Item Total</th>
                <th style={{ border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => {
                const totalQty = item.item_locations.reduce((sum, l) => sum + l.quantity, 0);
                const rowTotal = totalQty * item.rate;
                return (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ textAlign: 'center', padding: 8, border: '1px solid #ccc' }}>{idx + 1}</td>
                    <td style={{ padding: 8, minWidth: 350, border: '1px solid #ccc' }}>
                      <Autocomplete
                        options={productOptions}
                        loading={loadingProducts}
                        getOptionLabel={(option) =>
                          `${option.itemName} | ${option.uniqueId} | ${option.serialNumber}`
                        }
                        value={item.product}
                        onChange={(_, val) => handleItemChange(idx, "product", val)}
                        onInputChange={(_, val) => debouncedFetchProducts(val)}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label="Product"
                            fullWidth
                            inputRef={el => productRefs.current[idx] = el}
                            error={!!errors[`item_${idx}_product`]}
                            helperText={errors[`item_${idx}_product`]}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingProducts && <CircularProgress size={20} />}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </td>
                    <td style={{ padding: 8, width: 100, border: '1px solid #ccc' }}>
                      <TextField
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(idx, "rate", Math.max(0, Number(e.target.value) || 0))
                        }
                        fullWidth
                        error={!!errors[`item_${idx}_rate`]}
                        helperText={errors[`item_${idx}_rate`]}
                      />
                    </td>
                    <td style={{ padding: 8, minWidth: 300, border: '1px solid #ccc' }}>
                      {item.item_locations.map((loc, locIdx) => (
                        <Box key={locIdx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                          <Autocomplete
                            options={locations.filter(
                              (l) =>
                                !item.item_locations.some(
                                  (il, i) => il.location === l.id && i !== locIdx
                                )
                            )}
                            getOptionLabel={(option) => option.name}
                            value={locations.find((l) => l.id === loc.location) || null}
                            onChange={(_, newVal) =>
                              handleItemLocationChange(idx, locIdx, "location", newVal ? newVal.id : null)
                            }
                            sx={{ flex: 2 }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Location"
                                error={!!errors[`item_${idx}_loc_${locIdx}_location`]}
                                helperText={errors[`item_${idx}_loc_${locIdx}_location`]}
                              />
                            )}
                          />

                          <TextField
                            type="number"
                            value={loc.quantity}
                            onChange={(e) =>
                              handleItemLocationChange(idx, locIdx, "quantity", Number(e.target.value))
                            }
                            sx={{ width: 80 }}
                            error={!!errors[`item_${idx}_loc_${locIdx}_quantity`]}
                            helperText={errors[`item_${idx}_loc_${locIdx}_quantity`]}
                          />
                          <IconButton size="small" onClick={() => {
                            const updated = [...form.items];
                            updated[idx].item_locations.splice(locIdx, 1);
                            setForm(f => ({ ...f, items: updated }));
                          }}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
                        </Box>
                      ))}
                      <Button size="small" variant="text" onClick={() => {
                        const updated = [...form.items];
                        updated[idx].item_locations.push({ location: null, quantity: 0 });
                        setForm(f => ({ ...f, items: updated }));
                        setTimeout(() => {
                          const key = `item_${idx}_loc_${item.item_locations.length}_location`;
                          locationRefs.current[key]?.focus();
                        }, 100);
                      }}>+ Store</Button>
                      {errors[`item_${idx}_loc`] && <Typography color="error">{errors[`item_${idx}_loc`]}</Typography>}
                    </td>
                    <td style={{ textAlign: 'center', padding: 8, border: '1px solid #ccc' }}>{totalQty}</td>
                    <td style={{ textAlign: 'center', padding: 8, border: '1px solid #ccc' }}>{rowTotal.toFixed(2)}</td>
                    <td style={{ padding: 8, border: '1px solid #ccc' }}>
                      <Button size="small" onClick={() => {
                        const updated = [...form.items, { product: null, rate: 0, item_locations: [] }];
                        setForm(f => ({ ...f, items: updated }));
                        setTimeout(() => productRefs.current[updated.length - 1]?.focus(), 100);
                      }}>+ Item</Button>
                      <Button size="small" color="error" onClick={() => {
                        const updated = [...form.items];
                        updated.splice(idx, 1);
                        setForm(f => ({ ...f, items: updated }));
                      }} sx={{ ml: 1 }}>- Item</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>

        {/* Summary */}
        <Typography variant="h6" gutterBottom mt={2}>Summary</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
          <TextField
            label="Discount"
            type="number"
            value={form.discount}
            onChange={e => handleFormChange('discount', Number(e.target.value))}
            sx={{ minWidth: 150 }}
          />
          <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, textAlign: 'center', minWidth: 150, backgroundColor: '#f9f9f9' }}>
            <Typography variant="subtitle2">Grand Total</Typography>
            <Typography variant="h6">{grandTotal.toFixed(2)}</Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => { resetForm(); onClose(); }} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
