import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Wallet, ShoppingBag, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/format';
import { getPaymentSummary } from '../../utils/payment';

function resolveStatus(order) {
  const s = order?.status;
  const hasFinal = order?.finalPrice != null && Number(order.finalPrice) > 0;
  const hasPayments =
    Array.isArray(order?.paymentRecords) &&
    order.paymentRecords.some((r) => r.status === 'Terverifikasi' || r.status === 'Menunggu Verifikasi');

  if (s === 'Baru' || s === 'Menunggu Konfirmasi WA' || s === 'Menunggu Harga Owner') {
    return hasFinal || hasPayments || order?.priceAgreedAt
      ? 'Harga Ditetapkan'
      : 'Menunggu Harga Owner';
  }
  return s || 'Menunggu Harga Owner';
}

export default function NotificationBell({ onSelectItem, compact = false, dark = false }) {
  const { orders } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const notifications = useMemo(() => {
    const items = [];

    orders.forEach((order) => {
      const summary = getPaymentSummary(order);
      summary.pendingRecords.forEach((rec) => {
        const isFull = summary.remaining > 0 && Number(rec.amount) >= summary.remaining;
        const kindLabel = summary.isTabung
          ? isFull
            ? 'Pelunasan Sistem Tabung'
            : 'Setoran Cicilan Tabung'
          : 'Konfirmasi Pembayaran Tunai';

        items.push({
          id: `pay-${order.id}-${rec.id}`,
          type: 'payment',
          orderId: order.id,
          tab: 'payment',
          orderCode: order.orderCode || `#${order.id}`,
          title: `${order.name} · ${kindLabel}`,
          detail: `${formatRupiah(rec.amount)} via ${rec.method} — ${order.product}`,
          time: rec.createdAt || rec.date || order.createdAt,
        });
      });

      if (order.priceAdjustment?.status === 'rejected') {
        items.push({
          id: `adj-rej-${order.id}-${order.priceAdjustment.id || 0}`,
          type: 'adjustment',
          orderId: order.id,
          tab: 'detail',
          orderCode: order.orderCode || `#${order.id}`,
          title: `${order.name} · Menolak Penyesuaian Harga`,
          detail: `Usulan ${formatRupiah(order.priceAdjustment.proposedPrice)} ditolak — ${order.product}`,
          time: order.priceAdjustment.respondedAt || order.createdAt,
        });
      }

      if (resolveStatus(order) === 'Menunggu Harga Owner') {
        items.push({
          id: `ord-${order.id}`,
          type: 'order',
          orderId: order.id,
          tab: 'detail',
          orderCode: order.orderCode || `#${order.id}`,
          title: `${order.name} · Pesanan Baru`,
          detail: `Menunggu penetapan harga — ${order.product}`,
          time: order.createdAt,
        });
      }
    });

    return items.sort(
      (a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime(),
    );
  }, [orders]);

  const handleOpenItem = (item) => {
    setOpen(false);
    if (onSelectItem) {
      onSelectItem(item.orderId, item.tab);
      return;
    }
    navigate(`/admin/orders?orderId=${item.orderId}&tab=${item.tab}&t=${Date.now()}`);
  };

  const hasNotif = notifications.length > 0;

  const btnClass = dark
    ? hasNotif
      ? 'border-gold/60 bg-gold/20 text-gold-light hover:bg-gold/30'
      : 'border-white/15 bg-white/10 text-cream/85 hover:bg-white/20'
    : hasNotif
      ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-soft'
      : 'border-gold/30 bg-white text-bark hover:border-gold shadow-soft';

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi pembayaran dan pesanan"
        className={`relative inline-flex items-center justify-center gap-2 rounded-full border font-bold transition ${
          compact ? 'h-10 w-10 p-0' : 'h-9 px-3.5 text-xs'
        } ${btnClass}`}
      >
        <Bell
          size={compact ? 18 : 15}
          className={dark ? 'text-gold-light' : hasNotif ? 'text-amber-600' : 'text-gold-dark'}
        />
        {!compact && <span>Notifikasi</span>}
        {hasNotif && (
          <span
            className={`grid place-items-center rounded-full bg-red-600 font-extrabold text-white ${
              compact
                ? 'absolute -right-1 -top-1 h-5 min-w-[20px] px-1 text-[10px]'
                : 'h-5 min-w-[20px] px-1.5 text-[10.5px]'
            }`}
          >
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-2xl border border-gold/40 bg-white text-left shadow-2xl sm:w-[390px]">
          <div className="flex items-center justify-between border-b border-line bg-cream/80 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-espresso">
              Notifikasi Owner ({notifications.length})
            </p>
            <span className="text-[11px] text-muted">Klik untuk langsung buka</span>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 size={26} className="mx-auto text-emerald-600" />
              <p className="mt-2 text-xs font-semibold text-espresso">Semua sudah tertangani</p>
              <p className="mt-0.5 text-[11px] text-muted">
                Belum ada setoran tabungan atau pesanan baru yang menunggu konfirmasi.
              </p>
            </div>
          ) : (
            <div className="max-h-[360px] divide-y divide-line/80 overflow-y-auto">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenItem(item)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-sand/45"
                >
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                      item.type === 'payment'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.type === 'adjustment'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.type === 'payment' ? (
                      <Wallet size={15} />
                    ) : item.type === 'adjustment' ? (
                      <AlertTriangle size={15} />
                    ) : (
                      <ShoppingBag size={15} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-espresso px-1.5 py-0.5 font-mono text-[10px] font-bold text-gold-light">
                      {item.orderCode}
                    </span>
                    <p className="mt-1 truncate text-xs font-bold text-espresso">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">{item.detail}</p>
                  </div>
                  <ArrowRight size={14} className="mt-2 shrink-0 text-teak" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}