import api from 'src/utils/api';

// Define a proper Location type
export interface LocationProps {
  id: number;
  name: string;
  label?: string; // optional, can be used for display
}

const BASE_URL = '/api/products/locations/';

// ✅ Get all locations
export async function getLocations(): Promise<LocationProps[]> {
  const response = await api.get(BASE_URL);
  return response.data;
}

// ✅ Create a new location
export async function createLocation(data: Omit<LocationProps, 'id'>): Promise<LocationProps> {
  const response = await api.post(BASE_URL, data);
  window.dispatchEvent(new Event('location-update'));
  return response.data;
}

// ✅ Update a location
export async function updateLocation(
  id: number,
  data: Partial<LocationProps>
): Promise<LocationProps> {
  const response = await api.put(`${BASE_URL}${id}/`, data);
  window.dispatchEvent(new Event('location-update'));
  return response.data;
}

// ✅ Delete a location
export async function deleteLocation(id: number): Promise<void> {
  await api.delete(`${BASE_URL}${id}/`);
  window.dispatchEvent(new Event('location-update'));
}