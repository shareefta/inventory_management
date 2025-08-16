import "./receipt.css";

import type { SalesSection } from "src/api/sales";

import { forwardRef } from "react";

export interface InvoicePrintProps {
  invoiceNumber: string;
  section: SalesSection;
  date: string;
  customerName?: string;
  customerMobile?: string;
  items: {
    name: string;
    barcode?: string;
    qty: number;
    price: number;
    total: number;
  }[];
  discount: number;
  grandTotal: number;
  cashier: string;
}

const PosReceipt = forwardRef<HTMLDivElement, InvoicePrintProps>(
  (
    {
      invoiceNumber,
      section,
      date,
      customerName,
      customerMobile,
      items,
      discount,
      grandTotal,
      cashier,
    },
    ref
  ) => (
    <div ref={ref} className="receipt">
      {/* Header */}
      <div className="receipt-header">
        <h2>{section.name}</h2>
        <p>{section.channel?.name}</p>
      </div>

      <div className="receipt-info">
        <p>Invoice: {invoiceNumber}</p>
        <p>Date: {date}</p>        
      </div>

      <hr />

      {/* Customer Info */}
      {customerName && <div className="receipt-customer">Customer: {customerName}</div>}
      {customerMobile && <div className="receipt-customer">Mobile: {customerMobile}</div>}

      <hr />

      {/* Items Table (Two-row per item) */}
      <table className="receipt-table">
        <thead>
          <tr>
            <th className="sl">Sl</th>
            <th className="item_th">Item Name</th>
            <th className="qty">Qty</th>
          </tr>
          <tr>
            <th className="barcode_th">Barcode</th>
            <th className="qty">Unit Price</th>
            <th className="amount">Amount</th>
          </tr>
        </thead>

        <hr />

        <tbody>
          {items.map((it, idx) => (
            <>
              {/* First row: Sl, Item Name, Qty */}
              <tr key={`row1-${idx}`}>
                <td className="sl">{idx + 1}.</td>
                <td className="item">{it.name.length > 25 ? it.name.slice(0, 25) + "..." : it.name}</td>
                <td className="qty">{it.qty}</td>
              </tr>
              {/* Second row: Barcode, Unit Price, Amount */}
              <tr key={`row2-${idx}`}>
                <td className="item barcode">{it.barcode || "-"}</td>
                <td className="qty">{it.price.toFixed(2)}</td>
                <td className="amount">{it.total.toFixed(2)}</td>
              </tr>
            </>
          ))}
        </tbody>
      </table>

      <hr />

      {/* Summary */}
      <div className="receipt-summary">
        <div className="summary-row">
          <span>Discount</span>
          <span>{discount.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Grand Total</span>
          <span>{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <hr />

      {/* Footer */}
      <div className="cashier-name">
        <p>Cashier: {cashier}</p>
      </div>
      <div className="receipt-footer">
        Thank you for shopping with us!
      </div>
    </div>
  )
);

export default PosReceipt;