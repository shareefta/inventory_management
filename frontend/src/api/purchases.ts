import axios from 'axios';

const BASE_URL_PURCHASES = 'https://razaworld.uk/api/products/purchases/';
const BASE_URL = 'https://razaworld.uk/api/products/';

export type PurchaseItemLocation = {
  id?: number;
  location: number | null;
  quantity: number;
};

export type PurchaseItem = {
  id?: number;
  product: number;
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
    product: number;
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
    product: number;
    rate: number;
    item_locations: {
      id?: number;
      location: number;
      quantity: number;
    }[];
  }[];
};

// -------------------- Utils --------------------
const getToken = () => localStorage.getItem("token");

// -------------------- API Calls --------------------
export async function getPurchases(): Promise<PurchaseProps[]> {
  const token = getToken();
  const res = await axios.get(BASE_URL_PURCHASES, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getPurchase(id: number): Promise<PurchaseProps> {
  const token = getToken();
  const res = await axios.get(`${BASE_URL_PURCHASES}${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createPurchase(
  data: PurchaseCreatePayload
): Promise<PurchaseProps> {
  const token = getToken();
  const res = await axios.post(`${BASE_URL_PURCHASES}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export async function updatePurchase(
  id: number,
  data: PurchaseUpdatePayload
): Promise<PurchaseProps> {
  const token = getToken();
  const res = await axios.put(`${BASE_URL_PURCHASES}${id}/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export async function deletePurchase(id: number) {
  const token = getToken();
  return axios.delete(`${BASE_URL_PURCHASES}${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getPurchaseDetails(id: number): Promise<any> {
  const token = getToken();

  const res = await axios.get(`${BASE_URL_PURCHASES}${id}/details/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

// ------------------------
// Types
// ------------------------
export type PaymentMode = {
  id?: number;
  name: string;
};

export type PurchasedBy = {
  id?: number;
  name: string;
};

// ------------------------
// PaymentMode APIs
// ------------------------
export async function getPaymentModes(): Promise<PaymentMode[]> {
  const token = getToken();
  const res = await axios.get(`${BASE_URL}payment-modes/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createPaymentMode(data: PaymentMode): Promise<PaymentMode> {
  const token = getToken();
  const res = await axios.post(`${BASE_URL}payment-modes/`, data, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.data;
}

export async function updatePaymentMode(id: number, data: PaymentMode): Promise<PaymentMode> {
  const token = getToken();
  const res = await axios.put(`${BASE_URL}payment-modes/${id}/`, data, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.data;
}

export async function deletePaymentMode(id: number) {
  const token = getToken();
  return axios.delete(`${BASE_URL}payment-modes/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ------------------------
// PurchasedBy APIs
// ------------------------
export async function getPurchasedBys(): Promise<PurchasedBy[]> {
  const token = getToken();
  const res = await axios.get(`${BASE_URL}purchased-by/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createPurchasedBy(data: PurchasedBy): Promise<PurchasedBy> {
  const token = getToken();
  const res = await axios.post(`${BASE_URL}purchased-by/`, data, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.data;
}

export async function updatePurchasedBy(id: number, data: PurchasedBy): Promise<PurchasedBy> {
  const token = getToken();
  const res = await axios.put(`${BASE_URL}purchased-by/${id}/`, data, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.data;
}

export async function deletePurchasedBy(id: number) {
  const token = getToken();
  return axios.delete(`${BASE_URL}purchased-by/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Fetch distinct supplier names
export async function getSuppliers(): Promise<string[]> {
  const token = getToken();
  const res = await axios.get(`${BASE_URL_PURCHASES}suppliers/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}