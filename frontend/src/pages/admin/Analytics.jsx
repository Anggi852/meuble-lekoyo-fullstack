import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  Database,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader, StatCard } from '../../components/admin/ui';
import { STREAMLIT_ENV_URL, SWAGGER_DOCS_URL } from '../../services/api';
import { INTENT_LABELS } from '../../services/koyoEngine';
import { formatRupiah } from '../../utils/format';

export default function Analytics() {
  const { analyticsSummary, refreshAnalytics, resetData } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setIframeFailed(false);
    await refreshAnalytics();
    setRefreshing(false);
  };

  const streamlitUrl = STREAMLIT_ENV_URL || analyticsSummary?.dsStatus?.streamlitUrl || '';
  const kpi = analyticsSummary?.kpi;
  const intents = analyticsSummary?.topIntents || [];
  const categories = analyticsSummary?.categoryBreakdown || [];
  const pay = analyticsSummary?.paymentPreference || { Tunai: 0, Tabung: 0 };
  const totalPay = Math.max(1, (pay.Tunai || 0) + (pay.Tabung || 0));
  const maxIntent = Math.max(1, ...intents.map((i) => i.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik Bisnis & Data Science"
        desc="Ringkasan indikator bisnis real-time dari database serta integrasi dasbor Streamlit tim Data Science."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={handleRefresh} disabled={refreshing} className="btn-soft !min-h-[42px] text-sm">
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Muat Ulang
            </button>
            <a href={SWAGGER_DOCS_URL} target="_blank" rel="noreferrer" className="btn-outline !min-h-[42px] text-sm">
              Swagger API <ExternalLink size={14} />
            </a>
          </div>
        }
      />

      {/* Ringkasan KPI Live dari Endpoint /api/v1/analytics/summary */}
      {kpi && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Wallet} value={formatRupiah(kpi.estimatedRevenue)} label="Omzet Tercatat" small accent />
          <StatCard icon={BarChart2} value={`${kpi.unitsSold} unit`} label="Total Unit Terjual" />
          <StatCard icon={MessageSquare} value={kpi.totalChats} label="Total Chat Koyo (DB)" />
          <StatCard icon={Database} value={analyticsSummary.databaseMode === 'postgresql' ? 'PostgreSQL' : 'JSON Disk'} label="Mode Penyimpanan" small />
        </div>
      )}

      {/* Visualisasi Hasil Analitik & Topik Pertanyaan Koyo */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="luxury-panel p-6">
          <span className="kicker">
            <Sparkles size={12} className="text-gold-dark" /> Analisis Intent Chat Koyo
          </span>
          <h2 className="font-heading mt-1 text-xl font-bold text-espresso">Topik paling sering ditanyakan</h2>
          {intents.length === 0 ? (
            <p className="mt-4 rounded-xl bg-cream p-4 text-sm text-muted">
              Belum ada riwayat percakapan Koyo di database. Coba kirim pesan di widget Koyo untuk melihat distribusinya.
            </p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {intents.slice(0, 6).map((item) => (
                <li key={item.intent}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-espresso">{INTENT_LABELS[item.intent] || item.intent}</span>
                    <span className="font-bold text-teak">{item.count} chat</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teak to-gold"
                      style={{ width: `${(item.count / maxIntent) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="luxury-panel p-6">
          <span className="kicker">Perilaku Pembeli</span>
          <h2 className="font-heading mt-1 text-xl font-bold text-espresso">Preferensi Pembayaran &amp; Kategori</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-cream/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Tunai / M-Banking</p>
              <p className="font-heading mt-1 text-2xl font-bold text-espresso">{pay.Tunai} pesanan</p>
              <p className="text-xs text-muted">{Math.round(((pay.Tunai || 0) / totalPay) * 100)}% dari pesanan</p>
            </div>
            <div className="rounded-2xl border border-gold/40 bg-sand/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-teak">Sistem Tabung</p>
              <p className="font-heading mt-1 text-2xl font-bold text-teak">{pay.Tabung} pesanan</p>
              <p className="text-xs text-muted">{Math.round(((pay.Tabung || 0) / totalPay) * 100)}% dari pesanan</p>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-5 space-y-2.5 border-t border-line/70 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">Minat per Kategori</p>
              {categories.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-bark">{cat.category}</span>
                  <span className="text-xs text-muted">
                    <strong className="text-espresso">{cat.views}</strong> dilihat · <strong className="text-teak">{cat.unitsSold}</strong> terjual
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Integrasi Dasbor Streamlit Tim Data Science */}
      <section className="luxury-panel overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="kicker">Integrasi Tim Data Science</span>
            <h2 className="font-heading mt-1 text-2xl font-bold text-espresso">Dasbor Interaktif Streamlit</h2>
            <p className="mt-1 text-sm text-muted">
              {analyticsSummary?.dsStatus?.message || 'Menampilkan analitik lanjutan dari tim Data Science.'}
            </p>
          </div>
          {streamlitUrl && (
            <a href={streamlitUrl} target="_blank" rel="noreferrer" className="btn-gold !min-h-[42px] text-sm">
              Buka Layar Penuh <ExternalLink size={15} />
            </a>
          )}
        </div>

        {streamlitUrl && !iframeFailed ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-gold/35 bg-sand">
            <iframe
              title="Dasbor Analitik Streamlit Meuble Le'Koyo"
              src={streamlitUrl.includes('?') ? `${streamlitUrl}&embed=true` : `${streamlitUrl}?embed=true`}
              className="h-[580px] w-full border-0"
              onError={() => setIframeFailed(true)}
            />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-gold/30 bg-cream/80 p-6 text-center">
            <AlertTriangle size={30} className="mx-auto text-gold-dark" />
            <p className="font-heading mt-3 text-lg font-bold text-espresso">
              {iframeFailed
                ? 'Dasbor Streamlit sedang tidak merespons'
                : 'URL Dasbor Streamlit belum dikonfigurasi'}
            </p>
            <p className="mx-auto mt-1.5 max-w-lg text-sm text-muted">
              {iframeFailed
                ? 'Layanan Streamlit free-tier mungkin sedang tertidur. Kamu tetap dapat memantau KPI live di atas atau membukanya di tab baru.'
                : 'Tambahkan VITE_STREAMLIT_URL di frontend/.env (atau STREAMLIT_DASHBOARD_URL di backend/.env) untuk menyematkan dasbor Streamlit tim Data Science secara langsung di sini.'}
            </p>
            {streamlitUrl && (
              <a href={streamlitUrl} target="_blank" rel="noreferrer" className="btn-primary mt-4 !min-h-[42px] text-sm">
                Buka Streamlit di Tab Baru <ExternalLink size={15} />
              </a>
            )}
          </div>
        )}
      </section>

      <div className="border-t border-line pt-6">
        <button
          onClick={() => {
            if (window.confirm('Kembalikan semua data di database (produk, FAQ, testimoni, pesanan, log) ke contoh awal? Perubahan Anda akan hilang.')) {
              resetData();
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-teak"
        >
          <RotateCcw size={15} /> Kembalikan semua data database ke contoh awal
        </button>
      </div>
    </div>
  );
}
