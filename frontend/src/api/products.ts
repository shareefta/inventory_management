import type { ProductProps } from 'src/sections/product/product-table-row';

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/products/products/';

export async function getProducts(): Promise<ProductProps[]> {
  const token = localStorage.getItem('token');
  const response = await axios.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // ✅ Transform snake_case to camelCase
  const data = response.data;
  return data.map((item: any) => ({
    id: item.id,
    uniqueId: item.unique_id,
    itemName: item.item_name,
    brand: item.brand,
    serialNumber: item.serial_number,
    variants: item.variants,
    category: item.category,
    rate: item.rate,
    quantity: item.quantity,
    location: item.location,
    active: item.active,
    image: item.image,
  }));
}

export async function createProduct(data: FormData) {
  const token = localStorage.getItem('token');
  const response = await axios.post(BASE_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getCategories() {
  const token = localStorage.getItem('token');
  const response = await axios.get('http://127.0.0.1:8000/api/products/categories/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data; // returns list of { id, name, description }
}

export async function getLocations() {
  const token = localStorage.getItem('token');
  const response = await axios.get('http://127.0.0.1:8000/api/products/locations/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data; // returns list of { id, name, description }
}

function toSnakeCase(obj: any) {
  return {
    unique_id: obj.uniqueId,
    item_name: obj.itemName,
    brand: obj.brand,
    serial_number: obj.serialNumber,
    variants: obj.variants,
    category: obj.category,
    rate: obj.rate,
    quantity: obj.quantity,
    location: obj.location,
    active: obj.active,
    image: obj.image,
  };
}

export async function updateProduct(id: string, data: any) {
  const token = localStorage.getItem('token');
  return axios.put(`${BASE_URL}${id}/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export const deleteProduct = (id: string) =>
  axios.delete(`${BASE_URL}${id}/`);