import api from 'src/utils/api';

// ------------------------
// Types
// ------------------------
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
  building_no?: string;
  street_no?: string;
  zone_no?: string;
  place?: string;
  short_name?: string;
  logo?: string;
}

export interface SectionProductPrice {
  id: number;
  section: number;
  product: number;
  price: string;      // final price
  is_manual: boolean; // manually overridden?
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
  customer?: number;
  customer_name?: string;
  customer_mobile?: string;
  payment_mode?: "Cash" | "Credit" | "Bank" | "Wallet";
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
  refund_mode: "Cash" | "Bank" | "Wallet";
  created_by?: string;
  items: SalesReturnItem[];
}

// ------------------------
// Base URL
// ------------------------
const BASE_URL = '/api/sales/';

// ------------------------
// Channels APIs
// ------------------------
export const getChannels = () => api.get<SalesChannel[]>(`${BASE_URL}channels/`).then(res => res.data);
export const createChannel = (name: string) => api.post(`${BASE_URL}channels/`, { name }).then(res => res.data);
export const updateChannel = (id: number, name: string) => api.put(`${BASE_URL}channels/${id}/`, { name }).then(res => res.data);
export const deleteChannel = (id: number) => api.delete(`${BASE_URL}channels/${id}/`).then(res => res.data);

// ------------------------
// Sections APIs
// ------------------------
export const getSections = (channelId?: number) =>
  api.get<SalesSection[]>(`${BASE_URL}sections/`, { params: channelId ? { channel_id: channelId } : {} })
     .then(res => res.data);

export type SectionPayload = {
  name: string;
  channel_id: number;
  location?: number;
  building_no?: string;
  street_no?: string;
  zone_no?: string;
  place?: string;
  short_name?: string;
  logo?: File | string | null;
};

export const createSection = (section: SectionPayload) => {
  const formData = new FormData();
  Object.entries(section).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value as any);
  });
  return api.post(`${BASE_URL}sections/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(res => res.data);
};

export const updateSection = (id: number, section: SectionPayload) => {
  const formData = new FormData();
  Object.entries(section).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value as any);
  });
  return api.put(`${BASE_URL}sections/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(res => res.data);
};

export const deleteSection = (id: number) => api.delete(`${BASE_URL}sections/${id}/`).then(res => res.data);

// ------------------------
// Section Prices APIs
// ------------------------
export const getSectionPrices = (sectionId: number) =>
  api.get<SectionProductPrice[]>(`${BASE_URL}prices/`, { params: { section_id: sectionId } })
     .then(res => res.data);

export const bulkSetSectionPrices = (sections: number | number[], items: { product: number; price?: string | null }[]) =>
  api.post(`${BASE_URL}prices/bulk-set/`, { sections, items }).then(res => res.data);

// ------------------------
// Sales APIs
// ------------------------
export const getSale = (id: number) => api.get<Sale>(`${BASE_URL}sales/${id}/`).then(res => res.data);
export const getSales = () => api.get<Sale[]>(`${BASE_URL}sales/`).then(res => res.data);
export const createSale = (sale: Partial<Sale>) => api.post(`${BASE_URL}sales/`, sale).then(res => res.data);
export const updateSale = (id: number, sale: Partial<Sale>) => api.put(`${BASE_URL}sales/${id}/`, sale).then(res => res.data);
export const deleteSale = (id: number) => api.delete(`${BASE_URL}sales/${id}/`).then(res => res.data);

// ------------------------
// Sales Returns APIs
// ------------------------
export const getSalesReturns = (filters?: {
  sale?: number;
  invoice?: string;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
}) => api.get<SalesReturn[]>(`${BASE_URL}sales-returns/`, { params: filters }).then(res => res.data);

export const getSalesReturn = (id: number) => api.get<SalesReturn>(`${BASE_URL}sales-returns/${id}/`).then(res => res.data);
export const createSalesReturn = (data: { sale: number; customer?: number; refund_mode?: "cash"|"card"|"online"|"wallet"; items_write: SalesReturnItem[] }) =>
  api.post(`${BASE_URL}sales-returns/`, data).then(res => res.data);
export const updateSalesReturn = (id: number, data: Partial<SalesReturn>) =>
  api.put(`${BASE_URL}sales-returns/${id}/`, data).then(res => res.data);
export const deleteSalesReturn = (id: number) => api.delete(`${BASE_URL}sales-returns/${id}/`).then(res => res.data);

// ------------------------
// Sales Stats API
// ------------------------
export interface PeriodStats { total_amount: number; }
export interface SalesStats {
  sales_total: number;
  sales_after_return: number;
  sales_today: number;
  sales_today_after_return: number;
  sales_month: number;
  sales_month_after_return: number;
  sales_fy: number;
  sales_fy_after_return: number;
  sales_return_total: number;
  sales_return_today: number;
  sales_return_month: number;
  sales_return_fy: number;
  today?: PeriodStats;
  current_month?: PeriodStats;
  financial_year?: PeriodStats;
  month_totals: number[];
}

export const getSalesStats = () => api.get<SalesStats>(`${BASE_URL}sales-stats/`).then(res => res.data);