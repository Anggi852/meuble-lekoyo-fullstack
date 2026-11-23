import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Kembali ke atas halaman saat berpindah route
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}
