import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  Crown,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  KeyRound,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { LogoMark } from '../components/Navbar';
import { extractApiError } from '../services/api';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const { user, isOwner, loginAdmin, loginWithGoogle, logoutUser } = useApp();

  if (isOwner) return <Navigate to="/admin" replace />;

  const handleGoogleOwnerLogin = async (credentialResponse) => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      if (res?.user?.role !== 'owner') {
        logoutUser();
        const msg =
          'Email Google ini terdaftar sebagai akun Pelanggan, bukan Owner. Silakan masuk melalui halaman Beranda.';
        setErrorMsg(msg);
        toast.error('Akses ditolak: bukan akun Owner.');
        return;
      }
      toast.success(`Selamat datang di Ruang Kendali Owner, ${res.user.name}!`);
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = extractApiError(err, 'Verifikasi akun Google Owner gagal.');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmergencyPasswordLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Kode akses owner wajib diisi.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      await loginAdmin(password.trim());
      toast.success('Selamat datang di Ruang Kendali Owner!');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = extractApiError(err, 'Kode akses salah atau server tidak merespons.');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Jika akun Pelanggan yang sedang login mencoba membuka /admin/login secara manual
  if (user && !isOwner) {
    return (
      <div className="luxury-dark relative flex min-h-[100dvh] safe-pt safe-pb flex-col items-center justify-center overflow-hidden px-4 py-12">
        <div className="relative w-full max-w-md">
          <div className="luxury-panel overflow-hidden p-8 text-center">
            <div className="gold-divider -mx-8 -mt-8 mb-7" aria-hidden="true" />
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
              <ShieldAlert size={26} />
            </span>
            <h1 className="font-heading mt-5 text-2xl font-bold text-espresso">
              Area Khusus Owner
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Anda sedang masuk sebagai akun pelanggan{' '}
              <strong className="text-espresso">{user.email || user.name}</strong>. Halaman ini hanya dapat diakses oleh pengelola Meuble Le'Koyo.
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              <Link to="/" className="btn-primary w-full justify-center">
                <ArrowLeft size={16} /> Kembali ke Website Galeri
              </Link>
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  toast.info('Akun dikeluarkan. Silakan masuk dengan akun Owner.');
                }}
                className="btn-soft w-full justify-center text-sm"
              >
                <LogOut size={15} /> Ganti ke Akun Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="luxury-dark relative flex min-h-[100dvh] safe-pt safe-pb flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-gold/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-wood/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={54} />
          <span className="font-heading mt-3 text-3xl font-bold text-cream">Meuble Le'Koyo</span>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-light">
            <Crown size={12} /> Ruang Kendali Eksklusif Owner
          </span>
        </div>

        <div className="luxury-panel mt-7 overflow-hidden p-8">
          <div className="gold-divider -mx-8 -mt-8 mb-7" aria-hidden="true" />
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold/50 bg-espresso text-gold-light shadow-gold">
            <Crown size={24} />
          </span>
          <h1 className="font-heading mt-5 text-center text-2xl font-bold text-espresso sm:text-3xl">
            Verifikasi Owner
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Masuk menggunakan akun Google yang terdaftar resmi sebagai pengelola Meuble Le'Koyo.
          </p>

          {/* Login Utama: Google OAuth Khusus Owner */}
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-gold/30 bg-sand/50 p-5">
            {submitting ? (
              <div className="flex items-center gap-2 py-2 text-sm font-semibold text-espresso">
                <Loader2 size={18} className="animate-spin text-gold-dark" /> Memverifikasi otorisasi Owner...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleOwnerLogin}
                onError={() => toast.error('Verifikasi Google dibatalkan atau gagal.')}
                useOneTap={false}
                shape="pill"
                size="large"
                text="signin_with"
                locale="id"
              />
            )}
            <p className="mt-3 text-center text-[11px] text-muted">
              Hanya email yang terdaftar pada daftar otorisasi Owner yang diizinkan masuk.
            </p>
          </div>

          {errorMsg && (
            <p
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700"
              role="alert"
            >
              {errorMsg}
            </p>
          )}

          {/* Opsi Cadangan Tersembunyi (tanpa membocorkan password) */}
          <div className="mt-5 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEmergencyForm((v) => !v);
                setErrorMsg('');
              }}
              className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-muted transition hover:text-espresso"
            >
              <KeyRound size={13} />
              Masuk dengan Kode Akses Darurat
              {showEmergencyForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showEmergencyForm && (
              <form onSubmit={handleEmergencyPasswordLogin} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="pw" className="mb-1.5 block text-xs font-semibold text-espresso">
                    Kode Akses Owner
                  </label>
                  <input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="field"
                    placeholder="Masukkan kode akses"
                    disabled={submitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary btn-shimmer w-full disabled:opacity-65"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-gold-light" /> Memverifikasi...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-gold-light" /> Buka Dashboard Owner
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <Linkfoot
          to="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-gold-light/85 transition hover:text-gold-light"
        >
          <ArrowLeft size={16} /> Kembali ke Website Galeri
        </Linkfoot>
      </div>
    </div>
  );
}