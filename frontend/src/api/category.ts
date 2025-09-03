import type { CategoryProps } from "src/sections/category/category-table-row";

import api from "src/utils/api";

const BASE_URL = "/api/products/categories/";

// ✅ Get all categories
export async function getCategories(): Promise<CategoryProps[]> {
  const response = await api.get(BASE_URL);
  return response.data;
}

// ✅ Create a new category
export async function createCategory(data: Omit<CategoryProps, "id">): Promise<CategoryProps> {
  const response = await api.post(BASE_URL, data);
  window.dispatchEvent(new Event("category-update"));
  return response.data;
}

// ✅ Update a category
export async function updateCategory(id: number, data: Partial<CategoryProps>): Promise<CategoryProps> {
  const response = await api.put(`${BASE_URL}${id}/`, data);
  window.dispatchEvent(new Event("category-update"));
  return response.data;
}

// ✅ Delete a category
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`${BASE_URL}${id}/`);
  window.dispatchEvent(new Event("category-update"));
}