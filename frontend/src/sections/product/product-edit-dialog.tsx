import type { LocationEntry, CategoryEntry } from 'src/sections/product/product-table-row';
import type { ProductProps, ProductLocationEntry } from 'src/sections/product/product-table-row';

import { useEffect, useState } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Select, IconButton, Box, Typography,
  Avatar, Switch, FormControlLabel
} from '@mui/material';

import { updateProduct } from 'src/api/products';

import { Iconify } from 'src/components/iconify';

type ProductEditDialogProps = {
  open: boolean;
  product: ProductProps | null;
  onClose: () => void;
  categories: CategoryEntry[];
  locations: LocationEntry[];
  onSuccess?: (updatedProduct: ProductProps) => void; // optional callback
  onSave?: (updated: ProductProps) => void;
};

export default function ProductEditDialog({
  open,
  product,
  onClose,
  categories,
  locations,
  onSuccess,
  onSave
}: ProductEditDialogProps) {
  const [formData, setFormData] = useState<ProductProps | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;

    setFormData({ ...product });

    if (product.image instanceof File) {
      const url = URL.createObjectURL(product.image);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(product.image ?? null);
    }
  }, [product]);

  const handleFieldChange = (field: keyof ProductProps, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleLocationChange = (index: number, key: 'location' | 'quantity', value: any) => {
    if (!formData) return;
    const updatedLocations = [...formData.locations];
    if (key === 'location') {
      const selected = locations.find((loc) => loc.id === Number(value));
      if (selected) updatedLocations[index] = { ...updatedLocations[index], location: selected };
    } else {
      updatedLocations[index] = { ...updatedLocations[index], quantity: Number(value) };
    }
    setFormData({ ...formData, locations: updatedLocations });
  };

  const handleAddLocation = () => {
    if (!formData) return;
    const newEntry: ProductLocationEntry = {
      location: { id: 0, name: '' },
      quantity: 0,
    };
    setFormData({ ...formData, locations: [...formData.locations, newEntry] });
  };

  const handleRemoveLocation = (index: number) => {
    if (!formData) return;
    const updated = formData.locations.filter((_, i) => i !== index);
    setFormData({ ...formData, locations: updated });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => prev ? { ...prev, image: file } : prev);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSubmit = async () => {
    if (!formData) return;

    const form = new FormData();
    form.append('item_name', formData.itemName);
    form.append('brand', formData.brand);
    form.append('serial_number', formData.serialNumber);
    form.append('variants', formData.variants);
    form.append('rate', formData.rate.toString());
    form.append('selling_price', formData.sellingPrice.toString());
    form.append('active', formData.active.toString());
    form.append('description', formData.description || '');

    const selectedCategory = categories.find(cat => cat.name === formData.category);
    if (selectedCategory) {
      form.append('category_id', selectedCategory.id.toString());
    }

    if (formData.image instanceof File) {
      form.append('image', formData.image);
    }

    const locationsPayload = formData.locations.map(loc => ({
      location_id: loc.location.id,
      quantity: loc.quantity
    }));
    form.append('locations', JSON.stringify(locationsPayload));

    try {
      const updated = await updateProduct(formData.id.toString(), form, true);
      onSave?.(updated);
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Update failed. Please try again.');
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Product</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Item Name" value={formData.itemName} onChange={(e) => handleFieldChange('itemName', e.target.value)} fullWidth />
        <TextField label="Brand" value={formData.brand} onChange={(e) => handleFieldChange('brand', e.target.value)} fullWidth />
        <TextField label="Serial Number" value={formData.serialNumber} onChange={(e) => handleFieldChange('serialNumber', e.target.value)} fullWidth />
        <TextField label="Variants" value={formData.variants} onChange={(e) => handleFieldChange('variants', e.target.value)} fullWidth />
        <TextField label="Rate" type="number" value={formData.rate} onChange={(e) => handleFieldChange('rate', Number(e.target.value))} fullWidth />
        <TextField label="Selling Price" type="number" value={formData.sellingPrice} onChange={(e) => handleFieldChange('sellingPrice', Number(e.target.value))} fullWidth />

        <Select fullWidth value={formData.category} onChange={(e) => handleFieldChange('category', e.target.value)}>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
          ))}
        </Select>

        <TextField label="Description" value={formData.description} onChange={(e) => handleFieldChange('description', e.target.value)} fullWidth multiline minRows={3} />

        <Box display="flex" alignItems="center" gap={2}>
          <Avatar variant="rounded" src={previewUrl || '/assets/images/fallback-image.png'} sx={{ width: 64, height: 64 }} />
          <Button variant="outlined" component="label">
            Upload Image
            <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
          </Button>
        </Box>

        <FormControlLabel
          control={<Switch checked={formData.active} onChange={(e) => handleFieldChange('active', e.target.checked)} color="primary" />}
          label="Active"
        />

        <Typography variant="subtitle1" mt={2}>Locations</Typography>
        {formData.locations.map((entry, index) => (
          <Box key={index} display="flex" gap={1} alignItems="center">
            <Select size="small" value={entry.location.id} onChange={(e) => handleLocationChange(index, 'location', e.target.value)} sx={{ flex: 1 }}>
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
              ))}
            </Select>
            <TextField size="small" type="number" value={entry.quantity} onChange={(e) => handleLocationChange(index, 'quantity', e.target.value)} sx={{ width: 100 }} />
            <IconButton color="error" onClick={() => handleRemoveLocation(index)}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
          </Box>
        ))}
        <Button size="small" variant="outlined" onClick={handleAddLocation}>Add Location</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
