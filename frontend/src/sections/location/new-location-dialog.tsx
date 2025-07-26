// src/sections/location/new-location-dialog.tsx
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

import { createLocation, getLocations } from 'src/api/location';

type Location = { id: number; name: string };

type NewLocationDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function NewLocationDialog({ open, onClose, onSuccess }: NewLocationDialogProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([getLocations()])
      .then(([cats]) => {
        setLocations(cats);
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
      await createLocation({
        name: form.name,
      });
      onSuccess();
      onClose();
      setForm({ name: '' });
    } catch (error: any) {
      console.error('❌ Error submitting location:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Location</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Location Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
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
