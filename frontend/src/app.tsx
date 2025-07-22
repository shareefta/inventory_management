import 'src/global.css';

import { useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { useAuthStore } from 'src/store/use-auth-store';

import { ThemeProvider } from 'src/theme/theme-provider';

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  
  useEffect(() => {
    document.title = 'AL ATA & RAZA WORLD';

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      useAuthStore.getState().setUser(JSON.parse(storedUser));
    }
  }, []);

  useScrollToTop();

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
