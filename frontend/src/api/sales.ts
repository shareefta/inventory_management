import axios from "axios";

// Interfaces
export interface SalesChannel {
  id: number;
  name: string;
}

export interface SalesSection {
  id: number;
  name: string;
  channel: SalesChannel;
  location?: number;
}

export interface SectionProductPrice {
  id: number;
  section: number;
  product: number;
  price: string;
}

export interface SaleItem {
  product?: number;
  product_name: string;
  product_barcode?: string;
  product_brand?: string;
  product_variant?: string;
  serial_number?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: number;
  channel: number;
  section: number;
  invoice_number: string;
  sale_datetime?: string;
  customer_name?: string;
  customer_mobile?: string;
  payment_mode?: "Cash" | "Credit" | "Online";
  discount?: number;
  total_amount?: number;
  created_by?: string;
  items?: SaleItem[];
}

// --- Axios instance ---
const api = axios.create({
  baseURL: "https://razaworld.uk/api/sales/",
});

// Interceptor: add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    // Option 1: Using set() if Axios 1.x
    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      // fallback for older versions or TS type issues
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Channels ---
export const getChannels = () => api.get<SalesChannel[]>("channels/");
export const createChannel = (name: string) => api.post("channels/", { name });
export const updateChannel = (id: number, name: string) => api.put(`channels/${id}/`, { name });
export const deleteChannel = (id: number) => api.delete(`channels/${id}/`);

// --- Sections ---
export const getSections = (channelId?: number) =>
  api.get<SalesSection[]>("sections/", { params: channelId ? { channel_id: channelId } : {} });

export const createSection = (section: { name: string; channel_id: number; location?: number }) =>
  api.post("sections/", section);

export const updateSection = (id: number, section: { name: string; channel_id: number; location?: number }) =>
  api.put(`sections/${id}/`, section);

export const deleteSection = (id: number) => api.delete(`sections/${id}/`);

// --- Section Product Prices ---
export const getSectionPrices = (sectionId: number) =>
  api.get<SectionProductPrice[]>("prices/", { params: { section_id: sectionId } })
    .then(res => res.data);

export const bulkSetSectionPrices = (
  sections: number | number[],
  items: { product: number; price: string }[]
) =>
  api.post("prices/bulk-set/", { sections, items });

// --- Sales ---
export const getSales = () => api.get<Sale[]>("sales/");
export const createSale = (sale: Partial<Sale>) => api.post("sales/", sale);
export const updateSale = (id: number, sale: Partial<Sale>) => api.put(`sales/${id}/`, sale);
export const deleteSale = (id: number) => api.delete(`sales/${id}/`);
