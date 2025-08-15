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
        <p>Cashier: {cashier}</p>
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
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              {/* Limit long names to 20 chars per line */}
              <td className="item-name">
                {it.name.length > 20
                  ? it.name.match(/.{1,20}/g)?.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))
                  : it.name}
              </td>
              <td className="qty">{it.qty}</td>
              <td className="price">{it.price.toFixed(2)}</td>
              <td className="total">{it.total.toFixed(2)}</td>
            </tr>
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
      <div className="receipt-footer">
        Thank you for shopping with us!
      </div>
    </div>
  )
);

export default PosReceipt;