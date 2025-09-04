import { useSnackbar } from "notistack";
import { useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

import {
  Box,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  TextField,
  Checkbox,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Stack,
  Breadcrumbs,
  Link,
} from "@mui/material";

import { creditWallet } from "src/api/customers";
import { getSales, createSalesReturn, Sale } from "src/api/sales";

interface SaleItemReturn {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
  selected: boolean;
  returnQty: number;
}

export default function NewSalesReturnPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [searchInput, setSearchInput] = useState("");
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItemReturn[]>([]);
  const [refundMethod, setRefundMethod] = useState<"cash" | "card" | "online" | "wallet">("cash");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const passedSale: Sale | undefined = location.state?.sale;

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      enqueueSnackbar("Enter invoice number or scan QR.", { variant: "warning" });
      return;
    }
    try {
      setLoading(true);
      const response = await getSales();
      const sales = response;
      const foundSale = sales.find(
        (s) =>
          s.invoice_number === searchInput.trim() ||
          s.customer_mobile === searchInput.trim()
      );

      if (!foundSale) {
        enqueueSnackbar("Sale not found.", { variant: "error" });
        setSale(null);
        setItems([]);
        return;
      }

      setSale(foundSale);

      const saleItems: SaleItemReturn[] = (foundSale.items || []).map((i) => ({
        id: i.id,
        product_name: i.product_name,
        price: i.price,
        quantity: i.quantity,
        selected: false,
        returnQty: 0,
      }));
      setItems(saleItems);
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Failed to fetch sale.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (passedSale) {
      setSale(passedSale);

      const saleItems: SaleItemReturn[] = (passedSale.items || []).map((i) => ({
        id: i.id,
        product_name: i.product_name,
        price: i.price,
        quantity: i.quantity,
        selected: false,
        returnQty: 0,
      }));
      setItems(saleItems);
    }
  }, [passedSale]);

  const handleItemChange = (id: number, key: "selected" | "returnQty", value: any) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const handleSubmit = async () => {
    if (!sale) return;

    const itemsToReturn = items
      .filter((i) => i.selected && i.returnQty > 0)
      .map((i) => ({ sale_item: i.id, quantity: i.returnQty }));

    if (itemsToReturn.length === 0) {
      enqueueSnackbar("Please select at least one item to return.", { variant: "warning" });
      return;
    }

    try {
      setLoading(true);

      await createSalesReturn({
        sale: sale.id,
        refund_mode: refundMethod,
        items_write: itemsToReturn,
      });

      const totalRefund = itemsToReturn.reduce((sum, i) => {
        const item = items.find((it) => it.id === i.sale_item);
        return sum + (item?.price || 0) * i.quantity;
      }, 0);

      // 2️⃣ If refund method is wallet, credit the amount
      if (refundMethod === "wallet" && sale.customer) {
        await creditWallet(sale.customer, totalRefund, `Sales return for invoice #${sale.invoice_number}`);
      }

      if (refundMethod === "wallet") {
        enqueueSnackbar(
          `Refunded ${itemsToReturn.length} items via wallet. Total: ${totalRefund.toFixed(2)}`,
          { variant: "success" }
        );
      } else {
        enqueueSnackbar(`Sales return processed via ${refundMethod.toUpperCase()}.`, { variant: "success" });
      }

      setSale(null);
      setItems([]);
      setSearchInput("");
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to create sales return.";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Total refund dynamically
  const totalRefund = useMemo(
    () => items.filter((i) => i.selected && i.returnQty > 0)
               .reduce((sum, i) => sum + i.price * i.returnQty, 0),
    [items]
  );

  return (
    <Box p={2}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/sales" underline="hover">Sales Menu</Link>
        <Link href="/sales/sales-report" underline="hover">Sales Report</Link>
        <Typography>New Sales Return</Typography>
      </Breadcrumbs>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, alignItems: "center", maxWidth: 500 }}>
        <TextField
          fullWidth
          label="Scan QR / Type Invoice Number"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
        />
        <Button variant="contained" color="primary" onClick={handleSearch} disabled={loading}>
          Search
        </Button>
      </Paper>

      {/* Table + Refund */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems="flex-start"
      >
        {/* --- Table (Left) --- */}
        <TableContainer component={Paper} sx={{ maxWidth: 1000, mx: "auto" }}>
          <Table stickyHeader>
            {/* Table Head */}
            <TableHead>
              <TableRow>
                {[
                  { label: "Sl. No.", width: 50 },
                  { label: "Select", width: 50 },
                  { label: "Product", width: 200 },
                  { label: "Price", width: 80 },
                  { label: "Sold Qty", width: 80 },
                  { label: "Return Qty", width: 80 },
                ].map((col) => (
                  <TableCell
                    key={col.label}
                    align="center"
                    sx={{
                      backgroundColor: "#0288d1",
                      color: "#fff",
                      fontWeight: "bold",
                      width: col.width,
                      border: "1px solid #1976d2",
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* Table Body */}
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    No items to display
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => {
                  const isError = item.returnQty > item.quantity;
                  return (
                    <TableRow
                      key={item.id}
                      sx={{
                        backgroundColor: item.selected ? "#e3f2fd" : idx % 2 === 0 ? "#f5f5f5" : "#fff",
                        "&:hover": { backgroundColor: item.selected ? "#cfe8fc" : "#e8f0f5" },
                      }}
                    >
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={item.selected}
                          onChange={(e) => handleItemChange(item.id, "selected", e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="left">{item.product_name}</TableCell>
                      <TableCell align="center">{item.price}</TableCell>
                      <TableCell align="center">{Math.floor(item.quantity)}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={item.returnQty}
                          disabled={!item.selected}
                          error={isError}
                          helperText={isError ? `Max ${item.quantity}` : ""}
                          onChange={(e) => {
                            // Only allow integers
                            const value = Math.floor(Number(e.target.value));
                            handleItemChange(item.id, "returnQty", value);
                          }}
                          inputProps={{
                            min: 0,
                            max: item.quantity,
                            step: 1,
                          }}
                          sx={{
                            backgroundColor: item.selected ? "#e8f0fe" : "#f5f5f5",
                            borderRadius: 1,
                            width: 80,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- Refund Method & Summary (Right) --- */}
        <Stack spacing={2} sx={{ width: { xs: "100%", md: 250 } }}>
          {/* Refund Method */}
          <Paper sx={{ p: 2, backgroundColor: "#f9f9f9", border: "1px solid #ddd" }}>
            <Typography variant="h6" gutterBottom>
              Refund Method
            </Typography>
            <RadioGroup
              row
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value as any)}
            >
              {["cash", "card", "online", "wallet"].map((mode) => (
                <FormControlLabel
                  key={mode}
                  value={mode}
                  control={<Radio />}
                  label={mode.charAt(0).toUpperCase() + mode.slice(1)}
                />
              ))}
            </RadioGroup>
          </Paper>

          {/* Refund Summary */}
          <Paper sx={{ p: 2, backgroundColor: "#f0f4c3", border: "1px solid #ddd" }}>
            <Typography variant="h6" gutterBottom>
              Refund Summary
            </Typography>
            <Typography variant="body1">Total Refund Amount:</Typography>
            <Typography variant="h5" color="primary">
              {items
                .filter((i) => i.selected && i.returnQty > 0)
                .reduce((sum, i) => sum + i.price * i.returnQty, 0)
                .toFixed(2)}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit Return"}
            </Button>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  );
}
