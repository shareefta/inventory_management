import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  Button as MuiButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Fab,
  Pagination,
  CircularProgress,
} from "@mui/material";

import { getSalesReturns, SalesReturn, getSections, SalesSection } from "src/api/sales";

const SalesReturnReportPage = () => {
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<SalesReturn[]>([]);
  const [sections, setSections] = useState<SalesSection[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterSection, setFilterSection] = useState<number | "">("");
  const [filterInvoiceCustomer, setFilterInvoiceCustomer] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const navigate = useNavigate();

  // ---- Helpers ----
  const toNumber = (v: unknown) => Number(v ?? 0);
  const formatMoney = (v: unknown) => toNumber(v).toFixed(2);

  // ---- Load data ----
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getSalesReturns();
        setSalesReturns(data);
        setFilteredReturns(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();

    getSections().then((fetchedSections) => setSections(fetchedSections));
  }, []);

  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s.name])),
    [sections]
  );

  // ---- Apply filters ----
  useEffect(() => {
    let filtered = [...salesReturns];

    // NOTE: This uses sale_item id because SalesReturn payload doesn't include section directly.
    // If your API later includes section on each return, replace this logic accordingly.
    if (filterSection) {
      filtered = filtered.filter((r) => r.items?.some((it) => it.sale_item === filterSection));
    }

    if (filterStartDate) {
      const from = new Date(filterStartDate);
      filtered = filtered.filter((r) => r.created_at && new Date(r.created_at) >= from);
    }
    if (filterEndDate) {
      const to = new Date(filterEndDate);
      filtered = filtered.filter((r) => r.created_at && new Date(r.created_at) <= to);
    }

    if (filterInvoiceCustomer) {
      const q = filterInvoiceCustomer.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          String(r.sale ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.customer ?? "").includes(filterInvoiceCustomer)
      );
    }

    setFilteredReturns(filtered);
    setPage(1);
  }, [salesReturns, filterSection, filterStartDate, filterEndDate, filterInvoiceCustomer]);

  // ---- Totals (match Sales Report style: Today, This Month, Financial Year) ----
  const today = new Date();

  // Financial year: April 1 – March 31
  const fyStart =
    today.getMonth() + 1 >= 4
      ? new Date(today.getFullYear(), 3, 1) // Apr 1 current year
      : new Date(today.getFullYear() - 1, 3, 1); // Apr 1 previous year
  const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31); // Mar 31 next year
  const fyLabel = `${fyStart.toLocaleString("default", { month: "long" })} ${fyStart.getFullYear()} - ${fyEnd.toLocaleString("default", { month: "long" })} ${fyEnd.getFullYear()}`;

  const totalToday = filteredReturns
    .filter(
      (r) =>
        r.created_at &&
        new Date(r.created_at).toDateString() === today.toDateString()
    )
    .reduce((sum, r) => sum + toNumber(r.refund_amount), 0);

  const totalMonth = filteredReturns
    .filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .reduce((sum, r) => sum + toNumber(r.refund_amount), 0);

  const totalFY = filteredReturns
    .filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      return d >= fyStart && d <= fyEnd;
    })
    .reduce((sum, r) => sum + toNumber(r.refund_amount), 0);

  // ---- Pagination ----
  const pageCount = Math.ceil(filteredReturns.length / rowsPerPage);
  const paginatedReturns = filteredReturns.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleClearFilters = () => {
    setFilterSection("");
    setFilterInvoiceCustomer("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  return (
    <Box p={2}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/sales" underline="hover">
          Sales Menu
        </Link>
        <Typography>Sales Return Report</Typography>
      </Breadcrumbs>

      {/* Summary Cards (match Sales Report look) */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "#e3f2fd" }}>
          <Typography variant="subtitle2">Today</Typography>
          <Typography variant="h6" color="primary">
            {totalToday.toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "#fce4ec" }}>
          <Typography variant="subtitle2">
            {today.toLocaleString("default", { month: "long" })} {today.getFullYear()}
          </Typography>
          <Typography variant="h6" color="secondary">
            {totalMonth.toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "#e8f5e9" }}>
          <Typography variant="subtitle2">{fyLabel}</Typography>
          <Typography variant="h6" color="success.main">
            {totalFY.toFixed(2)}
          </Typography>
        </Paper>
      </Stack>

      {/* + New Sales Return */}
      <Box mb={2}>
        <MuiButton
          variant="contained"
          color="primary"
          onClick={() => navigate("/new-sales-return")}
        >
          + Sales Return
        </MuiButton>
      </Box>

      {/* Filters (styled like Sales Report) */}
      <Stack
        direction="row"
        flexWrap="wrap"
        spacing={2}
        mb={2}
        alignItems="center"
        sx={{ gap: 2 }}
      >
        <TextField
          label="Invoice / Customer"
          size="small"
          value={filterInvoiceCustomer}
          onChange={(e) => setFilterInvoiceCustomer(e.target.value)}
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
              <MenuItem key={sec.id} value={sec.id}>
                {sec.name}
              </MenuItem>
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

        <FormControl size="small" sx={{ minWidth: 120, flex: "1 1 120px" }}>
          <InputLabel>Rows per page</InputLabel>
          <Select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            label="Rows per page"
          >
            {[10, 25, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
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

      {/* Returns Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : filteredReturns.length > 0 ? (
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: "#1976d2" }}>
              <TableRow>
                {[
                  "Sl. No.",
                  "Invoice",
                  "Customer",
                  "Refund Amount",
                  "Refund To Wallet",
                  "Created At",
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
              {paginatedReturns.map((r, idx) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{
                    bgcolor: idx % 2 === 0 ? "#f5f5f5" : "#fff",
                    "&:hover": { bgcolor: "#e3f2fd" },
                  }}
                >
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {(page - 1) * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {r.sale}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {r.customer || "-"}
                  </TableCell>
                  <TableCell align="right" sx={{ border: "1px solid #ddd" }}>
                    {formatMoney(r.refund_amount)}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {r.refund_to_wallet ? "Yes" : "No"}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <Paper
              elevation={2}
              sx={{ px: 4, py: 3, bgcolor: "#f5f5f5", borderRadius: 2, textAlign: "center" }}
            >
              <Typography variant="h6">No Sales Returns found</Typography>
            </Paper>
          </Box>
        )}
      </TableContainer>

      {/* Pagination + Go top */}
      {filteredReturns.length > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
          <Fab
            color="primary"
            size="small"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUpwardIcon />
          </Fab>
        </Stack>
      )}
    </Box>
  );
};

export default SalesReturnReportPage;