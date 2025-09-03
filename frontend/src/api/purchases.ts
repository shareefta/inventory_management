import type { ProductProps } from 'src/sections/product/product-table-row';

import api from 'src/utils/api';

// ------------------------
// Types
// ------------------------
export type PurchaseItemLocation = {
  id?: number;
  location: number | null;
  quantity: number;
};

export type PurchaseItem = {
  id?: number;
  product: ProductProps | null;
  rate: number;
  item_locations: PurchaseItemLocation[];
};

export type PurchaseProps = {
  id?: number;
  supplier_name: string;
  invoice_number: string;
  invoice_image?: string | null;
  purchase_date: string;
  payment_mode: PaymentMode | null;
  purchased_by: PurchasedBy | null;
  discount: number;
  total_amount?: number;
  items: PurchaseItem[];
};

export type PurchaseCreatePayload = {
  supplier_name: string;
  invoice_number: string;
  invoice_image?: string | null;
  purchase_date: string;
  payment_mode_id: number;
  purchased_by_id: number;
  discount: number;
  total_amount: number;
  items: {
    product_id: number;
    rate: number;
    item_locations: {
      location: number;
      quantity: number;
    }[];
  }[];
};

export type PurchaseUpdatePayload = {
  supplier_name: string;
  invoice_number: string;
  invoice_image?: string | null;
  purchase_date: string;
  payment_mode_id: number;
  purchased_by_id: number;
  discount: number;
  total_amount: number;
  items: {
    id?: number;
    product_id: number;
    rate: number;
    item_locations: {
      id?: number;
      location: number;
      quantity: number;
    }[];
  }[];
};

export type PaymentMode = {
  id?: number;
  name: string;
};

export type PurchasedBy = {
  id?: number;
  name: string;
};

// ------------------------
// API Endpoints
// ------------------------
const BASE_URL_PURCHASES = '/api/products/purchases/';
const BASE_URL_PRODUCTS = '/api/products/';

// ------------------------
// Purchases APIs
// ------------------------
export async function getPurchases(): Promise<PurchaseProps[]> {
  const res = await api.get(BASE_URL_PURCHASES);
  return res.data;
}

export async function getPurchase(id: number): Promise<PurchaseProps> {
  const res = await api.get(`${BASE_URL_PURCHASES}${id}/`);
  return res.data;
}

export async function createPurchase(data: PurchaseCreatePayload): Promise<PurchaseProps> {
  const res = await api.post(BASE_URL_PURCHASES, data);
  return res.data;
}

export async function updatePurchase(id: number, data: PurchaseUpdatePayload): Promise<PurchaseProps> {
  const res = await api.put(`${BASE_URL_PURCHASES}${id}/`, data);
  return res.data;
}

export async function deletePurchase(id: number) {
  return api.delete(`${BASE_URL_PURCHASES}${id}/`);
}

export async function getPurchaseDetails(id: number): Promise<any> {
  const res = await api.get(`${BASE_URL_PURCHASES}${id}/details/`);
  return res.data;
}

// ------------------------
// PaymentMode APIs
// ------------------------
export async function getPaymentModes(): Promise<PaymentMode[]> {
  const res = await api.get(`${BASE_URL_PRODUCTS}payment-modes/`);
  return res.data;
}

export async function createPaymentMode(data: PaymentMode): Promise<PaymentMode> {
  const res = await api.post(`${BASE_URL_PRODUCTS}payment-modes/`, data);
  return res.data;
}

export async function updatePaymentMode(id: number, data: PaymentMode): Promise<PaymentMode> {
  const res = await api.put(`${BASE_URL_PRODUCTS}payment-modes/${id}/`, data);
  return res.data;
}

export async function deletePaymentMode(id: number) {
  return api.delete(`${BASE_URL_PRODUCTS}payment-modes/${id}/`);
}

// ------------------------
// PurchasedBy APIs
// ------------------------
export async function getPurchasedBys(): Promise<PurchasedBy[]> {
  const res = await api.get(`${BASE_URL_PRODUCTS}purchased-by/`);
  return res.data;
}

export async function createPurchasedBy(data: PurchasedBy): Promise<PurchasedBy> {
  const res = await api.post(`${BASE_URL_PRODUCTS}purchased-by/`, data);
  return res.data;
}

export async function updatePurchasedBy(id: number, data: PurchasedBy): Promise<PurchasedBy> {
  const res = await api.put(`${BASE_URL_PRODUCTS}purchased-by/${id}/`, data);
  return res.data;
}

export async function deletePurchasedBy(id: number) {
  return api.delete(`${BASE_URL_PRODUCTS}purchased-by/${id}/`);
}

// ------------------------
// Suppliers API
// ------------------------
export async function getSuppliers(): Promise<string[]> {
  const res = await api.get(`${BASE_URL_PURCHASES}suppliers/`);
  return res.data;
}