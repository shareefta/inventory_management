import { Outlet } from 'react-router-dom';

import { DashboardContent } from 'src/layouts/dashboard';

export default function SalesLayout() {
  return (
    <DashboardContent maxWidth="xl">
      <Outlet />
    </DashboardContent>
  );
}
