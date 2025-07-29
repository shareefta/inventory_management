import axios from 'axios';
import { useState } from 'react';
import { useSnackbar } from 'notistack';

import { TextField } from '@mui/material';

type Props = {
  onProductFound: (product: any) => void;
  onNotFound: (barcode: string) => void;
};

export default function BarcodeScanner({ onProductFound, onNotFound }: Props) {
  const [barcode, setBarcode] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = barcode.trim();
    if (!trimmed) return;

    const token = localStorage.getItem('token');
    if (!token) {
      enqueueSnackbar('Authentication token missing', { variant: 'error' });
      return;
    }

    try {
      const res = await axios.get(`https://razaworld.uk/api/products/scan/?barcode=${trimmed}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;
      if (data.found) {
        onProductFound(data.product);
      } else {
        onNotFound(trimmed);
      }
    } catch (err) {
      console.error('Barcode scan error:', err);
      enqueueSnackbar('Failed to scan barcode', { variant: 'error' });
    } finally {
      setBarcode('');
    }
  };

  return (
    <form onSubmit={handleScan}>
      <TextField
        label="Scan Barcode"
        value={barcode}
        autoFocus
        fullWidth
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="Scan or enter barcode"
      />
    </form>
  );
}
