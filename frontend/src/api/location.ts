import type { CategoryProps } from 'src/sections/category/category-table-row';

import axios from 'axios';

const BASE_URL = 'https://razaworld.uk/api/products/locations/';

// ✅ Get all locations
export async function getLocations(): Promise<CategoryProps[]> {
  const token = localStorage.getItem('token');
  const response = await axios.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

// ✅ Create a new location
export async function createLocation(data: Omit<CategoryProps, 'id'>): Promise<CategoryProps> {
  const token = localStorage.getItem('token');
  const response = await axios.post(BASE_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  window.dispatchEvent(new Event('location-update'));

  return response.data;
}

// ✅ Update a category
export async function updateLocation(id: number, data: Partial<CategoryProps>): Promise<CategoryProps> {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${BASE_URL}${id}/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  window.dispatchEvent(new Event('location-update'));

  return response.data;
}

// ✅ Delete a category
export async function deleteLocation(id: number): Promise<void> {
  const token = localStorage.getItem('token');
  await axios.delete(`${BASE_URL}${id}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  window.dispatchEvent(new Event('location-update'));
}
