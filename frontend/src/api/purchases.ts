import axios from 'axios';

const BASE_URL = 'https://razaworld.uk/api/products/purchases/';

// ------------------------------
// Interfaces for API data
// ------------------------------
export interface PurchaseItem {
  product: number;
  rate: number;
  item_locations: {
    location: number;
    quantity: number;
  }[];
}

export interface PurchaseFormData {
  supplier_name: string;
  invoice_number?: string;
  purchase_date: string;
  total_amount: number;
  discount: number;
  invoice_image?: File | null;
  items: PurchaseItem[];
}

// ------------------------------
// Frontend Props Types for UI
// ------------------------------
export type PurchaseItemLocationEntry = {
  id?: number;
  location: number | { id: number; name: string };
  quantity: number;
};

export type PurchaseItemEntry = {
  id?: number;
  product: number | { id: number; itemName: string };
  rate: number;
  item_locations: PurchaseItemLocationEntry[];
};

export type PurchaseProps = {
  id?: number;
  supplier_name: string;
  invoice_number?: string;
  purchase_date: string;
  discount: number;
  total_amount?: number;
  invoice_image?: string | File | null;
  created_at?: string;
  created_by?: string | number | null;
  items: PurchaseItemEntry[];
};

// ------------------------------
// Auth Helper
// ------------------------------
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No auth token');
  return {
    Authorization: `Bearer ${token}`,
  };
}

// ------------------------------
// API Functions
// ------------------------------

// Get all purchases
export async function getPurchases() {
  const response = await axios.get(BASE_URL, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get single purchase by ID
export async function getPurchaseById(id: number) {
  const response = await axios.get(`${BASE_URL}${id}/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Create new purchase (multipart/form-data)
export async function createPurchase(data: PurchaseFormData) {
  const token = localStorage.getItem('token');

  const formData = new FormData();

  formData.append('supplier_name', data.supplier_name);
  formData.append('invoice_number', data.invoice_number || '');
  formData.append('purchase_date', data.purchase_date);
  formData.append('total_amount', data.total_amount.toString());
  formData.append('discount', data.discount.toString());

  if (data.invoice_image) {
    formData.append('invoice_image', data.invoice_image);
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Purchase items are required');
  }
  console.log('Submitting purchase items:', data.items);
  
  // items is a nested list, stringify for backend
  formData.append('items', JSON.stringify(data.items));

  try {
    const response = await axios.post(BASE_URL, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  window.dispatchEvent(new Event('purchase-update'));

  return response.data;

  } catch (error) {
    console.error('Purchase create failed', error);
    throw error;
  }}

// Update purchase (also supports FormData for updates with image)
export async function updatePurchase(id: number, formData: FormData) {
  const response = await axios.put(`${BASE_URL}${id}/`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  window.dispatchEvent(new Event('purchase-update'));

  return response.data;
}

// Delete a purchase
export async function deletePurchase(id: number) {
  const response = await axios.delete(`${BASE_URL}${id}/`, {
    headers: getAuthHeaders(),
  });

  window.dispatchEvent(new Event('purchase-update'));
  return response;
}
