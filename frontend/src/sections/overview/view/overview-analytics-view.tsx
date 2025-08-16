import { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { getProducts } from 'src/api/products';
import { DashboardContent } from 'src/layouts/dashboard';
import { _posts, _tasks, _traffic, _timeline } from 'src/_mock';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
import { ProductSummaryCard } from '../analytics-widget-metrics';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [activeProductCount, setActiveProductCount] = useState<number>(0);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  const fetchProductStats = async () => {
    try {
      const products = await getProducts();

      // Active products
      const activeCount = products.filter((p) => p.active).length;
      setActiveProductCount(activeCount);

      // Total quantity across all locations
      const quantitySum = products.reduce((acc, p) => {
        const productTotalQty = p.locations.reduce((qAcc, loc) => qAcc + (loc.quantity || 0), 0);
        return acc + productTotalQty;
      }, 0);
      setTotalQuantity(quantitySum);

      // Total cost = sum of (rate * quantity at each location)
      const costSum = products.reduce((acc, p) => {
        const productCost = p.locations.reduce((cAcc, loc) => cAcc + (loc.quantity || 0) * (p.rate || 0), 0);
        return acc + productCost;
      }, 0);
      setTotalCost(costSum);

    } catch (error) {
      console.error("Failed to fetch product stats:", error);
    }
  };

  useEffect(() => {
    fetchProductStats();
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Monthly Deliveries"
            percent={2.6}
            total={500}
            icon={<img alt="Monthly Deliveries" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Today's Deliveries"
            percent={-0.1}
            total={50}
            color="secondary"
            icon={<img alt="Today's Deliveries" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={{
              categories: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              series: [56, 47, 40, 62, 73, 30, 23],
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
            icon={<img alt="Total Products" src="/assets/icons/glass/ic-glass-buy.svg" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Monthly Purchases"
            percent={3.6}
            total={234}
            color="error"
            icon={<img alt="Monthly Purchases" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [56, 30, 23, 54, 47, 40, 62, 73],
            }}
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
