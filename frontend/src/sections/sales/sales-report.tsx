import type { InvoicePrintProps } from "src/sections/sales/sales-invoice";

import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useState, useEffect, useMemo, useRef  } from "react";

import UndoIcon from "@mui/icons-material/Undo";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import {
  Box, Table, TableHead, TableBody, TableCell, TableRow,
  TableContainer, Paper, Typography, TextField, MenuItem,
  Breadcrumbs, Link, Stack, Select, InputLabel, FormControl,
  Fab, Pagination, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip, Button as MuiButton,
} from "@mui/material";

import { getSales, getSale, Sale, deleteSale, getSections, SalesSection } from "src/api/sales";

import PosReceipt from "src/sections/sales/sales-invoice";

const paymentModes = ["Cash", "Credit", "Bank", "Wallet"] as const;

const SalesReportPage = () => {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("info");

  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [sections, setSections] = useState<SalesSection[]>([]);

  const [filterSection, setFilterSection] = useState<number | "">("");
  const [filterPayment, setFilterPayment] = useState<typeof paymentModes[number] | "">("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSaleId, setDeleteSaleId] = useState<number | null>(null);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const [filterInvoiceMobile, setFilterInvoiceMobile] = useState("");

  const [invoiceData, setInvoiceData] = useState<InvoicePrintProps | null>(null);

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning" = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    loadSales();
    loadSections();
  }, []);

  const loadSales = () => {
    getSales().then((salesData) => {
      setSales(salesData);
      setFilteredSales(salesData);
    });
  };

  const loadSections = () => {
    getSections().then((fetchedSections) => setSections(fetchedSections));
  };

  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s.name])),
    [sections]
  );

  const handleOpenReturnPage = (sale: Sale) => {
    navigate(`/sales/new-sales-return/${sale.id}`, { state: { sale } });
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: "POS Receipt",
    pageStyle: `
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; padding: 0; }
    `,
  });

  const printInvoice = async (saleId: number) => {
    try {
      const sale = await getSale(saleId);
      if (!sale) return;

      // Try to resolve full section object
      let sectionObj: SalesSection;
      if (typeof sale.section === "object") {
        sectionObj = sale.section;
      } else {
        sectionObj =
          sections.find((s) => s.id === sale.section) || {
            id: sale.section,
            name: "Unknown Section",
            logo: "",
            building_no: "",
            street_no: "",
            zone_no: "",
            place: "Doha",
            channel: { id: 0, name: "" },
            location: 0,
          };
      }

      const invoiceProps: InvoicePrintProps = {
        invoiceNumber: sale.invoice_number || "N/A",
        section: sectionObj,
        date: sale.sale_datetime || new Date().toISOString(),
        customerName: sale.customer_name || "",
        customerMobile: sale.customer_mobile || "",
        items: (sale.items || []).map((i: any) => ({
          name: i.product_name || "",
          barcode: i.product_barcode || "",
          qty: i.quantity || 0,
          price: i.price || 0,
          total: i.total || 0,
        })),
        discount: sale.discount || 0,
        grandTotal: sale.total_amount || 0,
        cashier: sale.created_by || "Unknown",
      };

      setInvoiceData(invoiceProps);
      setTimeout(() => handlePrint(), 300);
    } catch (err) {
      showSnackbar?.("Failed to print invoice", "error");
    }
  };

  useEffect(() => {
    let filtered = [...sales];

    if (filterSection) filtered = filtered.filter((s) => s.section === filterSection);
    if (filterPayment) filtered = filtered.filter((s) => s.payment_mode === filterPayment);

    if (filterStartDate) {
      const start = new Date(filterStartDate);
      filtered = filtered.filter((s) => new Date(s.sale_datetime || "") >= start);
    }

    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999); // include full day
      filtered = filtered.filter((s) => new Date(s.sale_datetime || "") <= end);
    }

    if (filterInvoiceMobile) {
      filtered = filtered.filter(
        (s) =>
          s.invoice_number?.toLowerCase().includes(filterInvoiceMobile.toLowerCase()) ||
          s.customer_mobile?.includes(filterInvoiceMobile)
      );
    }

    setFilteredSales(filtered);
    setPage(1);
  }, [sales, filterSection, filterPayment, filterStartDate, filterEndDate, filterInvoiceMobile]);

  const handleDeleteClick = (id: number) => {
    setDeleteSaleId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteSaleId) return;
    try {
      await deleteSale(deleteSaleId);
      loadSales();
      setDeleteDialogOpen(false);
    } catch (error) {
      alert("Failed to delete sale");
      console.error(error);
    }
  };

  const handleOpenInvoiceDialog = async (id: number) => {
    try {
      const saleDetails = await getSale(id); // fetch full details
      setSelectedSale(saleDetails);
      setInvoiceDialogOpen(true);
    } catch (err) {
      console.error("Failed to fetch sale details:", err);
    }
  };

  const handleCloseInvoiceDialog = () => {
    setSelectedSale(null);
    setInvoiceDialogOpen(false);
  };

  // --- Totals (Dependent only on Section + Payment Mode filters) ---
  const today = new Date();

  const salesForTotals = sales.filter((s) => {
    if (filterSection && s.section !== filterSection) return false;
    if (filterPayment && s.payment_mode !== filterPayment) return false;
    return true;
  });

  const totalDay = salesForTotals
    .filter((s) => s.sale_datetime && new Date(s.sale_datetime).toDateString() === today.toDateString())
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  const totalMonth = salesForTotals
    .filter((s) => {
      if (!s.sale_datetime) return false;
      const d = new Date(s.sale_datetime);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  // --- Financial year: April 1 – March 31 ---
  const fyStart = today.getMonth() + 1 >= 4
    ? new Date(today.getFullYear(), 3, 1) // April 1 current year
    : new Date(today.getFullYear() - 1, 3, 1); // April 1 previous year

  const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31); // March 31 next year

  const totalFinancialYear = salesForTotals
    .filter((s) => {
      if (!s.sale_datetime) return false;
      const d = new Date(s.sale_datetime);
      return d >= fyStart && d <= fyEnd;
    })
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  const fyLabel = `${fyStart.toLocaleString("default", { month: "long" })} ${fyStart.getFullYear()} - ${fyEnd.toLocaleString("default", { month: "long" })} ${fyEnd.getFullYear()}`;

  // Pagination
  const pageCount = Math.ceil(filteredSales.length / rowsPerPage);
  const paginatedSales = filteredSales.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleClearFilters = () => {
    setFilterSection("");
    setFilterPayment("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterInvoiceMobile("");
  };

  return (
    <Box p={2}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/sales" underline="hover">Sales Menu</Link>
        <Typography>Sales Report</Typography>
      </Breadcrumbs>

      {/* Total Sales Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "#e3f2fd" }}>
          <Typography variant="subtitle2">Today</Typography>
          <Typography variant="h6" color="primary">{totalDay.toFixed(2)}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "#fce4ec" }}>
          <Typography variant="subtitle2">
            {today.toLocaleString("default", { month: "long" })} {today.getFullYear()}
          </Typography>
          <Typography variant="h6" color="secondary">{totalMonth.toFixed(2)}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "#e8f5e9" }}>
          <Typography variant="subtitle2">{fyLabel}</Typography>
          <Typography variant="h6" color="success.main">{totalFinancialYear.toFixed(2)}</Typography>
        </Paper>
      </Stack>

      {/* Filters */}
      <Stack
        direction="row"
        flexWrap="wrap"
        spacing={2}
        mb={2}
        alignItems="center"
        sx={{ gap: 2 }}
      >
        <TextField
          label="Search Invoice / Mobile"
          size="small"
          value={filterInvoiceMobile}
          onChange={(e) => setFilterInvoiceMobile(e.target.value)}
          sx={{ minWidth: 180, flex: "1 1 180px" }}
        />

        <FormControl size="small" sx={{ minWidth: 150, flex: "1 1 150px" }}>
          <InputLabel>Section</InputLabel>
          <Select
            value={filterSection}
            onChange={(e) => setFilterSection(Number(e.target.value) || "")}
            label="Section"
          >
            <MenuItem value="">All</MenuItem>
            {sections.map((sec) => (
              <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150, flex: "1 1 150px" }}>
          <InputLabel>Payment Mode</InputLabel>
          <Select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value as any)}
            label="Payment Mode"
          >
            <MenuItem value="">All</MenuItem>
            {paymentModes.map((mode) => (
              <MenuItem key={mode} value={mode}>{mode}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Start Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
          sx={{ minWidth: 150, flex: "1 1 150px" }}
        />

        <TextField
          label="End Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
          sx={{ minWidth: 150, flex: "1 1 150px" }}
        />

        <FormControl size="small" sx={{ minWidth: 100, flex: "1 1 100px" }}>
          <InputLabel>Rows per page</InputLabel>
          <Select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            label="Rows per page"
          >
            {[10, 25, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <MuiButton
          variant="outlined"
          color="secondary"
          onClick={handleClearFilters}
          sx={{ flex: "1 1 120px" }}
        >
          Clear Filters
        </MuiButton>
      </Stack>

      {/* Sales Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
        {paginatedSales.length > 0 ? (
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: "#1976d2" }}>
              <TableRow>
                {[
                  "Sl. No.",
                  "Section",
                  "Date & Time",
                  "Invoice No.",
                  "Customer Mobile",
                  "Total Amount",
                  "Payment Mode",
                  "Sold By",                  
                  "Action",
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      color: "black",
                      fontWeight: "bold",
                      textAlign: "center",
                      border: "1px solid #ddd",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.map((sale, index) => (
                <TableRow
                  key={sale.id}
                  hover
                  sx={{
                    bgcolor: index % 2 === 0 ? "#f5f5f5" : "#fff",
                    "&:hover": { bgcolor: "#e3f2fd" },
                  }}
                >
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {(page - 1) * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {sectionMap[sale.section] || "Unknown"}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {sale.sale_datetime ? new Date(sale.sale_datetime).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ border: "1px solid #ddd", cursor: "pointer", color: "blue" }}
                    onClick={() => handleOpenInvoiceDialog(sale.id)}
                  >
                    {sale.invoice_number}
                  </TableCell>                  
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {sale.customer_mobile || "-"}
                  </TableCell>
                  <TableCell align="right" sx={{ border: "1px solid #ddd" }}>
                    {Number(sale.total_amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {sale.payment_mode || "-"}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {sale.created_by || "-"}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {/* Sales Return */}
                      <Tooltip title="Sales Return">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenReturnPage(sale)}
                        >
                          <UndoIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Print Invoice */}
                      <Tooltip title="Print Invoice">
                        <IconButton
                          color="secondary"
                          size="small"
                          onClick={() => printInvoice(sale.id!)}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Existing Delete Button */}
                      <MuiButton
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(sale.id!)}
                      >
                        Delete
                      </MuiButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <Paper elevation={2} sx={{ px: 4, py: 3, bgcolor: "#f5f5f5", borderRadius: 2, textAlign: "center" }}>
              <Typography variant="h6" color="textWarning">No Sales found</Typography>
            </Paper>
          </Box>
        )}
      </TableContainer>

      {/* Pagination + Go to top */}
      {paginatedSales.length > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} color="primary" />
          <Fab color="primary" size="small" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <ArrowUpwardIcon />
          </Fab>
        </Stack>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this sale?</Typography>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDeleteDialogOpen(false)}>Cancel</MuiButton>
          <MuiButton color="error" variant="contained" onClick={handleConfirmDelete}>Delete</MuiButton>
        </DialogActions>
      </Dialog>

      <Dialog open={invoiceDialogOpen} onClose={handleCloseInvoiceDialog} maxWidth="md" fullWidth>
        <DialogTitle>Invoice #{selectedSale?.invoice_number}</DialogTitle>

        <DialogContent dividers>
          {selectedSale && (
            <PosReceipt
              invoiceNumber={selectedSale.invoice_number || "N/A"}
              section={
                typeof selectedSale.section === "object"
                  ? selectedSale.section
                  : sections.find((s) => s.id === selectedSale.section) || {
                      id: selectedSale.section,
                      name: "Unknown Section",
                      logo: "",
                      building_no: "",
                      street_no: "",
                      zone_no: "",
                      place: "Doha",
                      channel: { id: 0, name: "" },
                      location: 0,
                    }
              }
              date={selectedSale.sale_datetime || new Date().toISOString()}
              customerName={selectedSale.customer_name || ""}
              customerMobile={selectedSale.customer_mobile || ""}
              cashier={selectedSale.created_by || "Unknown"}
              discount={selectedSale.discount || 0}
              grandTotal={selectedSale.total_amount || 0}
              items={(selectedSale.items || []).map((i: any) => ({
                name: i.product_name || "",
                barcode: i.product_barcode || "",
                qty: i.quantity || 0,
                price: i.price || 0,
                total: i.total || 0,
              }))}
            />
          )}
        </DialogContent>

        <DialogActions>
          {selectedSale && (
            <MuiButton
              onClick={() => printInvoice(selectedSale.id!)}
              variant="contained"
              color="primary"
            >
              Print
            </MuiButton>
          )}
          <MuiButton onClick={handleCloseInvoiceDialog} color="secondary">
            Close
          </MuiButton>
        </DialogActions>
      </Dialog>

      {invoiceData && (
        <div style={{ display: "none" }}>
          <PosReceipt
            ref={receiptRef}
            invoiceNumber={invoiceData.invoiceNumber}
            section={invoiceData.section}
            date={invoiceData.date}
            customerName={invoiceData.customerName}
            customerMobile={invoiceData.customerMobile}
            items={invoiceData.items}
            discount={invoiceData.discount}
            grandTotal={invoiceData.grandTotal}
            cashier={invoiceData.cashier}
          />
        </div>
      )}
    </Box>
  );
};

export default SalesReportPage;