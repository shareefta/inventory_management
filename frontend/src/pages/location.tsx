import { CONFIG } from 'src/config-global';

import { LocationView } from 'src/sections/location/view/location-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Location - ${CONFIG.appName}`}</title>

      <LocationView />
    </>
  );
}
