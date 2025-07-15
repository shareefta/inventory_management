// src/sections/product/new-product-dialog.tsx
import React, { useEffect, useState } from 'react';

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
} from '@mui/material';

import { createProduct, getCategories, getLocations } from 'src/api/products';

type Category = { id: number; name: string };
type Location = { id: number; name: string };

type NewProductDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function NewProductDialog({ open, onClose, onSuccess }: NewProductDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    item_name: '',
    brand: '',
    serial_number: '',
    variants: '',
    category_id: '',
    location_id: '',
    rate: '',
    quantity: '',
    active: true,
    image: null as File | null,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setForm((f) => ({ ...f, image: e.target.files![0] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      for (const [key, val] of Object.entries(form)) {
        if (val !== null) data.append(key, val as string | Blob);
      }
      await createProduct(data);
      onSuccess();
      onClose();
      setForm({
        item_name: '',
        brand: '',
        serial_number: '',
        variants: '',
        category_id: '',
        location_id: '',
        rate: '',
        quantity: '',
        active: true,
        image: null,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Product</DialogTitle>
      <DialogContent dividers>
        {/* Similar form fields as shown earlier */}
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
        <TextField
          label="Location"
          name="location_id"
          value={form.location_id}
          onChange={handleChange}
          select
          fullWidth
          margin="normal"
          required
        >
          {locations.map((loc) => (
            <MenuItem key={loc.id} value={loc.id.toString()}>
              {loc.name}
            </MenuItem>
          ))}
        </TextField>
        {/* Add rate, quantity, active checkbox, image upload */}
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
          label="Quantity"
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
          type="number"
          fullWidth
          margin="normal"
          required
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
          {loading ? 'Saving...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
