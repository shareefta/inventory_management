import { CONFIG } from 'src/config-global';

import SalesPage from 'src/sections/sales/sales-page';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Sales - ${CONFIG.appName}`}</title>

      <SalesPage />
    </>
  );
}
