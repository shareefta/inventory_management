import type { ProductProps } from 'src/sections/product/product-table-row';

import { useMemo, useState } from 'react';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: ProductProps;
}

const BarcodeDialog = ({ open, onClose, product }: Props) => {
  const [imageError, setImageError] = useState(false);

  // Always call hooks, even if product is undefined
  const barcodeUrl = useMemo(() => {
    if (!product?.uniqueId) return null;
    return `https://razaworld.uk/api/products/barcode/${product.uniqueId}/?t=${Date.now()}`;
  }, [product?.uniqueId]);

  if (!product || !product.uniqueId) {
    return null; // Safe to return after hooks are called
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Barcode for {product.itemName}</DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
          {imageError ? (
            <Typography color="error">Failed to load barcode.</Typography>
          ) : (
            <img
              src={barcodeUrl || ''}
              alt="Barcode"
              onError={() => setImageError(true)}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          )}
          <Typography variant="caption" mt={1}>
            {product.uniqueId}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={() => window.print()} variant="contained" aria-label="Print barcode">
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeDialog;
