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
    <DialogTitle sx={{ backgroundColor: '#f0f4ff' }}>Purchase Bill Details</DialogTitle>
    <DialogContent dividers sx={{ backgroundColor: '#fafafa' }}>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : data ? (
        <Box component={Paper} variant="outlined" p={2}>
          <Box sx={{ backgroundColor: '#e3f2fd', p: 2, borderRadius: 1, mb: 2 }}>
            {/* Supplier + Invoice Details */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Supplier</Typography>
                <Typography><strong>{data.supplier_name}</strong></Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Invoice Number</Typography>
                <Typography><strong>{data.invoice_number}</strong></Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Purchase Date</Typography>
                <Typography><strong>{data.purchase_date}</strong></Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Payment Mode</Typography>
                <Typography><strong>{data.payment_mode}</strong></Typography>
              </Grid>
            </Grid>
          </Box>          

          <Divider sx={{ my: 2 }} />

          {/* Product Table */}
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>Products</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#bbdefb' }}>
                <TableCell>Sl. No.</TableCell>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell>Barcode</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Variant</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell>Qty</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((item: any, index: number) => (
                <TableRow key={item.id} sx={{ backgroundColor: index % 2 === 0 ? '#f9fbe7' : '#ffffff', }}>
                  <TableCell>{index + 1}</TableCell>
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
          <Divider sx={{ my: 3 }} />
          <Box sx={{ backgroundColor: '#e8f5e9', p: 2, borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Discount</Typography>
                <Typography>{data.discount}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Total Amount</Typography>
                <Typography><strong>{data.total_amount}</strong></Typography>
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
