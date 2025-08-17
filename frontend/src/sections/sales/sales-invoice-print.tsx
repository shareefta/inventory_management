import "./receipt.css";

import type { SalesSection } from "src/api/sales";

import React, { forwardRef } from "react";

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
    price: number | string;
    total: number | string;
  }[];
  discount: number | string;
  grandTotal: number | string;
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
  ) => {
    // Ensure numbers
    const discountNum = Number(discount) || 0;
    const grandTotalNum = Number(grandTotal) || 0;

    return (
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

        {/* Items Table */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th className="sl">Sl</th>
              <th className="item_th">Item Name</th>
              <th className="qty">Qty</th>
            </tr>
            <tr>
              <th className="barcode_th">Barcode</th>
              <th className="unit_price">Unit Price</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, idx) => (
              <React.Fragment key={idx}>
                {/* First row */}
                <tr>
                  <td className="sl">{idx + 1}.</td>
                  <td className="item">{it.name.length > 25 ? it.name.slice(0, 25) + "..." : it.name}</td>
                  <td className="qty">{Number(it.qty).toFixed(0)}</td>
                </tr>
                {/* Second row */}
                <tr>
                  <td className="barcode">{it.barcode || "-"}</td>
                  <td className="unit_price">{it.price ? Number(it.price).toFixed(2) : "0.00"}</td>
                  <td className="amount">{it.total ? Number(it.total).toFixed(2) : "0.00"}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <hr />

        {/* Summary */}
        <div className="receipt-summary">
          <div className="summary-row">
            <span>Discount</span>
            <span>{discountNum.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Grand Total</span>
            <span>{grandTotalNum.toFixed(2)}</span>
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
    );
  }
);

export default PosReceipt;