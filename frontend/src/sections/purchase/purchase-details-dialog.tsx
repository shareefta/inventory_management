import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Divider, Table, TableHead, TableRow,
  TableCell, TableBody, Grid, Paper
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  data: any;
  loading: boolean;
}

const PurchaseDetailsDialog = ({ open, onClose, data, loading }: Props) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Purchase Bill Details</DialogTitle>
    <DialogContent dividers>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : data ? (
        <Box component={Paper} variant="outlined" p={2}>
          {/* Supplier + Invoice Details */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Supplier</Typography>
              <Typography>{data.supplier_name}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Invoice Number</Typography>
              <Typography>{data.invoice_number}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Purchase Date</Typography>
              <Typography>{data.purchase_date}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Payment Mode</Typography>
              <Typography>{data.payment_mode}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Product Table */}
          <Typography variant="h6" gutterBottom>Products</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell>Barcode</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Variant</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell>Location-wise Qty</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.product_barcode}</TableCell>
                  <TableCell>{item.product_brand}</TableCell>
                  <TableCell>{item.product_variant}</TableCell>
                  <TableCell align="right">{item.rate}</TableCell>
                  <TableCell>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {item.item_locations.map((loc: any) => (
                        <li key={loc.id}>{loc.location_name}: {loc.quantity}</li>
                      ))}
                    </ul>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Summary */}
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Discount</Typography>
              <Typography>{data.discount}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Total Amount</Typography>
              <Typography>{data.total_amount}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Created By</Typography>
              <Typography>{data.created_by || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2">Created At</Typography>
              <Typography>{data.created_at || '—'}</Typography>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Typography>No data available.</Typography>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default PurchaseDetailsDialog;
