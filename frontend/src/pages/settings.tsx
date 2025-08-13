import { CONFIG } from 'src/config-global';

import { SettingsView } from 'src/sections/settings/view/settings-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Sales - ${CONFIG.appName}`}</title>

      <SettingsView />
    </>
  );
}
