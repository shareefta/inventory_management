import { CONFIG } from 'src/config-global';
import { ProductView } from 'src/sections/product/view';

import { PurchaseView } from 'src/sections/purchase/view/purchase-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Purchases - ${CONFIG.appName}`}</title>

      <PurchaseView />
    </>
  );
}
