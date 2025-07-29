import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

type Props = {
  open: boolean;
  onClose: () => void;
  product: {
    uniqueId: string;
    itemName: string;
    brand: string;
    rate: number;
    serialNumber: string;
  };
};

export default function BarcodeDialog({ open, onClose, product }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, product.uniqueId, {
        format: 'CODE128',
        lineColor: '#000',
        width: 1.5,
        height: 40,
        displayValue: false,
        margin: 0,
      });
    }
  }, [product]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head><title>Print Barcode</title></head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>

        <Box
          ref={printRef}
          sx={{
            width: '4cm',
            height: '2cm',
            border: '1px solid #ccc',
            padding: 0.5,
            position: 'relative',
            boxSizing: 'border-box',
            fontSize: 10,
          }}
        >
          <Typography sx={{ position: 'absolute', top: 2, left: 4 }}>{product.itemName}</Typography>
          <Typography sx={{ position: 'absolute', top: 2, right: 4 }}>{product.serialNumber}</Typography>
          <Typography sx={{ position: 'absolute', bottom: 2, left: 4 }}>{product.brand}</Typography>
          <Typography sx={{ position: 'absolute', bottom: 2, right: 4 }}>₹{product.rate}</Typography>

          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg ref={svgRef}/>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handlePrint} variant="contained" color="primary">
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
