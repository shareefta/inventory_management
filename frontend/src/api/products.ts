import type { ProductProps } from 'src/sections/product/product-table-row';

import api from 'src/utils/api';

const BASE_URL = '/api/products/products/';
const BARCODE_URL = '/api/products/scan/';

// Helper to trigger updates in UI
function triggerProductUpdate() {
  window.dispatchEvent(new Event('product-update'));
}

// ---- GET PRODUCT STATS ----
export async function getProductStats(): Promise<{ active_count: number; total_quantity: number; total_cost: number }> {
  const response = await api.get('/api/products/product-stats/');
  console.log("Product stats API response:", response.data);
  return response.data;
}

// ---- GET PAGINATED PRODUCTS ----
export async function getProducts(page = 1, limit = 25, search = ''): Promise<{ data: ProductProps[]; total: number }> {
  const response = await api.get(BASE_URL, { params: { page, limit, search } });

  const products = response.data.results.map((item: any) => ({
    id: item.id,
    uniqueId: item.unique_id,
    itemName: item.item_name,
    brand: item.brand,
    serialNumber: item.serial_number,
    variants: item.variants,
    category: item.category,
    rate: Number(item.rate),
    locations: item.locations.map((l: any) => ({
      location: l.location,
      quantity: l.quantity,
    })),
    total_quantity: item.total_quantity,
    active: item.active,
    image: item.image,
    description: item.description,
    section_prices: item.section_prices?.map((sp: any) => ({
      section: sp.section,
      price: Number(sp.price),
    })) || [],
  }));

  return {
    data: products,
    total: response.data.count,
  };
}

// ---- GET SINGLE PRODUCT ----
export async function getProduct(id: number): Promise<ProductProps> {
  const response = await api.get(`${BASE_URL}${id}/`);

  const item = response.data;

  return {
    id: item.id,
    uniqueId: item.unique_id,
    itemName: item.item_name,
    brand: item.brand,
    serialNumber: item.serial_number,
    variants: item.variants,
    category: item.category,
    rate: Number(item.rate),
    locations: item.locations.map((l: any) => ({
      location: l.location,
      quantity: l.quantity,
    })),
    total_quantity: item.total_quantity,
    active: item.active,
    image: item.image,
    description: item.description,
    section_prices:
      item.section_prices?.map((sp: any) => ({
        section: sp.section,
        price: Number(sp.price),
      })) || [],
  };
}

// ---- GET PRODUCT BY BARCODE ----
export async function getProductByBarcode(barcode: string): Promise<ProductProps> {
  const response = await api.get(BARCODE_URL, { params: { barcode } });
  const item = response.data.product;

  return {
    id: item.id,
    uniqueId: item.unique_id,
    itemName: item.item_name,
    brand: item.brand,
    serialNumber: item.serial_number,
    variants: item.variants,
    category: item.category,
    rate: Number(item.rate),
    locations: item.locations.map((l: any) => ({
      location: l.location,
      quantity: l.quantity,
    })),
    total_quantity: item.total_quantity,
    active: item.active,
    image: item.image,
    description: item.description,
    section_prices: item.section_prices?.map((sp: any) => ({
      section: sp.section,
      price: Number(sp.price),
    })) || [],
  };
}

// ---- CREATE PRODUCT ----
export async function createProduct(data: FormData): Promise<ProductProps> {
  if (data.has('locations')) {
    const locations = data.get('locations');
    if (typeof locations !== 'string') {
      data.set('locations', JSON.stringify(locations));
    }
  }

  const response = await api.post(BASE_URL, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  triggerProductUpdate();

  const raw = response.data;
  return {
    ...raw,
    itemName: raw.item_name,
    uniqueId: raw.unique_id,
    serialNumber: raw.serial_number,
  };
}

// ---- UPDATE PRODUCT ----
export async function updateProduct(id: string, data: any, isFormData = false): Promise<ProductProps> {
  const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
  const response = await api.put(`${BASE_URL}${id}/`, data, { headers });
  triggerProductUpdate();

  const item = response.data;
  return {
    id: item.id,
    uniqueId: item.unique_id,
    itemName: item.item_name,
    brand: item.brand,
    serialNumber: item.serial_number,
    variants: item.variants,
    category: item.category,
    rate: Number(item.rate),
    locations: item.locations.map((l: any) => ({
      location: l.location,
      quantity: l.quantity,
    })),
    total_quantity: item.total_quantity,
    active: item.active,
    image: item.image,
    description: item.description,
    section_prices: item.section_prices?.map((sp: any) => ({
      section: sp.section,
      price: Number(sp.price),
    })) || [],
  };
}

// ---- DELETE PRODUCT ----
export async function deleteProduct(id: string) {
  const response = await api.delete(`${BASE_URL}${id}/`);
  triggerProductUpdate();
  return response;
}

// ---- GET CATEGORIES ----
export async function getCategories() {
  const response = await api.get('/api/products/categories/');
  return response.data;
}

// ---- GET LOCATIONS ----
export async function getLocations() {
  const response = await api.get('/api/products/locations/');
  return response.data;
}

// ---- DOWNLOAD EXCEL ----
export async function downloadProductsExcel(search?: string, columns?: string[]) {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (columns) params.columns = columns.join(',');

  const response = await api.get('/api/products/export-excel/', { params, responseType: 'blob' });

  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'products.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ---- PURCHASE STATS TYPES ----
export interface PeriodStats {
  count: number;
  total_amount: number;
  total_items: number;
}

export interface PurchaseStats {
  purchases_total: number;
  purchases_after_return: number;
  purchases_today: number;
  purchases_today_after_return: number;
  purchases_month: number;
  purchases_month_after_return: number;
  purchases_fy: number;
  purchases_fy_after_return: number;
  purchase_return_total: number;
  purchase_return_today: number;
  purchase_return_month: number;
  purchase_return_fy: number;
  today?: PeriodStats;
  current_month?: PeriodStats;
  financial_year?: PeriodStats;
  month_totals: number[];
}

// ---- GET PURCHASE STATS ----
export async function getPurchaseStats(): Promise<PurchaseStats> {
  const response = await api.get('/api/products/purchase-stats/');
  console.log('Purchase stats API response:', response.data);
  return response.data;
}