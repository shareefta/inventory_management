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
    const discountNum = Number(discount) || 0;
    const grandTotalNum = Number(grandTotal) || 0;

    return (
      <div ref={ref} className="receipt">
        {/* Header */}
        <div className="receipt-header">
          {/* Section Logo */}
          {section.logo && (
            <div className="receipt-logo">
              <img src={section.logo} alt="Section Logo" />
            </div>
          )}
          <h2>{section.name}</h2>

          {/* Section Address */}
          <div className="receipt-address">
            {(section.building_no || section.street_no || section.zone_no) && (
              <p>
                {section.building_no && `Building ${section.building_no}`}
                {section.street_no && `, Street ${section.street_no}`}
                {section.zone_no && `, Zone ${section.zone_no}`}
              </p>
            )}
            <p>
              {section.place ? `${section.place}, Doha, Qatar` : "Doha, Qatar"}
            </p>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="receipt-info">
          <div className="info-row">
            <span className="label-en">Invoice:</span>
            <span className="value">{invoiceNumber}</span>
            <span className="label-ar" dir="rtl">رقم الفاتورة</span>
          </div>
          <div className="info-row">
            <span className="label-en">Date:</span>
            <span className="value">
              {new Date(date).toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </span>
            <span className="label-ar" dir="rtl">التاريخ</span>
          </div>
        </div>

        <hr />

        {/* Customer Info */}
        {customerName && (
          <div className="receipt-info">
            <div className="info-row">
              <span className="label-en">Customer:</span>
              <span className="value">{customerName}</span>
              <span className="label-ar" dir="rtl">اسم العميل</span>
            </div>
          </div>
        )}
        {customerMobile && (
          <div className="receipt-info">
            <div className="info-row">
              <span className="label-en">Mobile:</span>
              <span className="value">{customerMobile}</span>
              <span className="label-ar" dir="rtl">رقم الجوال</span>
            </div>
          </div>
        )}

        <hr />

        {/* Items Table */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th className="sl">
                Sl.<br />No.
              </th>
              <th className="item_th">
                Item Name<br />
                <span dir="rtl">اسم الصنف</span>
              </th>
              <th className="qty">
                Qty<br />
                <span dir="rtl">الكمية</span>
              </th>
            </tr>
            <tr>
              <th className="barcode_th">
                Barcode<br />
                <span dir="rtl">باركود</span>
              </th>
              <th className="unit_price">
                Unit Price<br />
                <span dir="rtl">سعر الوحدة</span>
              </th>
              <th className="amount">
                Amount<br />
                <span dir="rtl">المبلغ</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, idx) => (
              <React.Fragment key={idx}>
                <tr>
                  <td className="sl">{idx + 1}.</td>
                  <td className="item">
                    {it.name.length > 25 ? it.name.slice(0, 25) + "..." : it.name}
                  </td>
                  <td className="qty">{Number(it.qty).toFixed(0)}</td>
                </tr>
                <tr>
                  <td className="barcode">{it.barcode || "-"}</td>
                  <td className="unit_price">
                    {it.price ? Number(it.price).toFixed(2) : "0.00"}
                  </td>
                  <td className="amount">
                    {it.total ? Number(it.total).toFixed(2) : "0.00"}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <hr />

        {/* Summary */}
        <div className="receipt-summary">
          <div className="summary-row">
            <span>
              Discount<br />
              <span dir="rtl">الخصم</span>
            </span>
            <span>{discountNum.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>
              Grand Total<br />
              <span dir="rtl">الإجمالي</span>
            </span>
            <span>{grandTotalNum.toFixed(2)}</span>
          </div>
        </div>

        <hr />

        {/* Footer */}
        <div className="cashier-name">
          <p>
            Cashier: {cashier} <br />
            <span dir="rtl">أمين الصندوق</span>
          </p>
        </div>
        <div className="receipt-footer">
          Thank you for shopping with us! <br />
          <span dir="rtl">شكراً لتسوقكم معنا!</span>
        </div>
      </div>
    );
  }
);

export default PosReceipt;