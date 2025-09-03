import api from "src/utils/api";

export interface CustomerProps {
  id: number;
  name: string | null;
  mobile: string;
  wallet_balance: number;
  label: string;
}

const BASE_URL = "/api/customers/customers_list/";

/**
 * Fetch customers from backend.
 * @param search optional search term (name or mobile)
 * @param limit max results (default 50)
 */
export async function getCustomers(search = "", limit = 50): Promise<CustomerProps[]> {
  const response = await api.get(BASE_URL, {
    params: { search, limit },
  });

  // Map backend data to frontend props
  return response.data.map((item: any) => ({
    id: item.id,
    name: item.name,
    mobile: item.mobile,
    wallet_balance: Number(item.wallet_balance),
    label: item.label || (item.name ? `${item.name} (${item.mobile})` : item.mobile),
  }));
}