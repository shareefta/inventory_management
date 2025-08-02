import axios from 'axios';

const BASE_URL = 'https://razaworld.uk/api/products/purchases/';

export type PurchaseItemLocation = {
  id?: number;
  location: number;
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
  invoice_image?: string | File | null;
  purchase_date: string;
  payment_mode: 'Cash' | 'Credit' | 'Card' | 'Online';
  purchased_by: 'AZIZIYAH_SHOP' | 'ALWAB_SHOP' | 'MAIN_STORE' | 'JAMSHEER' | 'FAWAS' | 'IRSHAD' | 'MOOSA' | 'FATHIH' | 'FIROZ';
  discount: number;
  total_amount?: number;
  items: PurchaseItem[];
};

const getToken = () => localStorage.getItem('token');

export async function getPurchases(): Promise<PurchaseProps[]> {
  const token = getToken();
  const res = await axios.get(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getPurchase(id: number): Promise<PurchaseProps> {
  const token = getToken();
  const res = await axios.get(`${BASE_URL}${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createPurchase(data: PurchaseProps): Promise<PurchaseProps> {
  const token = getToken();

  const res = await axios.post(BASE_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return res.data;
}

export async function updatePurchase(id: number, data: PurchaseProps): Promise<PurchaseProps> {
  const token = getToken();

  const res = await axios.put(`${BASE_URL}${id}/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return res.data;
}

export async function deletePurchase(id: number) {
  const token = getToken();
  return axios.delete(`${BASE_URL}${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getPurchaseDetails(id: number): Promise<any> {
  const token = getToken();

  const res = await axios.get(`${BASE_URL}${id}/details/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}