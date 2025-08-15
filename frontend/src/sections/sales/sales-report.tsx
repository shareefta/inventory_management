import { useState, useEffect, useMemo } from "react";

import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  TextField,
  MenuItem,
} from "@mui/material";

import { getSales, Sale, deleteSale, getSections, SalesSection } from "src/api/sales";

import SaleEditDialog from "src/sections/sales/sales-edit-dialog";

const paymentModes = ["Cash", "Credit", "Online"] as const;

const SalesReportPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [sections, setSections] = useState<SalesSection[]>([]);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editSale, setEditSale] = useState<Sale | null>(null);

  const [filterSection, setFilterSection] = useState<number | "">("");
  const [filterPayment, setFilterPayment] = useState<typeof paymentModes[number] | "">("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s.name])),
    [sections]
  );

  useEffect(() => {
    loadSales();
    loadSections();
  }, []);

  const loadSales = () => {
    getSales().then((res) => {
      setSales(res.data);
      setFilteredSales(res.data);
    });
  };

  const loadSections = () => {
    getSections().then((res) => setSections(res.data));
  };

  // --- Apply filters ---
  useEffect(() => {
    let filtered = [...sales];

    if (filterSection) filtered = filtered.filter((s) => s.section === filterSection);
    if (filterPayment) filtered = filtered.filter((s) => s.payment_mode === filterPayment);
    if (filterStartDate)
      filtered = filtered.filter(
        (s) => s.sale_datetime && new Date(s.sale_datetime) >= new Date(filterStartDate)
      );
    if (filterEndDate)
      filtered = filtered.filter(
        (s) => s.sale_datetime && new Date(s.sale_datetime) <= new Date(filterEndDate)
      );

    setFilteredSales(filtered);
  }, [sales, filterSection, filterPayment, filterStartDate, filterEndDate]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    try {
      await deleteSale(id);
      loadSales();
    } catch (error) {
      alert("Failed to delete sale");
      console.error(error);
    }
  };

  const totalSales = useMemo(
    () => filteredSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
    [filteredSales]
  );

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        Sales Report - Total: {totalSales.toFixed(2)}
      </Typography>

      {/* --- Filters --- */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          select
          label="Section"
          size="small"
          value={filterSection}
          onChange={(e) => setFilterSection(Number(e.target.value) || "")}
        >
          <MenuItem value="">All</MenuItem>
          {sections.map((sec) => (
            <MenuItem key={sec.id} value={sec.id}>
              {sec.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Payment Mode"
          size="small"
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value as any)}
        >
          <MenuItem value="">All</MenuItem>
          {paymentModes.map((mode) => (
            <MenuItem key={mode} value={mode}>
              {mode}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Start Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
        />

        <TextField
          label="End Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
        />
      </Box>

      {/* --- Sales Table --- */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sl. No.</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Invoice No.</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.map((sale, index) => (
              <TableRow key={sale.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{sectionMap[sale.section] || "Unknown"}</TableCell>
                <TableCell>
                  {sale.sale_datetime ? new Date(sale.sale_datetime).toLocaleString() : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="text"
                    onClick={() => setSelectedSale(sale)}
                  >
                    {sale.invoice_number}
                  </Button>
                </TableCell>
                <TableCell align="right">
                  {Number(sale.total_amount || 0).toFixed(2)}
                </TableCell>
                <TableCell>{sale.created_by || "-"}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => setEditSale(sale)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(sale.id!)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- Sale Details Dialog --- */}
      <Dialog
        open={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Sale Details - {selectedSale?.invoice_number}
          <IconButton
            aria-label="close"
            onClick={() => setSelectedSale(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSale?.items?.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Barcode</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedSale.items.map((item) => (
                  <TableRow key={item.product || item.product_name}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.product_barcode || "-"}</TableCell>
                    <TableCell>{Number(item.price).toFixed(2)}</TableCell>
                    <TableCell>{Number(item.quantity).toFixed(3)}</TableCell>
                    <TableCell>{Number(item.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography>No items found for this sale.</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Sale Edit Dialog --- */}
      {editSale && (
        <SaleEditDialog
          sale={editSale}
          open={!!editSale}
          onClose={() => setEditSale(null)}
          onSaved={() => {
            setEditSale(null);
            loadSales();
          }}
        />
      )}
    </Box>
  );
};

export default SalesReportPage;
