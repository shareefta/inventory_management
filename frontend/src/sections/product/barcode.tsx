import type { ProductProps } from 'src/sections/product/product-table-row';

import React, { useState, useMemo } from 'react';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: ProductProps;
}

const BarcodeDialog: React.FC<Props> = ({ open, onClose, product }) => {
  const [imageError, setImageError] = useState(false);

  const barcodeUrl = useMemo(() => {
    if (!product?.uniqueId) return '';
    return `https://razaworld.uk/api/products/barcode/${product.uniqueId}/?t=${Date.now()}`;
  }, [product?.uniqueId]);

  if (!product) return null;

  const handlePrint = () => {
    if (!product) return;

    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page { size: 38mm 25mm; margin: 0; }
            body {
              margin: 0;
              padding: 0;
              width: 38mm;
              height: 25mm;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: Arial, sans-serif;
            }
            .label {
              width: 36mm;  /* leave 1mm margin on left and right */
              height: 23mm; /* leave 1mm margin top and bottom */
              border: 1px solid black;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              padding: 1mm;
            }
            .product-name {
              font-size: 9px;
              line-height: 1.1;
              word-wrap: break-word;
              max-height: 3.3em; /* max 3 lines */
            }
            .barcode {
              margin-top: 1px;
              max-width: 100%;
              height: auto;
            }
            .unique-id {
              font-size: 10px;
              margin-top: 1px;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="product-name">${product.itemName}</div>
            <svg id="barcode" class="barcode"></svg>
            <div class="unique-id">${product.uniqueId}</div>
          </div>
          <script>
            JsBarcode("#barcode", "${product.uniqueId}", {
              format: "CODE128",
              width: 2,
              height: 40,
              displayValue: false
            });
            window.print();
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Barcode for {product.itemName}</DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
          <div className="label">
            {imageError ? (
              <Typography color="error">Failed to load barcode.</Typography>
            ) : (
              <>
                <Typography className="product-name">{product.itemName}</Typography>
                <img
                  src={barcodeUrl}
                  alt="Barcode"
                  onError={() => setImageError(true)}
                  className="barcode"
                />
              </>
            )}
          </div>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handlePrint} variant="contained">
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeDialog;