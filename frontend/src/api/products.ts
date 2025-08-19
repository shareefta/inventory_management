import type { ProductProps } from 'src/sections/product/product-table-row';

import axios from 'axios';

const BASE_URL = 'https://razaworld.uk/api/products/products/';
const BARCODE_URL = 'https://razaworld.uk/api/products/scan/';

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No auth token');

  return {
    Authorization: `Bearer ${token}`,
    ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
  };
}

function triggerProductUpdate() {
  window.dispatchEvent(new Event('product-update'));
}

export async function getActiveProductCount(): Promise<number> {
  const response = await axios.get<{ count: number }>('https://razaworld.uk/api/products/active-count/', { headers: getAuthHeaders() });
  console.log("Active product count API response:", response.data);
  return response.data.count;
}

// ---- GET PAGINATED PRODUCTS ----
export async function getProducts(page = 1, limit = 25, search = ''): Promise<{ data: ProductProps[]; total: number }> {
  const response = await axios.get(BASE_URL, {
    headers: getAuthHeaders(),
    params: { page, limit, search },
  });

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


// ---- GET PRODUCT BY BARCODE ----
export async function getProductByBarcode(barcode: string): Promise<ProductProps> {
  const response = await axios.get(BARCODE_URL, {
    headers: getAuthHeaders(),
    params: { barcode },
  });

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

// ---- CREATE PRODUCT ----
export async function createProduct(data: FormData): Promise<ProductProps> {
  if (data.has('locations')) {
    const locations = data.get('locations');
    if (typeof locations !== 'string') {
      data.set('locations', JSON.stringify(locations));
    }
  }

  const response = await axios.post(BASE_URL, data, { headers: getAuthHeaders(true) });

  triggerProductUpdate();

  const raw = response.data;

  // Map snake_case from API to camelCase for frontend
  const product: ProductProps = {
    ...raw,
    itemName: raw.item_name,
    uniqueId: raw.unique_id,
    serialNumber: raw.serial_number,
  };

  return product;
}

// ---- CATEGORIES ----
export async function getCategories() {
  const response = await axios.get('https://razaworld.uk/api/products/categories/', {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// ---- LOCATIONS ----
export async function getLocations() {
  const response = await axios.get('https://razaworld.uk/api/products/locations/', {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// ---- UPDATE PRODUCT ----
export async function updateProduct(id: string, data: any, isFormData = false): Promise<ProductProps> {
  const response = await axios.put(`${BASE_URL}${id}/`, data, {
    headers: getAuthHeaders(isFormData),
  });

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
  try {
    const response = await axios.delete(`${BASE_URL}${id}/`, {
      headers: getAuthHeaders(),
    });
    triggerProductUpdate();
    return response;
  } catch (error) {
    console.error('Delete API error:', error);
    throw error;
  }
}

export async function downloadProductsExcel(search?: string, columns?: string[]) {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (columns) params.columns = columns.join(',');

  const response = await axios.get('https://razaworld.uk/api/products/export-excel/', {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob', // important for files
  });

  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'products.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}
