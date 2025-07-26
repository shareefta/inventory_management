import type { CategoryProps } from 'src/sections/category/category-table-row';

import axios from 'axios';

const BASE_URL = 'https://razaworld.uk/api/products/categories/';

// ✅ Get all categories
export async function getCategories(): Promise<CategoryProps[]> {
  const token = localStorage.getItem('token');
  const response = await axios.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

// ✅ Create a new category
export async function createCategory(data: Omit<CategoryProps, 'id'>): Promise<CategoryProps> {
  const token = localStorage.getItem('token');
  const response = await axios.post(BASE_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  window.dispatchEvent(new Event('category-update'));

  return response.data;
}

// ✅ Update a category
export async function updateCategory(id: number, data: Partial<CategoryProps>): Promise<CategoryProps> {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${BASE_URL}${id}/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  window.dispatchEvent(new Event('category-update'));

  return response.data;
}

// ✅ Delete a category
export async function deleteCategory(id: number): Promise<void> {
  const token = localStorage.getItem('token');
  await axios.delete(`${BASE_URL}${id}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  window.dispatchEvent(new Event('category-update'));
}
