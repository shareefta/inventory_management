// src/sections/product/new-category-dialog.tsx
import React, { useEffect, useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';

import { getCategories } from 'src/api/products';
import { createCategory } from 'src/api/category';

type Category = { id: number; name: string };

type NewCategoryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function NewCategoryDialog({ open, onClose, onSuccess }: NewCategoryDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([getCategories()])
      .then(([cats]) => {
        setCategories(cats);
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
      await createCategory({
        name: form.name,
        description: form.description,
      });
      onSuccess();
      onClose();
      setForm({ name: '', description: '' });
    } catch (error: any) {
      console.error('❌ Error submitting category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Product</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Category Name"
          name="name"
          value={form.name}
          onChange={handleChange}
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
