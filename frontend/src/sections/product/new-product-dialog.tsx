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
  IconButton,
} from '@mui/material';

import { createProduct, getCategories, getLocations } from 'src/api/products';

import { Iconify } from 'src/components/iconify';

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
    locations: [] as { location_id: string | number; quantity: number }[],
    rate: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setForm((f) => ({ ...f, image: e.target.files![0] }));
  };

  const handleSubmit = async () => {
    console.log('🚀 Submit triggered');

    setLoading(true);
    try {
      const data = new FormData();

      for (const [key, val] of Object.entries(form)) {
        if (key === 'locations') {
          // ✅ Ensure each location_id is a number
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
      
      await createProduct(data);
      onSuccess();
      onClose();
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
    } catch (error: any) {
      console.error('❌ Error submitting product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Product</DialogTitle>
      <DialogContent dividers>
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
