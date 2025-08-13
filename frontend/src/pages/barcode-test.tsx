import JsBarcode from 'jsbarcode';
import React, { useEffect, useRef } from 'react';

export default function JsBarcodeTest() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, '6974316280095', {
        format: 'CODE128',
        lineColor: '#000',
        width: 2,
        height: 50,
        displayValue: true,
        margin: 0,
      });
    }
  }, []);

  return (
    <div>
      <h3>Barcode Test</h3>
      <svg
        ref={svgRef}
        style={{ width: '150px', height: '60px', border: '1px solid blue', display: 'block' }}
      />
    </div>
  );
}
