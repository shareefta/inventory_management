import type { ProductProps } from 'src/sections/product/product-table-row';

import { useSnackbar } from 'notistack';
import React, { useEffect, useState, useRef } from 'react';

import {
  Autocomplete,
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
} from '@mui/material';

import { fetchFromBarcodeLookup } from 'src/api/barcode-lookup';
import { createProduct, getCategories, getLocations, getProductByBarcode } from 'src/api/products';

import { Iconify } from 'src/components/iconify';

type Category = { id: number; name: string };
type Location = { id: number; name: string };

type NewProductDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (newProduct: ProductProps) => void;
  initialBarcode?: string;
};

export default function NewProductDialog({ open, onClose, onSuccess, initialBarcode, }: NewProductDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const lastLocationRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    item_name: '',
    brand: '',
    serial_number: '',
    variants: '',
    category_id: '',
    locations: [] as { location_id: string | number; quantity: number }[],
    rate: '',
    active: true,
    image: null as File | null,
    description: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!open) return;
    Promise.all([getCategories(), getLocations()])
      .then(([cats, locs]) => {
        setCategories(cats);
        setLocations(locs);
      })
      .catch(console.error);
  }, [open]);

  useEffect(() => {
    if (open && initialBarcode) {
      setBarcode(initialBarcode);
      handleScan();
    }
  }, [initialBarcode, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.item_name.trim()) newErrors.item_name = 'Item name is required';
    if (!form.category_id) newErrors.category_id = 'Category is required';
    if (form.rate === '' || form.rate === null) {
      newErrors.rate = 'Rate is required';
    } else if (Number(form.rate) < 0) {
      newErrors.rate = 'Rate cannot be negative';
    }

    // if (form.locations.length === 0) {
    //   newErrors.locations = 'At least one location is required';
    // } else {
    //   form.locations.forEach((loc, index) => {
    //     if (!loc.location_id) {
    //       newErrors[`location_${index}`] = 'Location is required';
    //     }
    //     if (!loc.quantity || loc.quantity <= 0) {
    //       newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
    //     }
    //   });
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      enqueueSnackbar('Please fix validation errors.', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();

      for (const [key, val] of Object.entries(form)) {
        if (key === 'locations') {
          const formattedLocations = (val as any[]).map((l) => ({
            location_id: Number(l.location_id),
            quantity: l.quantity,
          }));
          data.append('locations', JSON.stringify(formattedLocations));
        } else if (val !== null) {
          if (key === 'category_id') {
            data.append('category_id', Number(val).toString());
          } else if (key === 'description') {
            data.append('description', val as string);
          } else if (key === 'image' && val instanceof File) {
            data.append('image', val, val.name); // ✅ preserve filename
          } else {
            data.append(key, val as string | Blob);
          }
        }
      }

      if (barcode) {
        data.append('unique_id', barcode);
      }

      const newProduct = await createProduct(data);

      enqueueSnackbar(
        `Product created successfully! ${newProduct.itemName} (${newProduct.uniqueId})`,
        { variant: 'success' }
      );
      onSuccess(newProduct);
      onClose();
      resetForm();
    } catch (error) {
      console.error('❌ Error submitting product:', error);
      enqueueSnackbar(
        `Product creation failed! `, { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      item_name: '',
      brand: '',
      serial_number: '',
      variants: '',
      category_id: '',
      locations: [],
      rate: '',
      active: true,
      image: null,
      description: '',
    });
    setBarcode('');
  };

  const handleScan = async () => {
    if (!barcode) return;

    try {
      const product = await getProductByBarcode(barcode); // your local DB
      setForm((prev) => ({
        ...prev,
        item_name: product.itemName || '',
        brand: product.brand || '',
        serial_number: product.serialNumber || '',
        variants: product.variants || '',
        rate: product.rate !== undefined && product.rate !== null ? String(product.rate) : '',
        description: product.description || '',
        category_id: product.category?.toString() || '',
        image: null,
      }));
    } catch (err) {
      console.warn('⚠️ Not found locally, Please enter manually.');
      try {
        const externalData = await fetchFromBarcodeLookup(barcode);
        // Map external data to your form format
        const mapped = {
          itemName: externalData.title,
          brand: externalData.brand,
          rate: externalData.stores?.[0]?.price || '',
          image: externalData.images?.[0] || '',
          description: externalData.description || '',
        };
        setForm((prev) => ({
          ...prev,
          item_name: externalData.title || '',
          brand: externalData.brand || '',
          rate: externalData.stores?.[0]?.price || '',
          description: externalData.description || '',
          image: null,
        })); // prefill from external source
      } catch (externalError) {
        console.warn('⚠️ External lookup failed. ');
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Product</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Scan Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          fullWidth
          margin="normal"
          disabled={!initialBarcode}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleScan}>
                  <Iconify icon={'solar:barcode-bold' as any} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Item Name"
          name="item_name"
          value={form.item_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          error={!!errors.item_name}
          helperText={errors.item_name}
        />

        <TextField
          label="Brand"
          name="brand"
          value={form.brand}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Serial Number"
          name="serial_number"
          value={form.serial_number}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Variants"
          name="variants"
          value={form.variants}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <Autocomplete
          options={categories}
          getOptionLabel={(option) => option.name}
          value={categories.find((cat) => cat.id.toString() === form.category_id) || null}
          onChange={(_, newValue) => {
            setForm((f) => ({
              ...f,
              category_id: newValue ? newValue.id.toString() : '',
            }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Category"
              fullWidth
              margin="normal"
              required
              error={!!errors.category_id}
              helperText={errors.category_id}
            />
          )}
        />

        <Box mt={2}>
          {form.locations.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={locations}
                getOptionLabel={(option) => option.name}
                value={locations.find((loc) => loc.id === entry.location_id) || null}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => {
                  const updated = [...form.locations];
                  updated[index].location_id = newValue ? newValue.id : '';
                  setForm((f) => ({ ...f, locations: updated }));
                }}
                renderOption={(props, option) => {
                  const isUsed = form.locations.some(
                    (l, i) => i !== index && l.location_id === option.id
                  );
                  return (
                    <li {...props} style={{ opacity: isUsed ? 0.5 : 1, pointerEvents: isUsed ? 'none' : 'auto' }}>
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    fullWidth
                    margin="normal"
                    required
                    // error={!!errors[`location_${index}`]}
                    // helperText={errors[`location_${index}`]}
                    inputRef={index === form.locations.length - 1 ? lastLocationRef : null}
                  />
                )}
              />

              <TextField
                label="Qty"
                type="number"
                value={entry.quantity}
                onChange={(e) => {
                  const updated = [...form.locations];
                  updated[index].quantity = Number(e.target.value);
                  setForm((f) => ({ ...f, locations: updated }));
                }}
                sx={{ width: 100 }}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                // error={!!errors[`quantity_${index}`]}
                // helperText={errors[`quantity_${index}`]}
              />

              <IconButton
                color="error"
                onClick={() => {
                  const updated = form.locations.filter((_, i) => i !== index);
                  setForm((f) => ({ ...f, locations: updated }));
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
              setForm((f) => ({
                ...f,
                locations: [...f.locations, { location_id: '', quantity: 0 }],
              }));

              setTimeout(() => {
                lastLocationRef.current?.focus();
              }, 100);
            }}
          >
            Add Location
          </Button>
        </Box>

        <TextField
          label="Rate"
          name="rate"
          value={form.rate}
          onChange={handleChange}
          type="number"
          fullWidth
          margin="normal"
          required
          error={!!errors.rate}
          helperText={errors.rate}
          onWheel={(e) => (e.target as HTMLElement).blur()}
        />

        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          minRows={3}
        />

        <FormControlLabel
          control={<Checkbox checked={form.active} onChange={handleChange} name="active" />}
          label="Active"
        />

        <Box mt={2}>
          <input
            accept="image/*"
            id="image-upload"
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="image-upload">
            <Button variant="outlined" component="span">
              Upload Image
            </Button>
            {form.image && <span style={{ marginLeft: 8 }}>{form.image.name}</span>}
          </label>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
