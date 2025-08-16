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

// ---- GET ALL PRODUCTS ----
export async function getProducts(): Promise<ProductProps[]> {
  const response = await axios.get(BASE_URL, { headers: getAuthHeaders() });

  return response.data.map((item: any) => ({
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
  return response.data;
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
export async function updateProduct(id: string, data: any, isFormData = false) {
  const response = await axios.put(`${BASE_URL}${id}/`, data, {
    headers: getAuthHeaders(isFormData),
  });

  triggerProductUpdate();
  return response.data;
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
