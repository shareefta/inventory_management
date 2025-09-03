export interface PeriodStats {
  total_deliveries: number;
}

export interface DeliveryStats {
  deliveries_total: number;
  deliveries_after_return: number;
  deliveries_today: number;
  deliveries_today_after_return: number;
  deliveries_month: number;
  deliveries_month_after_return: number;
  deliveries_fy: number;
  deliveries_fy_after_return: number;
  deliveries_return_total: number;
  deliveries_return_today: number;
  deliveries_return_month: number;
  deliveries_return_fy: number;
  today?: PeriodStats;
  current_month?: PeriodStats;
  financial_year?: PeriodStats;
  month_totals: number[];
}