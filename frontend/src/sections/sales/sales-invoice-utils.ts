import type { Sale, SaleItem, SalesSection } from "src/api/sales";

import type { InvoicePrintProps } from "./sales-invoice-print";

/**
 * Convert a Sale object into InvoicePrintProps
 * for use with the PosReceipt component
 */
export function SaleToInvoiceProps(
  sale: Sale,
  section: SalesSection
): InvoicePrintProps {
  return {
    invoiceNumber: sale.invoice_number,
    section: section,
    date: sale.sale_datetime || new Date().toLocaleString(),
    customerName: sale.customer_name,
    customerMobile: sale.customer_mobile,
    cashier: sale.created_by || "Unknown",
    discount: sale.discount || 0,
    grandTotal: sale.total_amount || 0,
    items: (sale.items || []).map((it: SaleItem) => ({
      name: it.product_name,
      barcode: it.product_barcode || "-",
      qty: it.quantity,
      price: it.price,
      total: it.total,
    })),
  };
}