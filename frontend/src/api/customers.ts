import axios from "axios";

export interface CustomerProps {
  id: number;
  name: string | null;
  mobile: string;
  wallet_balance: number;
  label: string;
}

const BASE_URL = "https://razaworld.uk/api/customers/customers_list/";

export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token");

  return { Authorization: `Bearer ${token}` };
}

/**
 * Fetch customers from backend.
 * @param search optional search term (name or mobile)
 * @param limit max results (default 50)
 */
export async function getCustomers(search = "", limit = 50): Promise<CustomerProps[]> {
  const response = await axios.get(BASE_URL, {
    headers: getAuthHeaders(),
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
