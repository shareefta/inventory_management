import api from "src/utils/api";

// Wallet transaction type
export interface WalletTransaction {
  id: number;
  tx_type: "CREDIT" | "DEBIT";
  amount: number;
  note: string;
  created_at: string;
}

export interface CustomerProps {
  id: number;
  name: string | null;
  mobile: string;
  wallet_balance: number;
  label: string;
  recent_transactions?: WalletTransaction[];
}

const BASE_URL = "/api/customers/customers_list/";
const WALLET_URL = "/api/customers";

/**
 * Fetch customers from backend.
 * @param search optional search term (name or mobile)
 * @param limit max results (default 50)
 */
export async function getCustomers(search = "", limit = 50): Promise<CustomerProps[]> {
  const response = await api.get(BASE_URL, {
    params: { search, limit },
  });

  return response.data.map((item: any) => ({
    id: item.id,
    name: item.name,
    mobile: item.mobile,
    wallet_balance: Number(item.wallet_balance),
    label: item.label || (item.name ? `${item.name} (${item.mobile})` : item.mobile),
    recent_transactions: item.recent_transactions?.map((tx: any) => ({
      id: tx.id,
      tx_type: tx.tx_type,
      amount: Number(tx.amount),
      note: tx.note,
      created_at: tx.created_at,
    })) || [],
  }));
}

/**
 * Get a customer's wallet balance only.
 * @param customerId customer ID
 */
export async function getWalletBalance(customerId: number): Promise<number> {
  const response = await api.get(`${WALLET_URL}/${customerId}/wallet/balance/`);
  return Number(response.data.wallet_balance);
}

/**
 * Credit a customer's wallet.
 * @param customerId customer ID
 * @param amount amount to credit
 * @param note optional note
 */
export async function creditWallet(customerId: number, amount: number, note = "") {
  const response = await api.post(`${WALLET_URL}/${customerId}/wallet/credit/`, {
    amount,
    note,
  });
  return response.data;
}

/**
 * Debit a customer's wallet.
 * @param customerId customer ID
 * @param amount amount to debit
 * @param note optional note
 */
export async function debitWallet(customerId: number, amount: number, note = "") {
  const response = await api.post(`${WALLET_URL}/${customerId}/wallet/debit/`, {
    amount,
    note,
  });
  return response.data;
}