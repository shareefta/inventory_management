import { CONFIG } from 'src/config-global';

import { SalesView } from 'src/sections/sales/view/sales-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Sales - ${CONFIG.appName}`}</title>

      <SalesView />
    </>
  );
}
