import React, { forwardRef } from 'react';

type PrintableBarcodeProps = {
  products: {
    id: string;
    itemName: string;
    brand: string;
    serialNumber: string;
    barcode_image: string;
  }[];
};

const PrintableBarcode = forwardRef<HTMLDivElement, PrintableBarcodeProps>(({ products }, ref) => (
  <div ref={ref} style={{ padding: 20 }}>
    {products.map((product) => (
      <div
        key={product.id}
        style={{
          border: '1px solid #000',
          marginBottom: 20,
          padding: 10,
          width: 300,
          textAlign: 'center',
          pageBreakInside: 'avoid',
        }}
      >
        <img
          src={product.barcode_image}
          alt={`Barcode for ${product.itemName}`}
          style={{ maxWidth: '100%', height: 80, marginBottom: 10 }}
        />
        <div style={{ fontWeight: 'bold' }}>{product.itemName}</div>
        <div>{product.brand}</div>
        <div>Serial: {product.serialNumber}</div>
      </div>
    ))}
  </div>
));

export default PrintableBarcode;
