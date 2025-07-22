import { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { getProducts } from 'src/api/products';
import { DashboardContent } from 'src/layouts/dashboard';
import { _posts, _tasks, _traffic, _timeline } from 'src/_mock';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';

// ----------------------------------------------------------------------

export function StaffOverviewAnalyticsView() {
  const [activeProductCount, setActiveProductCount] = useState<number>(0);

  const fetchProductCount = async () => {
      try {
        const products = await getProducts();
        const activeCount = products.filter((p) => p.active).length;
        setActiveProductCount(activeCount);

      } catch (error) {
        console.error('Failed to fetch product count:', error);
      }
    };
  
    useEffect(() => {
      fetchProductCount();
    }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome Staff 👋
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
          <AnalyticsWidgetSummary
            title="Total Products"
            percent={2.8}
            total={activeProductCount}
            color="warning"
            icon={<img alt="Total Products" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [40, 70, 50, 28, 70, 75, 7, 64],
            }}
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
      </Grid>
    </DashboardContent>
  );
}
