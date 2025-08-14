// InvoicePrint.tsx
import React, { forwardRef } from "react";

interface InvoicePrintProps {
  invoiceData: any;
}

const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoiceData }, ref) => (
    <div
      ref={ref}
      style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}
    >
      {/* 1. Section address */}
      <h2>{invoiceData.section.name}</h2>
      <p>{invoiceData.section.address}</p>

      {/* 2. Customer's data */}
      <h3>Customer Info</h3>
      <p>Name: {invoiceData.customer_name}</p>
      <p>Mobile: {invoiceData.customer_mobile}</p>

      {/* 3. Sales items */}
      <h3>Items</h3>
      <table width="100%" border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>Sl. No.</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.items_write.map((item: any, idx: number) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{item.product_name}</td>
              <td>{item.quantity}</td>
              <td>{item.price.toFixed(2)}</td>
              <td>{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Discount & 5. Grand Total */}
      <h3>Summary</h3>
      <p>Discount: {invoiceData.discount.toFixed(2)}</p>
      <p>Grand Total: {invoiceData.total_amount.toFixed(2)}</p>

      {/* 6. Date */}
      <p>Date: {new Date().toLocaleString()}</p>

      {/* 7. User info */}
      <p>Sold by: {invoiceData.user}</p>
    </div>
  )
);


export default InvoicePrint;
