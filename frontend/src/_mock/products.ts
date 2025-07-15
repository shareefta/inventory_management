// src/_mock/products.ts
import type { ProductProps } from 'src/sections/product/product-table-row';

export const _products: ProductProps[] = [
  {
    id: '1',
    uniqueId: 'PROD-001',
    itemName: 'iPhone 15',
    brand: 'Apple',
    serialNumber: 'SN123456',
    variants: '128GB, Black',
    category: 'Smartphones',
    rate: 4500,
    quantity: 25,
    location: 'Warehouse A',
    active: true,
  },
  {
    id: '2',
    uniqueId: 'PROD-002',
    itemName: 'Galaxy S24',
    brand: 'Samsung',
    serialNumber: 'SN987654',
    variants: '256GB, White',
    category: 'Smartphones',
    rate: 4200,
    quantity: 15,
    location: 'Warehouse B',
    active: false,
  },
];
