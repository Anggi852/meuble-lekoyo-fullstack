import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { products as seedProducts } from '../data/products';
import { getProductImages } from '../utils/image';
import { defaultFaqs, defaultTestimonials } from '../data/content';
import { defaultCustomPortfolio } from '../data/customPortfolio';
import {
  api,
  extractApiError,
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
} from '../services/api';

const AppContext = createContext();

function readWishlistStorage() {
  try {
    const raw = localStorage.getItem('lekoyo_wishlist');
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === 'object' ? Number(item?.id) : Number(item)))
      .filter((id) => Number.isFinite(id) && id > 0)
      .map((id) => ({ id }));
  } catch {
    return [];
  }
}

const toWishlistObjects = (ids) =>
  (Array.isArray(ids) ? ids : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0)
    .map((id) => ({ id }));

const upsert = (list, item) =>
  item.id && list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? { ...x, ...item } : x))
    : [{ ...item, id: item.id || Date.now() }, ...list];

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser());
  const [isLoggedIn, setLoggedInState] = useState(() => {
    const token = getStoredToken();
    const u = getStoredUser();
    return Boolean(token && (!u || u.role === 'owner'));
  });
  const [backendOnline, setBackendOnline] = useState(true);
  const [apiLoading, setApiLoading] = useState(true);

  const [products, setProducts] = useState(seedProducts);
  const [faqs, setFaqs] = useState(defaultFaqs);
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [customPortfolio, setCustomPortfolio] = useState(defaultCustomPortfolio);
  const [chatLogs, setChatLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [sales, setSales] = useState([]);
  const [views, setViews] = useState({});
  const [visits, setVisits] = useState(0);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);

  // Jika sudah login akun Google, tunggu sinkronisasi dari database agar tidak tercampur localStorage
  const [savedWishlist, setSavedWishlist] = useState(() =>
    getStoredUser()?.email ? [] : readWishlistStorage(),
  );

  // State global untuk membuka & mengirim prompt kontekstual ke Asisten Percakapan Koyo
  const [koyoOpen, setKoyoOpen] = useState(false);
  const [koyoPrompt, setKoyoPrompt] = useState(null);

  const openKoyoWith = useCallback((text = '', product = null) => {
    setKoyoOpen(true);
    if (text || product) {
      setKoyoPrompt({ id: Date.now(), text, product });
    }
  }, []);

  const clearKoyoPrompt = useCallback(() => setKoyoPrompt(null), []);

  // Muat data publik dari Backend API saat aplikasi dibuka
  const loadPublicData = useCallback(async () => {
    setApiLoading(true);
    try {
      const data = await api.bootstrap();
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.customPortfolio)) setCustomPortfolio(data.customPortfolio);
      if (Array.isArray(data.faqs)) setFaqs(data.faqs);
      if (Array.isArray(data.testimonials)) setTestimonials(data.testimonials);
      if (data.metrics) {
        setVisits(Number(data.metrics.visits) || 0);
        setViews(data.metrics.views || {});
      }
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Muat data terproteksi khusus Owner (orders, sales, chat logs, analytics)
  const loadAdminData = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const [ord, sls, cht, anl] = await Promise.all([
        api.getOrders(),
        api.getSales(),
        api.getChatLogs(),
        api.getAnalyticsSummary(),
      ]);
      setOrders(ord || []);
      setSales(sls || []);
      setChatLogs(cht || []);
      setAnalyticsSummary(anl || null);
      setBackendOnline(true);
    } catch (err) {
      if (err?.response?.status === 401) {
        setStoredToken('');
        setStoredUser(null);
        setUserState(null);
        setLoggedInState(false);
      }
    }
  }, []);

  // Muat riwayat pesanan milik akun yang sedang login Google
  const loadMyOrders = useCallback(async () => {
    if (!getStoredToken()) {
      setMyOrders([]);
      return [];
    }
    try {
      const list = await api.getMyOrders();
      setMyOrders(list || []);
      return list || [];
    } catch {
      return [];
    }
  }, []);

  // Muat Favorit milik akun dari Neon PostgreSQL
  const loadMyWishlist = useCallback(async () => {
    if (!getStoredToken()) {
      setSavedWishlist(readWishlistStorage());
      return [];
    }
    try {
      const ids = await api.getMyWishlist();
      setSavedWishlist(toWishlistObjects(ids));
      return ids || [];
    } catch {
      return [];
    }
  }, []);

  // Muat riwayat aktivitas akun
  const loadMyActivities = useCallback(async (limit = 50) => {
    if (!getStoredToken()) {
      setMyActivities([]);
      return [];
    }
    try {
      const list = await api.getMyActivities(limit);
      setMyActivities(list || []);
      return list || [];
    } catch {
      return [];
    }
  }, []);

  const recordActivity = useCallback(
    async (payload) => {
      if (!getStoredToken() || !user?.email) return null;
      try {
        const created = await api.recordActivity(payload);
        if (created) {
          setMyActivities((prev) => [created, ...prev].slice(0, 100));
        }
        return created;
      } catch {
        return null;
      }
    },
    [user?.email],
  );

  const refreshAnalytics = useCallback(async () => {
    if (!getStoredToken()) return null;
    try {
      const anl = await api.getAnalyticsSummary();
      setAnalyticsSummary(anl);
      setBackendOnline(true);
      return anl;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal memuat ringkasan analitik.'));
      return null;
    }
  }, []);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  // Sinkronkan sesi token, pesanan, favorit, dan aktivitas saat pertama kali buka aplikasi
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api
      .me()
      .then((me) => {
        setUserState(me);
        setStoredUser(me);
        setLoggedInState(me?.role === 'owner');
        if (me?.email) {
          loadMyOrders();
          loadMyWishlist();
          loadMyActivities();
        }
      })
      .catch(() => {
        setStoredToken('');
        setStoredUser(null);
        setUserState(null);
        setLoggedInState(false);
        setSavedWishlist(readWishlistStorage());
      });
  }, [loadMyOrders, loadMyWishlist, loadMyActivities]);

  // Sinkron otomatis antar tab/jendela browser saat kembali aktif
  useEffect(() => {
    if (!user?.email) return undefined;
    const syncAccountState = () => {
      if (document.visibilityState === 'visible') {
        loadMyWishlist();
        loadMyActivities();
      }
    };
    window.addEventListener('focus', syncAccountState);
    document.addEventListener('visibilitychange', syncAccountState);
    return () => {
      window.removeEventListener('focus', syncAccountState);
      document.removeEventListener('visibilitychange', syncAccountState);
    };
  }, [user?.email, loadMyWishlist, loadMyActivities]);

  useEffect(() => {
    if (isLoggedIn) loadAdminData();
  }, [isLoggedIn, loadAdminData]);

  const loginAdmin = async (password) => {
    const res = await api.login(password);
    const ownerUser = { role: 'owner', name: res.owner || 'Owner', email: '' };
    setStoredToken(res.token);
    setStoredUser(ownerUser);
    setUserState(ownerUser);
    setLoggedInState(true);
    setBackendOnline(true);
    return res;
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.loginGoogle(credential);
    setStoredToken(res.token);
    setStoredUser(res.user);
    setUserState(res.user);
    setLoggedInState(res.user?.role === 'owner');
    setBackendOnline(true);
    await Promise.all([loadMyOrders(), loadMyWishlist(), loadMyActivities()]);
    return res;
  };

  const logoutUser = () => {
    setStoredToken('');
    setStoredUser(null);
    setUserState(null);
    setLoggedInState(false);
    setMyOrders([]);
    setMyActivities([]);
    setSavedWishlist([]);
  };

  const logoutAdmin = logoutUser;

  // Kompatibilitas setter lama
  const setIsLoggedIn = (v) => {
    if (!v) logoutUser();
    else setLoggedInState(true);
  };

  // Hitung terjual per produk = catatan penjualan toko + pesanan online berstatus "Selesai"
  const soldMap = useMemo(() => {
    const m = {};
    const bump = (id, key, qty) => {
      if (id === null || id === undefined) return;
      m[id] = m[id] || { offline: 0, online: 0, total: 0 };
      m[id][key] += qty;
      m[id].total += qty;
    };
    sales.forEach((x) => bump(x.productId, 'offline', Number(x.quantity) || 0));
    orders.forEach((o) => {
      if (o.status === 'Selesai') bump(o.productId, 'online', Number(o.quantity) || 0);
    });
    return m;
  }, [sales, orders]);

  const soldOf = useCallback((id) => soldMap[id] || { offline: 0, online: 0, total: 0 }, [soldMap]);

  const salesTotals = useMemo(() => {
    const priceOf = (id) => products.find((p) => p.id === id)?.price || 0;
    const done = orders.filter((o) => o.status === 'Selesai');
    const num = (v) => Number(v) || 0;
    const onlineUnits = done.filter((o) => o.productId != null).reduce((a, o) => a + num(o.quantity), 0);
    const customUnits = done.filter((o) => o.custom).reduce((a, o) => a + num(o.quantity), 0);
    const offlineUnits = sales.reduce((a, x) => a + num(x.quantity), 0);
    const revenue =
      done.filter((o) => o.productId != null).reduce((a, o) => a + num(o.total), 0) +
      sales.reduce((a, x) => a + num(x.quantity) * priceOf(x.productId), 0);
    return { onlineUnits, customUnits, offlineUnits, units: onlineUnits + customUnits + offlineUnits, revenue };
  }, [orders, sales, products]);

  // Favorit: sinkron ke database Neon saat login Google, fallback localStorage hanya untuk tamu
  const wishlist = useMemo(
    () => savedWishlist.map((w) => products.find((p) => p.id === w.id)).filter(Boolean),
    [savedWishlist, products],
  );

  const toggleWishlist = async (product) => {
    const productId = Number(product?.id ?? product);
    if (!Number.isFinite(productId) || productId <= 0) return;

    // Jika sudah login akun Google -> simpan ke database agar sinkron lintas perangkat
    if (user?.email && getStoredToken()) {
      const previous = savedWishlist;
      const exists = previous.some((i) => i.id === productId);
      const optimistic = exists
        ? previous.filter((i) => i.id !== productId)
        : [{ id: productId }, ...previous];
      setSavedWishlist(optimistic);

      try {
        const res = await api.toggleWishlist(productId);
        if (Array.isArray(res?.wishlist)) {
          setSavedWishlist(toWishlistObjects(res.wishlist));
        }
        loadMyActivities();
      } catch (err) {
        setSavedWishlist(previous);
        toast.error(extractApiError(err, 'Gagal menyinkronkan Favorit ke akun.'));
      }
      return;
    }

    // Pengunjung tamu (belum login) -> simpan sementara di browser
    setSavedWishlist((prev) => {
      const next = prev.some((i) => i.id === productId)
        ? prev.filter((i) => i.id !== productId)
        : [{ id: productId }, ...prev];
      try {
        localStorage.setItem('lekoyo_wishlist', JSON.stringify(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
  };

  /* -------------------- CRUD PRODUK (AXIOS -> /api/v1/products) -------------------- */
  const saveProduct = async (p) => {
    const imgs = getProductImages(p);
    const payload = { ...p, images: imgs, image: imgs[0]?.url || p.image || '' };
    try {
      const saved = p.id ? await api.updateProduct(p.id, payload) : await api.createProduct(payload);
      setProducts((l) => upsert(l, saved));
      setBackendOnline(true);
      return saved;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menyimpan produk ke server.'));
      throw err;
    }
  };

  const removeProduct = async (id) => {
    try {
      await api.deleteProduct(id);
      setProducts((l) => l.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menghapus produk.'));
    }
  };

  const setStock = async (id, stockStatus) => {
    try {
      const updated = await api.updateProductStock(id, stockStatus);
      setProducts((l) => l.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal memperbarui status stok.'));
    }
  };

  /* -------------------- CRUD KARYA PERNAH DICUSTOM -------------------- */
  const saveCustomPortfolio = async (c) => {
    const imgs = getProductImages(c);
    const payload = { ...c, images: imgs, image: imgs[0]?.url || c.image || '' };
    try {
      const saved = c.id
        ? await api.updateCustomPortfolio(c.id, payload)
        : await api.createCustomPortfolio(payload);
      setCustomPortfolio((l) => upsert(l, saved));
      return saved;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menyimpan karya custom.'));
      throw err;
    }
  };

  const removeCustomPortfolio = async (id) => {
    try {
      await api.deleteCustomPortfolio(id);
      setCustomPortfolio((l) => l.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menghapus karya custom.'));
    }
  };

  /* -------------------- CRUD FAQ & TESTIMONI -------------------- */
  const saveFaq = async (f) => {
    try {
      const saved = f.id ? await api.updateFaq(f.id, f) : await api.createFaq(f);
      setFaqs((l) => upsert(l, saved));
      return saved;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menyimpan FAQ.'));
      throw err;
    }
  };

  const removeFaq = async (id) => {
    try {
      await api.deleteFaq(id);
      setFaqs((l) => l.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menghapus FAQ.'));
    }
  };

  const saveTestimonial = async (t) => {
    try {
      const saved = t.id ? await api.updateTestimonial(t.id, t) : await api.createTestimonial(t);
      setTestimonials((l) => upsert(l, saved));
      return saved;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menyimpan testimoni.'));
      throw err;
    }
  };

  const removeTestimonial = async (id) => {
    try {
      await api.deleteTestimonial(id);
      setTestimonials((l) => l.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menghapus testimoni.'));
    }
  };

  /* -------------------- PESANAN & PENJUALAN -------------------- */
  const addOrder = async (order) => {
    try {
      const created = await api.createOrder(order);
      setOrders((prev) => [created, ...prev]);
      if (user?.email) {
        setMyOrders((prev) => [created, ...prev]);
        loadMyActivities();
      }
      return created;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400 || status === 429) {
        toast.error(extractApiError(err, 'Pengajuan pesanan ditolak.'));
        throw err;
      }
      toast.error(extractApiError(err, 'Server sedang offline; pengajuan tetap dapat dilanjutkan ke WhatsApp.'));
      const fallback = {
        ...order,
        id: Date.now(),
        status: 'Menunggu Harga Owner',
        createdAt: new Date().toISOString(),
      };
      setOrders((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const updated = await api.updateOrder(id, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal memperbarui status pesanan.'));
    }
  };

  const updateOrder = async (id, patch) => {
    try {
      const updated = await api.updateOrder(id, patch);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal memperbarui pesanan.'));
    }
  };

  const removeOrder = async (id) => {
    try {
      await api.deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menghapus pesanan.'));
    }
  };

  const addSale = async ({ productId, quantity, date, note, markSold }) => {
    try {
      const created = await api.createSale({ productId, quantity, date, note, markSold });
      setSales((prev) => [created, ...prev]);
      if (markSold) {
        setProducts((l) => l.map((x) => (x.id === Number(productId) ? { ...x, stockStatus: 'Terjual' } : x)));
      }
      return created;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal mencatat penjualan.'));
      throw err;
    }
  };

  const removeSale = async (id) => {
    try {
      await api.deleteSale(id);
      setSales((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menghapus catatan penjualan.'));
    }
  };

  /* -------------------- GEN AI CHAT (MELALUI BACKEND) -------------------- */
  const sendKoyoMessage = async ({ message, activeProductId = null }) => {
    const res = await api.sendChat({ message, activeProductId });
    if (res?.log) {
      setChatLogs((prev) => [res.log, ...prev].slice(0, 200));
    }
    if (user?.email) loadMyActivities();
    setBackendOnline(true);
    return res;
  };

  const addChatLog = async (message, intent = 'lainnya') => {
    try {
      const res = await api.sendChat({ message, logOnly: true, intent });
      if (res?.log) setChatLogs((prev) => [res.log, ...prev].slice(0, 200));
      if (user?.email) loadMyActivities();
    } catch {
      /* abaikan bila offline */
    }
  };

  const clearChatLogs = async () => {
    try {
      await api.clearChatLogs();
      setChatLogs([]);
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal mengosongkan log chat.'));
    }
  };

  /* -------------------- METRIK & RESET -------------------- */
  const trackView = async (id) => {
    try {
      const m = await api.recordView(id);
      if (m?.views) setViews(m.views);
    } catch {
      setViews((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }
  };

  const registerVisit = async () => {
    try {
      const m = await api.recordVisit();
      if (typeof m?.visits === 'number') setVisits(m.visits);
    } catch {
      setVisits((n) => n + 1);
    }
  };

  const resetData = async () => {
    try {
      await api.resetAll();
      await Promise.all([loadPublicData(), loadAdminData(), loadMyWishlist(), loadMyActivities()]);
      toast.success('Semua data di database berhasil dikembalikan ke contoh awal.');
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal mereset data.'));
    }
  };

  const value = {
    user,
    isOwner: isLoggedIn,
    isLoggedIn,
    setIsLoggedIn,
    loginAdmin,
    loginWithGoogle,
    logoutAdmin,
    logoutUser,
    backendOnline,
    apiLoading,
    products,
    saveProduct,
    removeProduct,
    faqs,
    saveFaq,
    removeFaq,
    testimonials,
    saveTestimonial,
    removeTestimonial,
    customPortfolio,
    saveCustomPortfolio,
    removeCustomPortfolio,
    chatLogs,
    addChatLog,
    sendKoyoMessage,
    clearChatLogs,
    orders,
    myOrders,
    loadMyOrders,
    myActivities,
    loadMyActivities,
    recordActivity,
    addOrder,
    updateOrderStatus,
    updateOrder,
    removeOrder,
    sales,
    addSale,
    removeSale,
    setStock,
    soldOf,
    salesTotals,
    views,
    trackView,
    visits,
    registerVisit,
    analyticsSummary,
    refreshAnalytics,
    wishlist,
    loadMyWishlist,
    toggleWishlist,
    resetData,
    koyoOpen,
    setKoyoOpen,
    koyoPrompt,
    openKoyoWith,
    clearKoyoPrompt,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);