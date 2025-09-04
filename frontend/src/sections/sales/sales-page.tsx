import type { CustomerProps } from "src/api/customers";
import type { InvoicePrintProps } from "src/sections/sales/sales-invoice";
import type { ProductProps } from 'src/sections/product/product-table-row';

import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useEffect, useState, useRef } from "react";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { 
  Snackbar, Alert, Box, Breadcrumbs, Link, Typography, 
  FormControl, InputLabel, Select, MenuItem, TextField, 
  Button, TableContainer, Paper, Table, TableHead, TableRow, 
  TableCell, TableBody, Fab, IconButton
} from "@mui/material";

import { useAuthStore } from "src/store/use-auth-store";
import { getCustomers, debitWallet } from "src/api/customers";
import { getProducts, getProductByBarcode } from "src/api/products";
import { getSections, Sale, createSale, SalesSection, getSectionPrices } from "src/api/sales";

import PosReceipt from "src/sections/sales/sales-invoice";
import { SaleToInvoiceProps } from "src/sections/sales/sales-invoice-utils";

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
  invoiceNumber: string;
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
  const [cartItems, setCartItems] = useState<any[]>([]);

  const [paymentMode, setPaymentMode] = useState<"Cash" | "Credit" | "Bank" | "Wallet">("Cash");

  // State for server-side search
  const [selectedValue, setSelectedValue] = useState<ProductProps | string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [autocompleteOptions, setAutocompleteOptions] = useState<ProductProps[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Customer states ---
  const [customerInput, setCustomerInput] = useState(""); // text shown in the name input
  const [customerOptions, setCustomerOptions] = useState<CustomerProps[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProps | null>(null);
  const [customerWalletBalance, setCustomerWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletDeduction, setWalletDeduction] = useState(0);

  // Debounce ref for mobile lookup
  const mobileLookupTimeout = useRef<number | null>(null);

  // Debounced server-side search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!inputValue.trim()) {
        setAutocompleteOptions([]);
        return;
      }

      setLoadingProducts(true);
      getProducts(1, 25, inputValue)
        .then(res => setAutocompleteOptions(res.data))
        .finally(() => setLoadingProducts(false));
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [inputValue]);

  // Debounced customers search (for Autocomplete suggestions)
  useEffect(() => {
    const handler = setTimeout(() => {
      const q = customerInput.trim();
      if (!q) {
        setCustomerOptions([]);
        return;
      }

      setLoadingCustomers(true);
      getCustomers(q, 50)
        .then(items => setCustomerOptions(items))
        .catch(() => setCustomerOptions([]))
        .finally(() => setLoadingCustomers(false));
    }, 300);

    return () => clearTimeout(handler);
  }, [customerInput]);

  useEffect(() => {
    if (!selectedSection || !activeSale) return;

    setSalesInstances(prev =>
      prev.map(sale => {
        if (sale.id !== activeSaleId) return sale;

        const updatedItems = sale.cartItems.map(item => {
          // Find price for this product in the newly selected section
          const sectionPriceObj = sectionPrices.find(sp => sp.product === Number(item.productId));
          const newPrice = sectionPriceObj ? Number(sectionPriceObj.price) : item.price;

          return {
            ...item,
            price: newPrice,
            total: newPrice * item.quantity,
          };
        });

        return { ...sale, cartItems: updatedItems };
      })
    );
  }, [selectedSection, sectionPrices]);

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
  
  const [activeSaleId, setActiveSaleId] = useState<string | null>(salesInstances[0]?.id ?? null);  

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning" = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const [invoiceData, setInvoiceData] = useState<InvoicePrintProps | null>(null);

  // --- SAFETY: ensure activeSaleId always valid ---
  useEffect(() => {
    if (!salesInstances.length) {
      setActiveSaleId(null);
    } else if (!salesInstances.find(s => s.id === activeSaleId)) {
      setActiveSaleId(salesInstances[0].id);
    }
  }, [salesInstances, activeSaleId]);

  const activeSale = salesInstances.find(s => s?.id === activeSaleId) ?? null;

  // --- Initialize customerInput when activeSale changes ---
  useEffect(() => {
    if (!activeSale) {
      setCustomerInput("");
      setSelectedCustomer(null);
      return;
    }

    setCustomerInput(prev => prev?.trim() ? prev : (activeSale.customerName || ""));

    // Auto-load customer based on mobile if exists
    if (activeSale.customerMobile) {
      getCustomers(activeSale.customerMobile, 1).then(customers => {
        const exact = customers.find(c => c.mobile === activeSale.customerMobile);
        if (exact) setSelectedCustomer(exact);
        else setSelectedCustomer(null);
      }).catch(() => setSelectedCustomer(null));
    } else {
      setSelectedCustomer(null);
    }
  }, [activeSale]);

  // --- Fetch customer options for Autocomplete ---
  useEffect(() => {
    const handler = setTimeout(() => {
      const q = customerInput.trim();
      if (!q) {
        setCustomerOptions([]);
        return;
      }

      setLoadingCustomers(true);
      getCustomers(q, 50)
        .then(items => setCustomerOptions(items))
        .catch(() => setCustomerOptions([]))
        .finally(() => setLoadingCustomers(false));
    }, 300);

    return () => clearTimeout(handler);
  }, [customerInput]);

  // --- Handle Name input change ---
  const handleCustomerInputChange = (newValue: string) => {
    setCustomerInput(newValue);
    setSelectedCustomer(null); // Free-text input invalidates selectedCustomer
    if (!activeSale) return;

    setSalesInstances(prev =>
      prev.map(s => s.id === activeSaleId
        ? { ...s, customerName: newValue }
        : s
      )
    );
  };

  // Handle Mobile input change
  const handleCustomerMobileChange = (val: string) => {
    if (!activeSale) return;

    // Update mobile in the active sale
    setSalesInstances(prev =>
      prev.map(s =>
        s.id === activeSaleId ? { ...s, customerMobile: val } : s
      )
    );

    // Debounced lookup
    if (mobileLookupTimeout.current) window.clearTimeout(mobileLookupTimeout.current);
    mobileLookupTimeout.current = window.setTimeout(async () => {
      const q = val.trim();
      if (!q || q.length < 3) return; // avoid unnecessary calls

      try {
        const customers = await getCustomers(q, 1); // fetch matching customer
        const exact = customers.find(c => c.mobile === q);

        if (exact) {
          // Customer found: auto-fill name and wallet
          setSelectedCustomer(exact);
          setCustomerInput(exact.name || "");

          setSalesInstances(prev =>
            prev.map(s =>
              s.id === activeSaleId
                ? { ...s, customerName: exact.name || "", customerMobile: exact.mobile }
                : s
            )
          );
        }
        // If not found, do nothing (keep name/wallet as-is)
      } catch (err) {
        console.error(err);
      }
    }, 400);
  };

  // --- Options including selectedCustomer for Autocomplete ---
  const optionsWithSelected =
    selectedCustomer && !customerOptions.some(c => c.mobile === selectedCustomer.mobile)
      ? [selectedCustomer, ...customerOptions]
      : customerOptions;

  // --- Sync wallet balance when customer changes ---
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerWalletBalance(0);
      setWalletDeduction(0);
      setUseWallet(false);
      return;
    }

    const balance = Number(selectedCustomer.wallet_balance || 0);
    setCustomerWalletBalance(balance);
    setWalletDeduction(prev => Math.min(prev, balance));
    setUseWallet(balance > 0);
  }, [selectedCustomer]);  

  // Fetch sections and products
  useEffect(() => {
    getSections().then(res => setSections(res));
    getProducts().then(fetchedProducts => setProducts(fetchedProducts.data));
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

  const updateQuantity = (index: number, qty: number) => {
    setSalesInstances(prev => prev.map(sale => {
      if (sale.id !== activeSaleId) return sale;
      const updatedItems = [...sale.cartItems];
      updatedItems[index].quantity = Math.max(1, qty);
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
      return { ...sale, cartItems: updatedItems };
    }));
  };

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
    if (!activeSale) {
      showSnackbar("No active sale selected", "warning");
      return;
    }
    if (!activeSale?.customerMobile.trim()) {
      showSnackbar("Customer mobile is required!", "warning");
      return;
    }
    if (!activeSale.cartItems.length) {
      showSnackbar("Cart is empty", "warning");
      return;
    }

    const grandTotal = activeSale.cartItems.reduce((sum, i) => sum + i.total, 0) - activeSale.discount;
    const remainingPayment = grandTotal - walletDeduction;

    const payload = {
      section: selectedSection.id,
      channel: selectedSection.channel.id,
      payment_mode: remainingPayment > 0 ? paymentMode : "Wallet",
      discount: activeSale.discount,
      total_amount: grandTotal,
      wallet_deduction: walletDeduction,
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
    };

    try {
      const savedSale: Sale = await createSale(payload);

      if (useWallet && walletDeduction > 0 && selectedCustomer) {
        await debitWallet(selectedCustomer.id, walletDeduction, `Payment for Invoice #${savedSale.invoice_number}`);
      }

      const invoiceProps = {
        ...SaleToInvoiceProps(savedSale, selectedSection),
        invoiceNumber: savedSale.invoice_number,
        cashier: savedSale.created_by || "Unknown",
      };

      setInvoiceData(invoiceProps);

      setTimeout(() => handlePrint(), 300);

      // Remove completed sale and safely set activeSaleId
      setSalesInstances(prev => {
        const remaining = prev.filter(s => s.id !== activeSaleId);
        setActiveSaleId(remaining.length ? remaining[0].id : null);
        return remaining;
      });

      showSnackbar("Sale completed successfully!", "success");

    } catch (err: any) {
      console.error(err);
      showSnackbar(err.response?.data || "Error creating sale", "error");
    }
  };

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

  const handleCloseSaleTab = (saleId: string) => {
    setSalesInstances(prev => {
      const remaining = prev.filter(s => s.id !== saleId);
      if (activeSaleId === saleId) {
        setActiveSaleId(remaining.length ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  useEffect(() => {
    if (!salesInstances.length) {
      // If no sales exist, create a new one
      const newSale: SaleInstance = {
        id: String(Date.now()),
        cartItems: [],
        discount: 0,
        customerName: "",
        customerMobile: "",
        invoiceNumber: "",
      };
      setSalesInstances([newSale]);
      setActiveSaleId(newSale.id);
    } else if (!salesInstances.find(s => s.id === activeSaleId)) {
      // If activeSaleId is invalid, set first sale as active
      setActiveSaleId(salesInstances[0].id);
    }
  }, [salesInstances, activeSaleId]);

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
            <Autocomplete
              options={sections}
              getOptionLabel={(option) => option.name}
              value={selectedSection}
              onChange={(_, newValue) => setSelectedSection(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="Sales Section" size="small" />}
            />
          </FormControl>

          <FormControl size="small" sx={{ flex: 1, minWidth: 250 }}>
            <Autocomplete
              freeSolo
              size="small"
              options={autocompleteOptions}
              loading={loadingProducts}
              value={selectedValue}
              inputValue={inputValue}
              onInputChange={(_, newValue) => setInputValue(newValue)}
              onChange={(_, value) => {
                if (!value || !activeSale) return;

                // Only handle when user *selects* from dropdown, not when typing barcode
                if (typeof value !== "string") {
                  addProductToCart(value);
                  setInputValue("");
                  setSelectedValue(null);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }
              }}
              getOptionLabel={(option) =>
                typeof option === "string"
                  ? option
                  : `${option.itemName} (${option.uniqueId || "No Barcode"})`
              }
              filterOptions={(options) => options}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={inputRef}
                  label="Scan / Type Barcode or Product Name"
                  size="small"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (!val || !activeSale) return;

                      if (!selectedSection) {
                        showSnackbar("Select a sales section first", "warning");
                        return;
                      }

                      // Handle barcode entry (manual typing or scanner)
                      getProductByBarcode(val)
                        .then(product => {
                          if (product) addProductToCart(product);
                          else {
                            getProducts(1, 25, val).then(res => {
                              if (res.data.length) addProductToCart(res.data[0]);
                            });
                          }
                        });

                      setInputValue("");
                      setSelectedValue(null);
                    }
                  }}
                />
              )}
            />
          </FormControl>
        </Box>

        {/* Sales Tabs */}
        {salesInstances.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
            {salesInstances.map(sale => (
              <Box key={sale.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Button
                  variant={sale.id === activeSaleId ? "contained" : "outlined"}
                  onClick={() => setActiveSaleId(sale.id)}
                >
                  {sale.customerMobile || "New Sale"}
                </Button>
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
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleNewSale}>New Sale</Button>
          </Box>
        )}

        {/* Cart Table */}
        {activeSale?.cartItems.length ? (
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

                    {/* Quantity (editable) */}
                    <TableCell align="center">
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                        size="small"
                        sx={{ width: 70 }}
                      />
                    </TableCell>

                    {/* Price (editable now ✅) */}
                    <TableCell align="center">
                      <TextField
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          let newPrice = Number(e.target.value) || 0;

                          // ✅ Validation: force at least 1
                          if (newPrice < 1) newPrice = 1;

                          setSalesInstances(prev =>
                            prev.map(sale => {
                              if (sale.id !== activeSaleId) return sale;
                              const updatedItems = [...sale.cartItems];
                              updatedItems[idx].price = newPrice;
                              updatedItems[idx].total = updatedItems[idx].quantity * newPrice;
                              return { ...sale, cartItems: updatedItems };
                            })
                          );
                        }}
                        size="small"
                        sx={{ width: 90 }}
                        inputProps={{ min: 1 }}
                      />
                    </TableCell>

                    <TableCell align="center">{item.total}</TableCell>
                    <TableCell align="center">
                      <Button size="small" color="error" onClick={() => removeItem(idx)}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ mt: 2, textAlign: "center" }}>No items in cart.</Typography>
        )}
      </Box>

      {/* Right: Summary */}
      {activeSale && (
        <Box
          sx={{
            flex: 1,
            p: 2,
            backgroundColor: "#f0f4f8",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h6">Summary</Typography>

          {/* Customer Name Autocomplete */}
          <Autocomplete
  freeSolo
  size="small"
  options={optionsWithSelected} // existing customers + selectedCustomer
  getOptionLabel={(option) =>
    typeof option === "string" ? option : option.name || option.label
  }
  inputValue={customerInput}
  value={selectedCustomer}
  onInputChange={(_, newValue, reason) => {
    if (reason === "input") {
      setCustomerInput(newValue);     // update input
      setSelectedCustomer(null);      // free text invalidates selection
      if (!activeSale) return;
      setSalesInstances(prev =>
        prev.map(s =>
          s.id === activeSaleId ? { ...s, customerName: newValue } : s
        )
      );
    }
  }}
  onChange={(_, value) => {
    if (!activeSale) return;

    if (!value) {
      // Cleared
      setSelectedCustomer(null);
      setCustomerInput("");
      setSalesInstances(prev =>
        prev.map(s =>
          s.id === activeSaleId
            ? { ...s, customerName: "", customerMobile: "" }
            : s
        )
      );
      setCustomerWalletBalance(0);
      setWalletDeduction(0);
      setUseWallet(false);
    } else if (typeof value === "string") {
      // Free-text
      setSelectedCustomer({
        id: 0,
        name: value,
        label: value,
        mobile: activeSale.customerMobile || "",
        wallet_balance: 0,
      });
      setCustomerInput(value);
    } else {
      // Existing customer selected
      setSelectedCustomer({
        ...value,
        wallet_balance: Number(value.wallet_balance || 0),
      });
      setCustomerInput(value.name || value.mobile);

      setSalesInstances(prev =>
        prev.map(s =>
          s.id === activeSaleId
            ? { ...s, customerName: value.name || "", customerMobile: value.mobile || "" }
            : s
        )
      );
    }
  }}
  loading={loadingCustomers}
  renderInput={(params) => (
    <TextField {...params} label="Customer Name" size="small" />
  )}
/>

          {/* Customer Mobile */}
          <TextField
            label="Customer Mobile *"
            size="small"
            value={activeSale.customerMobile || ""}
            onChange={(e) => handleCustomerMobileChange(e.target.value)}
          />

          {/* Wallet Balance (always shown) */}
          <Typography sx={{ color: "blue", fontWeight: "bold" }}>
            Wallet Balance: {customerWalletBalance.toFixed(2)}
          </Typography>

          {/* Use Wallet Selector */}
          <FormControl size="small">
            <InputLabel>Use Wallet</InputLabel>
            <Select
              value={useWallet ? "yes" : "no"}
              onChange={(e) => setUseWallet(e.target.value === "yes")}
              disabled={customerWalletBalance <= 0}
            >
              <MenuItem value="no">No</MenuItem>
              <MenuItem value="yes">Yes</MenuItem>
            </Select>
          </FormControl>

          {/* Subtotal & Discount */}
          <Typography>
            Subtotal: {activeSale.cartItems.reduce((sum, i) => sum + i.total, 0)}
          </Typography>
          <TextField
            label="Discount"
            type="number"
            size="small"
            value={activeSale.discount}
            onChange={(e) =>
              setSalesInstances((prev) =>
                prev.map((s) =>
                  s.id === activeSaleId
                    ? { ...s, discount: Number(e.target.value) }
                    : s
                )
              )
            }
          />

          {/* Grand Total */}
          <Typography sx={{ fontWeight: "bold", color: "green" }}>
            Grand Total:{" "}
            {activeSale.cartItems.reduce((sum, i) => sum + i.total, 0) -
              activeSale.discount}
          </Typography>

          {/* Wallet Deduction */}
          {useWallet && (
            <TextField
              label="Wallet Deduction"
              type="number"
              size="small"
              value={walletDeduction}
              onChange={(e) => {
                let val = Number(e.target.value) || 0;
                const grandTotal =
                  activeSale.cartItems.reduce((sum, i) => sum + i.total, 0) -
                  activeSale.discount;

                if (val > customerWalletBalance) val = customerWalletBalance;
                if (val > grandTotal) val = grandTotal;

                setWalletDeduction(val);
              }}
              inputProps={{
                min: 0,
                max: Math.min(
                  customerWalletBalance,
                  activeSale.cartItems.reduce((sum, i) => sum + i.total, 0) -
                    activeSale.discount
                ),
              }}
            />
          )}

          {/* Payment Mode Selector */}
          <FormControl size="small">
            <InputLabel>Payment Mode</InputLabel>
            <Select
              value={paymentMode}
              onChange={(e) =>
                setPaymentMode(
                  e.target.value as "Cash" | "Credit" | "Bank" | "Wallet"
                )
              }
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Credit">Credit</MenuItem>
              <MenuItem value="Online">Bank</MenuItem>
              <MenuItem value="Online">Wallet</MenuItem>
            </Select>
          </FormControl>

          {/* Checkout Button */}
          <Button variant="contained" color="primary" onClick={handleCheckout}>
            Checkout
          </Button>
        </Box>
      )}

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

      {/* Hidden invoice print */}
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
}