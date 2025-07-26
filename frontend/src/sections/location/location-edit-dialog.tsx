import type { LocationEntry } from 'src/sections/location/location-table-row';
import type { LocationProps } from 'src/sections/location/location-table-row';

import { useEffect, useState } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField
} from '@mui/material';

import { updateLocation } from 'src/api/location';

type LocationEditDialogProps = {
  open: boolean;
  location: LocationProps | null;
  onClose: () => void;
  locations: LocationEntry[];
  onSuccess?: (updatedLocation: LocationProps) => void;
  onSave?: (updated: LocationProps) => void;
};

export default function LocationEditDialog({
  open,
  onClose,
  location,
  onSuccess,
  onSave
}: LocationEditDialogProps) {
  const [formData, setFormData] = useState<LocationProps | null>(null);

  useEffect(() => {
    if (!location) return;

    setFormData({ ...location });
  }, [location]);

  const handleFieldChange = (field: keyof LocationProps, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSubmit = async () => {
    if (!formData) return;

    const form = new FormData();
    form.append('name', formData.name);

    try {
      const updated = await updateLocation(formData.id, formData);
      onSave?.(updated as LocationProps);
      onSuccess?.(updated as LocationProps);
      onClose();
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Update failed. Please try again.');
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Location</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Item Name" value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
