import type { ProductProps } from 'src/sections/product/product-table-row';

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/products/products/';

export async function getProducts(): Promise<ProductProps[]> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No auth token');

  const response = await axios.get(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.map((item: any) => ({
    id: item.id,
    uniqueId: item.unique_id,
    itemName: item.item_name,
    brand: item.brand,
    serialNumber: item.serial_number,
    variants: item.variants,
    category: item.category,
    rate: item.rate,
    locations: item.locations,
    total_quantity: item.total_quantity,
    active: item.active,
    image: item.image,
    description: item.description,
    barcode_image: item.barcode_image,
  }));
}

export async function createProduct(data: FormData): Promise<ProductProps> {
  const token = localStorage.getItem('token');

  if (data.has('locations')) {
    const locations = data.get('locations');
    if (typeof locations !== 'string') {
      data.set('locations', JSON.stringify(locations));
    }
  }
   
  const response = await axios.post(BASE_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  window.dispatchEvent(new Event('product-update'));
  
  return response.data;
}

export async function getCategories() {
  const token = localStorage.getItem('token');
  const response = await axios.get('http://127.0.0.1:8000/api/products/categories/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getLocations() {
  const token = localStorage.getItem('token');
  const response = await axios.get('http://127.0.0.1:8000/api/products/locations/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
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
    locations: obj.locations,
    active: obj.active,
    image: obj.image,
    description: obj.description,
  };
}

export async function updateProduct(id: string, data: any, isFormData = false) {
  const token = localStorage.getItem('token');
  const headers: any = {
    Authorization: `Bearer ${token}`,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await axios.put(`${BASE_URL}${id}/`, data, {
    headers,
  });

  // Now dispatch event after success
  window.dispatchEvent(new Event('product-update'));

  return response.data;
}

export const deleteProduct = async (id: string) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.delete(`${BASE_URL}${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Delete response:', response);
    window.dispatchEvent(new Event('product-update'));
    return response;
  } catch (error) {
    console.error('Delete API error:', error);
    throw error;
  }
};
