import { CheckCircle2, Printer, Receipt, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { STORE } from '../data/store';
import { formatRupiah } from '../utils/format';
import { getPaymentSummary } from '../utils/payment';

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default function PaymentReceiptModal({ order, onClose }) {
  if (!order) return null;

  const summary = getPaymentSummary(order);
  const receiptNumber = `KWT-${String(order.orderCode || order.id).replace(/[^A-Z0-9-]/gi, '')}`;
  const printedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=820,height=920');
    if (!win) {
      window.print();
      return;
    }

    const rowsHtml =
      summary.verifiedRecords.length > 0
        ? summary.verifiedRecords
            .map(
              (r, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${escapeHtml(r.date || (r.createdAt || '').slice(0, 10))}</td>
                <td>${escapeHtml(r.method)}${r.accountLabel ? ` (${escapeHtml(r.accountLabel)})` : ''}</td>
                <td>${escapeHtml(r.note || (summary.isTabung ? `Setoran Tabungan ke-${idx + 1}` : 'Pembayaran Tunai'))}</td>
                <td style="text-align:right;font-weight:700;">${escapeHtml(formatRupiah(r.amount))}</td>
              </tr>`,
            )
            .join('')
        : `<tr><td colspan="5" style="text-align:center;color:#777;padding:14px;">Belum ada pembayaran yang diverifikasi.</td></tr>`;

    win.document.write(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(summary.isPaidOff ? 'Bukti Pelunasan' : 'Kwitansi Pembayaran')} - ${escapeHtml(receiptNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #2b1d14; margin: 0; padding: 28px; background: #fff; }
    .sheet { max-width: 720px; margin: 0 auto; border: 2px solid #c9a227; border-radius: 14px; padding: 26px 28px; position: relative; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e7dec8; padding-bottom: 16px; gap: 16px; }
    .brand { font-size: 22px; font-weight: 800; color: #3d2415; margin: 0; }
    .sub { font-size: 12px; color: #6c584c; margin: 4px 0 0; line-height: 1.5; }
    .doc-title { text-align: right; }
    .doc-title h2 { margin: 0; font-size: 16px; letter-spacing: 0.08em; color: #6e3f22; text-transform: uppercase; }
    .doc-title p { margin: 4px 0 0; font-size: 12px; color: #6c584c; }
    .stamp { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.12em; }
    .stamp.lunas { border: 2px solid #15803d; color: #15803d; background: #dcfce7; }
    .stamp.proses { border: 2px solid #b45309; color: #92400e; background: #fef3c7; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0; font-size: 13px; background: #faf6ee; padding: 14px; border-radius: 10px; }
    .meta dt { font-size: 11px; text-transform: uppercase; color: #7c6758; font-weight: 700; }
    .meta dd { margin: 2px 0 8px; font-weight: 600; color: #2b1d14; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { background: #3d2415; color: #f6e7c1; text-align: left; padding: 9px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { border-bottom: 1px solid #eadfcd; padding: 9px 10px; }
    .totals { margin-top: 18px; margin-left: auto; width: 320px; font-size: 14px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { border-top: 2px solid #3d2415; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #3d2415; }
    .foot { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #6c584c; }
    .sig { text-align: center; min-width: 180px; }
    .sig-line { margin-top: 46px; border-top: 1px solid #3d2415; padding-top: 6px; font-weight: 700; color: #2b1d14; }
    @media print { body { padding: 0; } .sheet { border: 1.5px solid #c9a227; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <p class="brand">${escapeHtml(STORE.name)}</p>
        <p class="sub">${escapeHtml(STORE.address)}<br/>WhatsApp: ${escapeHtml(STORE.phoneDisplay)}</p>
      </div>
      <div class="doc-title">
        <h2>${summary.isPaidOff ? 'Bukti Pelunasan' : 'Kwitansi Pembayaran'}</h2>
        <p>No: <strong>${escapeHtml(receiptNumber)}</strong><br/>Tanggal cetak: ${escapeHtml(printedDate)}</p>
        <span class="stamp ${summary.isPaidOff ? 'lunas' : 'proses'}">
          ${summary.isPaidOff ? 'LUNAS' : escapeHtml(summary.statusLabel.toUpperCase())}
        </span>
      </div>
    </div>

    <div class="meta">
      <div>
        <dt>Pemesan</dt>
        <dd>${escapeHtml(order.name)}</dd>
        <dt>WhatsApp / Alamat</dt>
        <dd>${escapeHtml(order.phone || '-')} · ${escapeHtml(order.address)}</dd>
      </div>
      <div>
        <dt>Pesanan (${escapeHtml(order.orderCode || `#${order.id}`)})</dt>
        <dd>${escapeHtml(order.product)} (x${escapeHtml(order.quantity)})</dd>
        <dt>Metode Pembayaran</dt>
        <dd>${escapeHtml(order.payment)}</dd>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:36px;">No</th>
          <th style="width:105px;">Tanggal</th>
          <th style="width:165px;">Metode</th>
          <th>Keterangan</th>
          <th style="width:130px;text-align:right;">Nominal</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Total Tagihan</span><strong>${escapeHtml(formatRupiah(summary.bill))}</strong></div>
      <div class="row"><span>Total Terbayar (Terverifikasi)</span><strong style="color:#15803d;">${escapeHtml(formatRupiah(summary.paidAmount))}</strong></div>
      <div class="row grand"><span>Sisa Tagihan</span><span>${summary.isPaidOff ? 'Rp 0 (LUNAS)' : escapeHtml(formatRupiah(summary.remaining))}</span></div>
    </div>

    <div class="foot">
      <div>
        Kwitansi digital resmi ${escapeHtml(STORE.name)}.<br/>
        Simpan dokumen ini sebagai bukti pembayaran / pelunasan yang sah.
      </div>
      <div class="sig">
        <div>Owner ${escapeHtml(STORE.name)}</div>
        <div class="sig-line">${escapeHtml(STORE.owner)}</div>
      </div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <Modal
      title={summary.isPaidOff ? 'Bukti Pelunasan Resmi' : 'Kwitansi & Rincian Pembayaran'}
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Header Dokumen */}
        <div className="rounded-2xl border-2 border-gold/45 bg-gradient-to-br from-cream via-white to-sand/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
            <div>
              <p className="font-heading text-lg font-bold text-espresso">{STORE.name}</p>
              <p className="text-xs text-muted">{STORE.addressShort}</p>
              <p className="text-xs text-muted">WA: {STORE.phoneDisplay}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-espresso px-2.5 py-0.5 font-mono text-xs font-bold text-gold-light">
                <Receipt size={12} /> {receiptNumber}
              </span>
              <div className="mt-1.5">
                {summary.isPaidOff ? (
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-100 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 size={13} /> LUNAS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    {summary.statusLabel} ({summary.percent}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted">Pemesan</dt>
              <dd className="font-semibold text-espresso">{order.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Produk</dt>
              <dd className="font-semibold text-espresso">
                {order.product} (x{order.quantity})
              </dd>
            </div>
            <div>
              <dt className="text-muted">Sistem Pembayaran</dt>
              <dd className="font-semibold text-teak">{order.payment}</dd>
            </div>
            <div>
              <dt className="text-muted">Tanggal Cetak</dt>
              <dd className="font-semibold text-espresso">{printedDate}</dd>
            </div>
          </dl>
        </div>

        {/* Daftar Pembayaran Terverifikasi */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            Riwayat Pembayaran Terverifikasi ({summary.verifiedRecords.length})
          </p>
          {summary.verifiedRecords.length === 0 ? (
            <p className="rounded-xl border border-line bg-cream/60 p-4 text-center text-xs text-muted">
              Belum ada setoran yang terverifikasi oleh Owner.
            </p>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white text-xs">
              {summary.verifiedRecords.map((r, idx) => (
                <div key={r.id || idx} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-espresso">
                      #{idx + 1} · {r.method}
                      {r.accountLabel ? ` (${r.accountLabel})` : ''}
                    </p>
                    <p className="text-muted">
                      {r.date || (r.createdAt || '').slice(0, 10)}
                      {r.note ? ` · ${r.note}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-emerald-700">
                    {formatRupiah(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ringkasan Nominal */}
        <div className="space-y-1.5 rounded-xl bg-sand/70 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Total Tagihan</span>
            <span className="font-semibold text-espresso">{formatRupiah(summary.bill)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Total Sudah Dibayar</span>
            <span className="font-bold text-emerald-700">{formatRupiah(summary.paidAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-gold/30 pt-2 text-base font-bold text-espresso">
            <span>Sisa yang Harus Dibayar</span>
            <span className={summary.isPaidOff ? 'text-emerald-700' : 'text-teak'}>
              {summary.isPaidOff ? 'Rp 0 (LUNAS)' : formatRupiah(summary.remaining)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <ShieldCheck size={14} className="text-sage" /> Sah dikeluarkan oleh {STORE.name}
          </p>
          <button type="button" onClick={handlePrint} className="btn-primary !min-h-[42px] text-sm">
            <Printer size={16} className="text-gold-light" /> Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}