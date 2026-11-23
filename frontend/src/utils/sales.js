// Kunci model custom: jenis + ukuran + opsi (finishing tidak dihitung), untuk mengenali rancangan yang sama.
export const customKey = (o) => (o.custom ? `${o.custom.title}|${o.custom.size}|${o.custom.options}` : null);

export const todayISO = () => new Date().toISOString().slice(0, 10);
