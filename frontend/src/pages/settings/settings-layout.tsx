import { Outlet } from 'react-router-dom';

import { DashboardContent } from 'src/layouts/dashboard';

export default function SettingsLayout() {
  return (
    <DashboardContent maxWidth="xl">
      {/* Common header or styling can go here */}
      <Outlet />
    </DashboardContent>
  );
}
