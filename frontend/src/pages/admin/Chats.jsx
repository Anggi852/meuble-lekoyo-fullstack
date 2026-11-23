import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader, confirmDelete } from '../../components/admin/ui';
import { INTENT_LABELS } from '../../services/koyoEngine';

export default function Chats() {
  const { chatLogs, clearChatLogs } = useApp();

  const intentSummary = useMemo(() => {
    const counts = {};
    chatLogs.forEach((log) => {
      const key = log.intent || 'lainnya';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [chatLogs]);

  return (
    <div>
      <PageHeader
        title="Log chat & topik pelanggan"
        desc="Pertanyaan yang diajukan pelanggan lewat percakapan bersama Koyo, lengkap dengan deteksi topik (intent)."
        action={
          chatLogs.length > 0 && (
            <button onClick={() => confirmDelete('semua log chat', clearChatLogs)} className="btn-outline">
              <Trash2 size={17} /> Kosongkan log
            </button>
          )
        }
      />

      {intentSummary.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {intentSummary.map(([intent, count]) => (
            <span
              key={intent}
              className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-bark shadow-soft"
            >
              {INTENT_LABELS[intent] || intent}: <strong className="text-teak">{count}</strong>
            </span>
          ))}
        </div>
      )}

      {chatLogs.length === 0 ? (
        <p className="luxury-panel p-10 text-center text-muted">Belum ada pertanyaan masuk.</p>
      ) : (
        <div className="space-y-3">
          {chatLogs.map((log) => (
            <div key={log.id} className="luxury-panel flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-wood">{log.user}</p>
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-teak">
                    {INTENT_LABELS[log.intent] || 'Lainnya'}
                  </span>
                </div>
                <p className="mt-1 text-bark">{log.message}</p>
              </div>
              <span className="shrink-0 text-sm text-muted">{log.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
