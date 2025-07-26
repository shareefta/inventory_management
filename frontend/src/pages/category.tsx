import { CONFIG } from 'src/config-global';

import { CategoryView } from 'src/sections/category/view/category-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Category - ${CONFIG.appName}`}</title>

      <CategoryView />
    </>
  );
}
