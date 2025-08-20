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
  channel_id?: number;
  location?: number;

  // ✅ new fields
  building_no?: string;
  street_no?: string;
  zone_no?: string;
  short_name?: string;
  logo?: string;
}

export interface SectionProductPrice {
  id: number;
  section: number;
  product: number;
  price: string;      // this corresponds to final_price
  is_manual: boolean; // whether the user has manually overridden the price
}

export interface SaleItem {
  id: number;
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

export interface SalesReturnItem {
  sale_item: number;
  quantity: number;
}

export interface SalesReturn {
  id: number;
  sale: number;
  customer?: number;
  created_at?: string;
  refund_amount: number;
  refund_to_wallet: boolean;
  refund_mode: "cash" | "card" | "online" | "wallet";
  created_by?: string;
  items: SalesReturnItem[];
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
  api.get<SalesSection[]>("sections/", {
    params: channelId ? { channel_id: channelId } : {},
  });

// include all section fields except `id` (backend generates it)
export type SectionPayload = {
  name: string;
  channel_id: number;
  location?: number;
  building_no?: string;
  street_no?: string;
  zone_no?: string;
  short_name?: string;
  logo?: File | string | null; // File when uploading, string when updating
};

export const createSection = (section: SectionPayload) => {
  const formData = new FormData();
  Object.entries(section).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value as any);
    }
  });
  return api.post<SalesSection>("sections/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateSection = (id: number, section: SectionPayload) => {
  const formData = new FormData();
  Object.entries(section).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value as any);
    }
  });
  return api.put<SalesSection>(`sections/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteSection = (id: number) =>
  api.delete(`sections/${id}/`);

// --- Section Product Prices ---
export const getSectionPrices = (sectionId: number) =>
  api.get<SectionProductPrice[]>("prices/", { params: { section_id: sectionId } })
    .then(res => res.data);

export const bulkSetSectionPrices = (
  sections: number | number[],
  items: { product: number; price?: string | null }[]
) =>
  api.post("prices/bulk-set/", { sections, items });

// --- Sales ---
export const getSales = () => api.get<Sale[]>("sales/");
export const createSale = (sale: Partial<Sale>) => api.post("sales/", sale);
export const updateSale = (id: number, sale: Partial<Sale>) => api.put(`sales/${id}/`, sale);
export const deleteSale = (id: number) => api.delete(`sales/${id}/`);

// Fetch all returns (optionally filter by saleId or other fields)
export const getSalesReturns = (filters?: {
  sale?: number;
  invoice?: string;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
}) =>
  api
    .get<SalesReturn[]>("sales-returns/", { params: filters })
    .then(res => res.data);

// Fetch single return
export const getSalesReturn = (id: number) =>
  api.get<SalesReturn>(`sales-returns/${id}/`).then(res => res.data);

// Create new sales return
export const createSalesReturn = (data: {
  sale: number;
  customer?: number;
  refund_mode?: "cash" | "card" | "online" | "wallet";
  items_write: SalesReturnItem[];
}) => api.post("sales-returns/", data);

// Update sales return (rarely needed, mostly for admin corrections)
export const updateSalesReturn = (id: number, data: Partial<SalesReturn>) =>
  api.put(`sales-returns/${id}/`, data);

// Delete a sales return (admin only)
export const deleteSalesReturn = (id: number) => api.delete(`sales-returns/${id}/`);