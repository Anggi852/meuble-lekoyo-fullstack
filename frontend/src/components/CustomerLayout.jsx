import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import { useApp } from '../context/AppContext';

// Tampilan khusus pelanggan: progress bar gulir, navbar, transisi halaman halus, footer, dan Koyo
export default function CustomerLayout() {
  const { registerVisit } = useApp();
  const { pathname } = useLocation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 28, restDelta: 0.001 });

  // Hitung kunjungan sekali per sesi untuk ringkasan owner
  useEffect(() => {
    try {
      if (sessionStorage.getItem('lekoyo_visit_counted')) return;
      sessionStorage.setItem('lekoyo_visit_counted', '1');
    } catch { /* abaikan */ }
    registerVisit();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Garis progres baca emas-jati halus di paling atas layar */}
      <motion.div
        style={{ scaleX }}
        className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-wood via-gold to-teak"
        aria-hidden="true"
      />
      <Navbar />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
