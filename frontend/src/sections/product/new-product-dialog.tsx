import React, { useEffect, useState } from 'react';
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

import { fetchFromBarcodeLookup } from 'src/api/barcode-lookup';
import { createProduct, getCategories, getLocations, getProductByBarcode } from 'src/api/products';

import { Iconify } from 'src/components/iconify';

type Category = { id: number; name: string };
type Location = { id: number; name: string };

type NewProductDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialBarcode?: string;
};

export default function NewProductDialog({ open, onClose, onSuccess, initialBarcode, }: NewProductDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState(initialBarcode || '');

  const [form, setForm] = useState({
    item_name: '',
    brand: '',
    serial_number: '',
    variants: '',
    category_id: '',
    locations: [] as { location_id: string | number; quantity: number }[],
    rate: '',
    selling_price: '',
    active: true,
    image: null as File | null,
    description: '',
  });

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
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files?.[0]) setForm((f) => ({ ...f, image: e.target.files![0] }));
  // };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      setForm((f) => ({ ...f, image: compressedFile }));
    } catch (err) {
      console.error('❌ Image compression failed:', err);
    }
  };

  const handleSubmit = async () => {
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
          } else {
            data.append(key, val as string | Blob);
          }
        }
      }

      if (barcode) {
        data.append('unique_id', barcode);
      }

      await createProduct(data);
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('❌ Error submitting product:', error);
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
      selling_price: '',
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
        selling_price: product.sellingPrice !== undefined && product.sellingPrice !== null ? String(product.sellingPrice) : '',
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

        <TextField
          label="Category"
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          select
          fullWidth
          margin="normal"
          required
        >
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id.toString()}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>

        <Box mt={2}>
          {form.locations.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TextField
                select
                label="Location"
                value={entry.location_id}
                onChange={(e) => {
                  const updated = [...form.locations];
                  updated[index].location_id = e.target.value;
                  setForm((f) => ({ ...f, locations: updated }));
                }}
                sx={{ flex: 1 }}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </MenuItem>
                ))}
              </TextField>

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
            onClick={() =>
              setForm((f) => ({
                ...f,
                locations: [...f.locations, { location_id: '', quantity: 0 }],
              }))
            }
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
        />

        <TextField
          label="Selling Price"
          name="selling_price"
          value={form.selling_price}
          onChange={handleChange}
          type="number"
          fullWidth
          margin="normal"
          required
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
            capture="environment"
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
