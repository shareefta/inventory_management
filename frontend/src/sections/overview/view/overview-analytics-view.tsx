import { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { DeliveryStats } from 'src/api/delivery';
import { DashboardContent } from 'src/layouts/dashboard';
import { getSalesStats, SalesStats } from 'src/api/sales';
import { _posts, _tasks, _traffic, _timeline } from 'src/_mock';
import { getProductStats, getPurchaseStats, PurchaseStats } from 'src/api/products';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
import { ProductSummaryCard } from '../analytics-widget-metrics';
import { AnalyticsWidgetSales } from '../analytics-widget-sales';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsWidgetDelivery } from '../analytics-widget-delivery';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';
import { AnalyticsWidgetPurchases } from '../analytics-widget-purchases';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [activeProductCount, setActiveProductCount] = useState<number>(0);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [purchaseStats, setPurchaseStats] = useState<PurchaseStats | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);

  const fetchProductStats = async () => {
    try {
      const stats = await getProductStats();
      setActiveProductCount(stats.active_count);
      setTotalQuantity(stats.total_quantity);
      setTotalCost(stats.total_cost);
    } catch (error) {
      console.error("Failed to fetch product stats:", error);
    }
  };

  useEffect(() => {
    fetchProductStats();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getPurchaseStats();
      setPurchaseStats(stats);
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchSalesStats = async () => {
      const stats = await getSalesStats();
      setSalesStats(stats);
    };
    fetchSalesStats();
  }, []);

  if (!purchaseStats || !salesStats) return null;

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetPurchases
            title="Total Purchases"
            todayTotal={purchaseStats.today?.total_amount || 0}
            yearTotal={purchaseStats.financial_year?.total_amount || 0}
            color="secondary"
            icon={<img alt="Purchases" src="/assets/icons/glass/purchase.png" />}
            chart={{
            categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
            series: purchaseStats.month_totals,
          }}
          />
        </Grid>        

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSales
            title="Total Sales"
            todaySales={salesStats.today?.total_amount || 0}
            yearSales={salesStats.financial_year?.total_amount || 0}
            color="error"
            icon={<img alt="Sales" src="/assets/icons/glass/sales.png" />}
            chart={{
              categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
              series: salesStats.month_totals,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetDelivery
            title="Total Deliveries"
            todayDelivery={deliveryStats?.today?.total_deliveries || 0}
            yearDelivery={deliveryStats?.financial_year?.total_deliveries || 0}
            color="success"
            icon={<img alt="Total Deliveries" src="/assets/icons/glass/delivery.png" />}
            chart={{
              categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
              series: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ProductSummaryCard
            title="Total Products"
            total_products={activeProductCount}
            total_stock={totalQuantity}
            stock_value={totalCost}
            color="warning"
            icon={<img alt="Total Products" src="/assets/icons/glass/stock.png" />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentVisits
            title="Total Deliveries"
            chart={{
              series: [
                { label: 'Snoonu', value: 6500 },
                { label: 'Rafeeq', value: 4500 },
                { label: 'Talabat - Al Ata', value: 1500 },
                { label: 'Al Ata Shoppy', value: 2500 },
              ],
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentVisits
            title="Deliveries - Snoonu"
            chart={{
              series: [
                { label: 'Info Arab', value: 6500 },
                { label: 'Al Ata Shoppy', value: 8500 },
                { label: 'Al Ata Kids', value: 4000 },
                { label: 'Alwab', value: 5500 },
              ],
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentVisits
            title="Deliveries - Rafeeq"
            chart={{
              series: [
                { label: 'Rafeeq - Al Ata', value: 4500 },
                { label: 'Rafeeq - info Arab', value: 3500 },
              ],
            }}
          />
        </Grid>

        {/* <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsWebsiteVisits
            title="Website visits"
            subheader="(+43%) than last year"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              series: [
                { name: 'Team A', data: [43, 33, 22, 37, 67, 68, 37, 24, 55] },
                { name: 'Team B', data: [51, 70, 47, 67, 40, 37, 24, 70, 24] },
              ],
            }}
          />
        </Grid> */}

        {/* <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsConversionRates
            title="Conversion rates"
            subheader="(+43%) than last year"
            chart={{
              categories: ['Italy', 'Japan', 'China', 'Canada', 'France'],
              series: [
                { name: '2022', data: [44, 55, 41, 64, 22] },
                { name: '2023', data: [53, 32, 33, 52, 13] },
              ],
            }}
          />
        </Grid> */}

        {/* <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentSubject
            title="Trending Products"
            chart={{
              categories: ['Whoop', 'Mobiles', 'Gaming Accessories', 'Toys', 'Perfumes', 'Mobile Accessories'],
              series: [
                { name: 'Series 1', data: [80, 50, 30, 40, 100, 20] },
                { name: 'Series 2', data: [20, 30, 40, 80, 20, 80] },
                { name: 'Series 3', data: [44, 76, 78, 13, 43, 10] },
              ],
            }}
          />
        </Grid> */}

        {/* <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsNews title="News" list={_posts.slice(0, 5)} />
        </Grid> */}

        {/* <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsOrderTimeline title="Order timeline" list={_timeline} />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsTrafficBySite title="Traffic by site" list={_traffic} />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsTasks title="Tasks" list={_tasks} />
        </Grid> */}
      </Grid>
    </DashboardContent>
  );
}
