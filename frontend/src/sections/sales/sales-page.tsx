import type { ProductProps } from 'src/sections/product/product-table-row';
import type { InvoicePrintProps } from "src/sections/sales/sales-invoice-print";

import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useEffect, useState, useRef } from "react";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { 
  Snackbar, Alert, Box, Breadcrumbs, Link, Typography, 
  FormControl, InputLabel, Select, MenuItem, TextField, 
  Button, TableContainer, Paper, Table, TableHead, TableRow, 
  TableCell, TableBody, Fab, IconButton
} from "@mui/material";

import { getProducts } from "src/api/products";
import { useAuthStore } from "src/store/use-auth-store";
import { getSections, createSale, SalesSection, getSectionPrices } from "src/api/sales";

import PosReceipt from "src/sections/sales/sales-invoice-print";

interface CartItem {
  productId?: number;
  product_name: string;
  product_barcode?: string;
  product_brand?: string;
  product_variant?: string;
  serial_number?: string;
  price: number;
  quantity: number;
  total: number;
  locationId?: number;
}

interface SaleInstance {
  id: string;
  cartItems: CartItem[];
  discount: number;
  customerName: string;
  customerMobile: string;
  invoiceNumber: string; // backend will fill
}

export default function SalesPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("info");

  const [sections, setSections] = useState<SalesSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<SalesSection | null>(null);
  const [sectionPrices, setSectionPrices] = useState<{ product: number; price: string }[]>([]);
  const [products, setProducts] = useState<ProductProps[]>([]);

  const [paymentMode, setPaymentMode] = useState<"Cash" | "Credit" | "Online">("Cash");

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: "POS Receipt",
    pageStyle: `
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; padding: 0; }
    `,
  });

  // Multiple sales tabs
  const [salesInstances, setSalesInstances] = useState<SaleInstance[]>([
    { id: String(Date.now()), cartItems: [], discount: 0, customerName: "", customerMobile: "", invoiceNumber: "" },
  ]);
  const [activeSaleId, setActiveSaleId] = useState<string | null>(salesInstances[0].id);

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning" = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const [invoiceData, setInvoiceData] = useState<InvoicePrintProps | null>(null);
  const activeSale = salesInstances.find(s => s.id === activeSaleId)!;

  // Fetch sections and products
  useEffect(() => {
    getSections().then(res => setSections(res.data));
    getProducts().then(fetchedProducts => setProducts(fetchedProducts));
  }, []);

  useEffect(() => {
    if (!selectedSection) {
      setSectionPrices([]);
      return;
    }
    getSectionPrices(selectedSection.id)
      .then(res => setSectionPrices(res))
      .catch(() => setSectionPrices([]));
  }, [selectedSection]);

  // Add product to cart
  const addProductToCart = (product: ProductProps) => {
    if (!selectedSection) {
      showSnackbar("Select a sales section first", "warning");
      return;
    }

    const priceObj = sectionPrices.find(sp => sp.product === Number(product.id));
    const sellingPrice = priceObj ? Number(priceObj.price) : 0;

    if (!priceObj) {
      showSnackbar(`No selling price found for "${product.itemName}". Enter price manually.`, "warning");
    }

    setSalesInstances(prev => prev.map(sale => {
      if (sale.id !== activeSaleId) return sale;

      const existingIndex = sale.cartItems.findIndex(item => item.productId === Number(product.id));
      if (existingIndex !== -1) {
        const updatedItems = [...sale.cartItems];
        const existing = updatedItems[existingIndex];
        updatedItems[existingIndex] = { ...existing, price: sellingPrice, quantity: existing.quantity + 1, total: (existing.quantity + 1) * sellingPrice };
        return { ...sale, cartItems: updatedItems };
      }

      return {
        ...sale,
        cartItems: [...sale.cartItems, {
          productId: Number(product.id),
          product_name: product.itemName,
          product_barcode: product.uniqueId,
          product_brand: product.brand || "",
          product_variant: product.variants || "",
          serial_number: product.serialNumber || "",
          price: sellingPrice,
          quantity: 1,
          total: sellingPrice,
          locationId: selectedSection.location,
        }]
      };
    }));
  };

  // Update quantity
  const updateQuantity = (index: number, qty: number) => {
    setSalesInstances(prev => prev.map(sale => {
      if (sale.id !== activeSaleId) return sale;
      const updatedItems = [...sale.cartItems];
      updatedItems[index].quantity = Math.max(1, qty);
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
      return { ...sale, cartItems: updatedItems };
    }));
  };

  // Remove item
  const removeItem = (index: number) => {
    setSalesInstances(prev => prev.map(sale => {
      if (sale.id !== activeSaleId) return sale;
      return { ...sale, cartItems: sale.cartItems.filter((_, i) => i !== index) };
    }));
  };

  // Checkout
  const handleCheckout = async () => {
    if (!selectedSection) {
      showSnackbar("Select a sales section first", "warning");
      return;
    }
    if (!activeSale.customerMobile.trim()) {
      showSnackbar("Customer mobile is required!", "warning");
      return;
    }
    if (activeSale.cartItems.length === 0) {
      showSnackbar("Cart is empty", "warning");
      return;
    }

    const payload = {
      section: selectedSection.id,
      channel: selectedSection.channel.id,
      payment_mode: paymentMode,
      discount: activeSale.discount,
      total_amount:
        activeSale.cartItems.reduce((sum, i) => sum + i.total, 0) -
        activeSale.discount,
      items_write: activeSale.cartItems.map((item) => ({
        product: item.productId,
        product_name: item.product_name,
        product_barcode: item.product_barcode,
        product_brand: item.product_brand,
        product_variant: item.product_variant,
        serial_number: item.serial_number,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
        location: item.locationId,
      })),
      customer_name: activeSale.customerName,
      customer_mobile: activeSale.customerMobile,
      user: currentUser?.name || "Unknown",
    };

    try {
      const response = await createSale(payload);
      showSnackbar("Sale completed successfully!", "success");

      const backendInvoice = response.data.invoice_number || "";

      // Store data for printing
      const newInvoiceData = {
        invoiceNumber: backendInvoice,
        section: selectedSection,
        date: new Date().toLocaleString(),
        customerName: activeSale.customerName,
        customerMobile: activeSale.customerMobile,
        items: activeSale.cartItems.map(it => ({
          name: it.product_name,
          qty: it.quantity,
          price: it.price,
          total: it.total
        })),
        discount: activeSale.discount,
        grandTotal: activeSale.cartItems.reduce((sum, i) => sum + i.total, 0) - activeSale.discount,
        cashier: currentUser?.name || "Unknown",
      };

      setInvoiceData(newInvoiceData);

      // Print after a small delay to ensure DOM updates
      setTimeout(() => {
        handlePrint();
      }, 300);

      // Reset current sale
      setSalesInstances((prev) =>
        prev.map((sale) =>
          sale.id === activeSaleId
            ? {
                ...sale,
                cartItems: [],
                discount: 0,
                customerName: "",
                customerMobile: "",
                invoiceNumber: backendInvoice,
              }
            : sale
        )
      );
    } catch (err: any) {
      console.error(err);
      showSnackbar(err.response?.data || "Error creating sale", "error");
    }
  };

  // Add new sale tab
  const handleNewSale = () => {
    const newSale: SaleInstance = { 
      id: String(Date.now()), 
      cartItems: [], 
      discount: 0, 
      customerName: "", 
      customerMobile: "", 
      invoiceNumber: "" 
    };
    setSalesInstances(prev => [...prev, newSale]);
    setActiveSaleId(newSale.id);
  };

  // Close sale tab
  const handleCloseSaleTab = (saleId: string) => {
    setSalesInstances(prev => prev.filter(s => s.id !== saleId));

    if (activeSaleId === saleId) {
      const remaining = salesInstances.filter(s => s.id !== saleId);
      setActiveSaleId(remaining.length ? remaining[0].id : null);
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, py: 2, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
      
      {/* Left: Cart */}
      <Box sx={{ flex: 2 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component="button" onClick={() => navigate("/sales")}>Sales Menu</Link>
          <Typography>Sales</Typography>
        </Breadcrumbs>

        {/* Section selector and barcode input */}
        <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10, background: "#f0f4f8", p: 2, borderRadius: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Sales Section</InputLabel>
            <Select
              value={selectedSection?.id ?? ""}
              label="Sales Section"
              onChange={(e) => setSelectedSection(sections.find(s => s.id === Number(e.target.value)) || null)}
            >
              {sections.map(sec => <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            label="Scan / Type Barcode or Product Name"
            size="small"
            sx={{ flex: 1, minWidth: 250 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = (e.target as HTMLInputElement).value.trim();
                if (!val) return;
                const prod = products.find(p => p.uniqueId === val || p.itemName.toLowerCase() === val.toLowerCase());
                if (prod) addProductToCart(prod);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </Box>

        {/* Sales Tabs */}
        <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
          {salesInstances.map(sale => (
            <Box key={sale.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Button
                variant={sale.id === activeSaleId ? "contained" : "outlined"}
                onClick={() => setActiveSaleId(sale.id)}
              >
                {sale.invoiceNumber}
              </Button>

              {/* Only show close button if more than one sale tab */}
              {salesInstances.length > 1 && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleCloseSaleTab(sale.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}

          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleNewSale}>
            New Sale
          </Button>
        </Box>

        {/* Cart Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ background: "#333" }}>
                {["SL No", "Barcode", "Product Name", "Qty", "Rate", "Total", "Actions"].map(h => (
                  <TableCell key={h} sx={{ color: "black", fontWeight: "bold", textAlign: "center" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {activeSale.cartItems.map((item, idx) => (
                <TableRow key={idx} hover>
                  <TableCell align="center">{idx + 1}</TableCell>
                  <TableCell align="center">{item.product_barcode}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell align="center">
                    <TextField type="number" value={item.quantity} onChange={(e) => updateQuantity(idx, Number(e.target.value))} size="small" sx={{ width: 70 }} />
                  </TableCell>
                  <TableCell align="center">{item.price}</TableCell>
                  <TableCell align="center">{item.total}</TableCell>
                  <TableCell align="center"><Button size="small" color="error" onClick={() => removeItem(idx)}>Remove</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Right: Summary */}
      <Box sx={{ flex: 1, p: 2, backgroundColor: "#f0f4f8", borderRadius: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">Summary</Typography>
        <TextField
          label="Customer Name (Optional)"
          size="small"
          value={activeSale.customerName}
          onChange={(e) => setSalesInstances(prev => prev.map(s => s.id === activeSaleId ? { ...s, customerName: e.target.value } : s))}
        />
        <TextField
          label="Customer Mobile *"
          size="small"
          value={activeSale.customerMobile}
          onChange={(e) => setSalesInstances(prev => prev.map(s => s.id === activeSaleId ? { ...s, customerMobile: e.target.value } : s))}
        />
        <TextField
          label="Invoice Number"
          size="small"
          value={activeSale.invoiceNumber}
          InputProps={{ readOnly: true }}
        />
        <Typography>Subtotal: {activeSale.cartItems.reduce((sum, i) => sum + i.total, 0)}</Typography>
        <TextField
          label="Discount"
          type="number"
          size="small"
          value={activeSale.discount}
          onChange={(e) => setSalesInstances(prev => prev.map(s => s.id === activeSaleId ? { ...s, discount: Number(e.target.value) } : s))}
        />
        <Typography sx={{ fontWeight: "bold", color: "green" }}>
          Grand Total: {activeSale.cartItems.reduce((sum, i) => sum + i.total, 0) - activeSale.discount}
        </Typography>
        <FormControl size="small">
          <InputLabel>Payment Mode</InputLabel>
          <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as "Cash" | "Credit" | "Online")}>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Credit">Credit</MenuItem>
            <MenuItem value="Online">Online</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={handleCheckout}>Checkout</Button> 
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Fab color="primary" size="small" sx={{ position: "fixed", bottom: 20, right: 20 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <ArrowUpwardIcon />
      </Fab>

      <div style={{ display: "none" }}>
        {invoiceData && (
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
        )}
      </div>
    </Box>
  );
}
