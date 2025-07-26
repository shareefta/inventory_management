import type { CategoryEntry } from 'src/sections/category/category-table-row';
import type { CategoryProps } from 'src/sections/category/category-table-row';

import { useEffect, useState } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Select, IconButton, Box, Typography,
  Avatar, Switch, FormControlLabel
} from '@mui/material';

import { updateCategory } from 'src/api/category';

import { Iconify } from 'src/components/iconify';

type CategoryEditDialogProps = {
  open: boolean;
  category: CategoryProps | null;
  onClose: () => void;
  categories: CategoryEntry[];
  onSuccess?: (updatedCategory: CategoryProps) => void;
  onSave?: (updated: CategoryProps) => void;
};

export default function CategoryEditDialog({
  open,
  category,
  onClose,
  onSuccess,
  onSave
}: CategoryEditDialogProps) {
  const [formData, setFormData] = useState<CategoryProps | null>(null);

  useEffect(() => {
    if (!category) return;

    setFormData({ ...category });
  }, [category]);

  const handleFieldChange = (field: keyof CategoryProps, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSubmit = async () => {
    if (!formData) return;

    const form = new FormData();
    form.append('name', formData.name);
    form.append('description', formData.description || '');

    try {
      const updated = await updateCategory(formData.id, formData);
      onSave?.(updated as CategoryProps);
      onSuccess?.(updated as CategoryProps);
      onClose();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Update failed. Please try again.');
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Category</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Item Name" value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} fullWidth />
        <TextField label="Description" value={formData.description} onChange={(e) => handleFieldChange('description', e.target.value)} fullWidth multiline minRows={3} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
