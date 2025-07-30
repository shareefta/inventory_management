import axios from 'axios';

const BASE_URL = 'https://razaworld.uk/api/products/purchases/';

// ------------------------------
// Interfaces
// ------------------------------
export interface PurchaseItem {
  product: number;
  quantity: number;
  rate: number;
  location: number;
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
  const formData = new FormData();

  formData.append('supplier_name', data.supplier_name);
  formData.append('invoice_number', data.invoice_number || '');
  formData.append('purchase_date', data.purchase_date);
  formData.append('total_amount', data.total_amount.toString());
  formData.append('discount', data.discount.toString());

  if (data.invoice_image) {
    formData.append('invoice_image', data.invoice_image);
  }

  // items is a nested list
  formData.append('items', JSON.stringify(data.items));

  const response = await axios.post(BASE_URL, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  window.dispatchEvent(new Event('purchase-update'));

  return response.data;
}

// Update purchase (also supports FormData for updates with image)
export async function updatePurchase(id: number, data: PurchaseFormData) {
  const formData = new FormData();

  formData.append('supplier_name', data.supplier_name);
  formData.append('invoice_number', data.invoice_number || '');
  formData.append('purchase_date', data.purchase_date);
  formData.append('total_amount', data.total_amount.toString());
  formData.append('discount', data.discount.toString());

  if (data.invoice_image) {
    formData.append('invoice_image', data.invoice_image);
  }

  formData.append('items', JSON.stringify(data.items));

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
