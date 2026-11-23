import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LogoMark } from '../components/Navbar';
import { extractApiError } from '../services/api';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { isLoggedIn, loginAdmin } = useApp();
  if (isLoggedIn) return <Navigate to="/admin" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Password owner wajib diisi.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      await loginAdmin(password.trim());
      toast.success('Selamat datang kembali, Pak Nanang!');
      navigate('/admin');
    } catch (err) {
      const msg = extractApiError(err, 'Gagal masuk. Periksa password atau koneksi backend.');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="luxury-dark relative flex min-h-[100dvh] safe-pt safe-pb flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-wood/20 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={52} />
          <span className="font-heading mt-3 text-3xl font-bold text-cream">Meuble Le'Koyo</span>
          <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.25em] text-gold-light">
            Portal Owner &amp; Admin
          </span>
        </div>

        <div className="luxury-panel mt-7 overflow-hidden p-8">
          <div className="gold-divider -mx-8 -mt-8 mb-7" aria-hidden="true" />
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold/40 bg-espresso text-gold-light shadow-gold">
            <Lock size={24} />
          </span>
          <h1 className="font-heading mt-5 text-center text-3xl font-bold text-espresso">Masuk Dashboard</h1>
          <p className="mt-2 text-center text-sm text-muted">
            Terhubung langsung ke REST API &amp; database persisten Meuble Le'Koyo.
          </p>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <div>
              <label htmlFor="pw" className="mb-1.5 block text-sm font-semibold text-espresso">Password Akses</label>
              <input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(''); }}
                className="field"
                placeholder="Masukkan password owner"
                autoFocus
                disabled={submitting}
              />
              {errorMsg && (
                <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">
                  {errorMsg}
                </p>
              )}
            </div>
            <button type="submit" disabled={submitting} className="btn-primary btn-shimmer w-full disabled:opacity-65">
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin text-gold-light" /> Memverifikasi...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} className="text-gold-light" /> Masuk ke Dashboard
                </>
              )}
            </button>
          </form>

          <p className="mt-5 rounded-xl bg-cream px-3 py-2 text-center text-xs font-medium text-muted">
            Password default: <strong className="text-teak">lekoyo2026</strong>
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-gold-light/85 transition hover:text-gold-light"
        >
          <ArrowLeft size={16} /> Kembali ke Website Galeri
        </Link>
      </div>
    </div>
  );
}
