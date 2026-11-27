import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { products as seedProducts } from '../data/products';
import { getProductImages } from '../utils/image';
import { DEFAULT_PAYMENT_SETTINGS } from '../utils/payment';
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
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [chatLogs, setChatLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [sales, setSales] = useState([]);
  const [views, setViews] = useState({});
  const [visits, setVisits] = useState(0);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);

  const [savedWishlist, setSavedWishlist] = useState(() =>
    getStoredUser()?.email ? [] : readWishlistStorage(),
  );

  const [koyoOpen, setKoyoOpen] = useState(false);
  const [koyoPrompt, setKoyoPrompt] = useState(null);
  const knownPendingPayIds = useRef(null);

  const openKoyoWith = useCallback((text = '', product = null) => {
    setKoyoOpen(true);
    if (text || product) {
      setKoyoPrompt({ id: Date.now(), text, product });
    }
  }, []);

  const clearKoyoPrompt = useCallback(() => setKoyoPrompt(null), []);

  const loadPublicData = useCallback(async () => {
    setApiLoading(true);
    try {
      const data = await api.bootstrap();
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.customPortfolio)) setCustomPortfolio(data.customPortfolio);
      if (Array.isArray(data.faqs)) setFaqs(data.faqs);
      if (Array.isArray(data.testimonials)) setTestimonials(data.testimonials);
      if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
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

  const loadAdminData = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const [ord, sls, cht, anl] = await Promise.all([
        api.getOrders(),
        api.getSales(),
        api.getChatLogs(),
        api.getAnalyticsSummary(),
      ]);
      const nextOrders = ord || [];

      // Deteksi bukti pembayaran / setoran cicilan baru secara otomatis
      const currentPendingKeys = new Set();
      const newlyArrived = [];
      nextOrders.forEach((o) => {
        const recs = Array.isArray(o.paymentRecords) ? o.paymentRecords : [];
        recs.forEach((r) => {
          if (r.status === 'Menunggu Verifikasi') {
            const key = `${o.id}:${r.id}`;
            currentPendingKeys.add(key);
            if (knownPendingPayIds.current && !knownPendingPayIds.current.has(key)) {
              newlyArrived.push({ order: o, record: r });
            }
          }
        });
      });

      if (knownPendingPayIds.current && newlyArrived.length > 0) {
        const first = newlyArrived[0];
        const nominal = Number(first.record.amount || 0).toLocaleString('id-ID');
        toast.info(
          `Konfirmasi pembayaran baru dari ${first.order.name} (Rp ${nominal}) — ${first.order.orderCode || `#${first.order.id}`}`,
        );
      }
      knownPendingPayIds.current = currentPendingKeys;

      setOrders(nextOrders);
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

  useEffect(() => {
    const syncOnFocus = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return;
      if (isLoggedIn) {
        loadAdminData();
      } else if (user?.email) {
        loadMyOrders();
        loadMyWishlist();
        loadMyActivities();
      }
    };
    window.addEventListener('focus', syncOnFocus);
    document.addEventListener('visibilitychange', syncOnFocus);
    return () => {
      window.removeEventListener('focus', syncOnFocus);
      document.removeEventListener('visibilitychange', syncOnFocus);
    };
  }, [isLoggedIn, user?.email, loadAdminData, loadMyOrders, loadMyWishlist, loadMyActivities]);

  // Polling ringan tiap 20 detik saat Owner login agar notifikasi cicilan / pembayaran langsung masuk
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    loadAdminData();
    loadPublicData();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAdminData();
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [isLoggedIn, loadAdminData, loadPublicData]);

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
    knownPendingPayIds.current = null;
  };

  const logoutAdmin = logoutUser;

  const setIsLoggedIn = (v) => {
    if (!v) logoutUser();
    else setLoggedInState(true);
  };

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

  const wishlist = useMemo(
    () => savedWishlist.map((w) => products.find((p) => p.id === w.id)).filter(Boolean),
    [savedWishlist, products],
  );

  const toggleWishlist = async (product) => {
    const productId = Number(product?.id ?? product);
    if (!Number.isFinite(productId) || productId <= 0) return;

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

  /* -------------------- PENGATURAN PEMBAYARAN (REKENING & QRIS) -------------------- */
  const savePaymentSettings = async (payload) => {
    try {
      const saved = await api.updatePaymentSettings(payload);
      setPaymentSettings(saved);
      return saved;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menyimpan pengaturan rekening & pembayaran.'));
      throw err;
    }
  };

  /* -------------------- CRUD PRODUK -------------------- */
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
      setOrders((prev) =>
        prev.map((o) =>
          Number(o.publishedPortfolioId) === Number(id) ? { ...o, publishedPortfolioId: null } : o,
        ),
      );
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menghapus karya custom.'));
    }
  };

  const publishCustomOrder = async (order, portfolioData) => {
    const existing =
      customPortfolio.find((c) => Number(c.id) === Number(order.publishedPortfolioId)) ||
      customPortfolio.find((c) => Number(c.orderId) === Number(order.id));

    const payload = {
      ...(existing ? { id: existing.id } : {}),
      ...portfolioData,
      orderId: order.id,
      orderCode: order.orderCode || '',
      isPublished: portfolioData.isPublished !== false,
    };

    const saved = await saveCustomPortfolio(payload);
    await updateOrder(order.id, {
      finishedPhotos: saved.images,
      publishedPortfolioId: saved.id,
    });
    return saved;
  };

  const togglePortfolioPublish = async (item, nextPublished) => {
    return saveCustomPortfolio({
      ...item,
      isPublished: Boolean(nextPublished),
    });
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

  const submitOrderReview = async (payload) => {
    try {
      const saved = await api.submitOrderReview(payload);
      setTestimonials((l) => upsert(l, saved));
      if (user?.email) loadMyActivities();
      return saved;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal mengirim ulasan.'));
      throw err;
    }
  };

  /* -------------------- PESANAN, KESEPAKATAN HARGA & PEMBAYARAN -------------------- */
  const syncUpdatedOrder = (orderId, updated) => {
    const idNum = Number(orderId);
    setOrders((prev) => prev.map((o) => (Number(o.id) === idNum ? updated : o)));
    setMyOrders((prev) => prev.map((o) => (Number(o.id) === idNum ? updated : o)));
  };

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
        paymentRecords: [],
        createdAt: new Date().toISOString(),
      };
      setOrders((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const updated = await api.updateOrder(id, { status });
      syncUpdatedOrder(id, updated);
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal memperbarui status pesanan.'));
      throw err;
    }
  };

  const updateOrder = async (id, patch) => {
    try {
      const updated = await api.updateOrder(id, patch);
      syncUpdatedOrder(id, updated);
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal memperbarui pesanan.'));
      throw err;
    }
  };

  const agreeOrderPrice = async (orderId) => {
    try {
      const updated = await api.agreeOrderPrice(orderId);
      syncUpdatedOrder(orderId, updated);
      if (user?.email && !isLoggedIn) loadMyActivities();
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menyetujui harga final.'));
      throw err;
    }
  };

  const proposePriceAdjustment = async (orderId, payload) => {
    try {
      const updated = await api.proposePriceAdjustment(orderId, payload);
      syncUpdatedOrder(orderId, updated);
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal mengajukan penyesuaian harga.'));
      throw err;
    }
  };

  const cancelPriceAdjustment = async (orderId) => {
    try {
      const updated = await api.cancelPriceAdjustment(orderId);
      syncUpdatedOrder(orderId, updated);
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal membatalkan pengajuan penyesuaian harga.'));
      throw err;
    }
  };

  const respondPriceAdjustment = async (orderId, payload) => {
    try {
      const updated = await api.respondPriceAdjustment(orderId, payload);
      syncUpdatedOrder(orderId, updated);
      if (user?.email && !isLoggedIn) loadMyActivities();
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal mengirim tanggapan penyesuaian harga.'));
      throw err;
    }
  };

  const submitOrderPayment = async (orderId, payload) => {
    try {
      const updated = await api.addOrderPayment(orderId, payload);
      syncUpdatedOrder(orderId, updated);
      if (user?.email && !isLoggedIn) loadMyActivities();
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal mengirim data pembayaran.'));
      throw err;
    }
  };

  const verifyOrderPayment = async (orderId, paymentId, payload) => {
    try {
      const updated = await api.verifyOrderPayment(orderId, paymentId, payload);
      syncUpdatedOrder(orderId, updated);
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal memperbarui status verifikasi pembayaran.'));
      throw err;
    }
  };

  const deleteOrderPayment = async (orderId, paymentId) => {
    try {
      const updated = await api.deleteOrderPayment(orderId, paymentId);
      syncUpdatedOrder(orderId, updated);
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Gagal menghapus catatan pembayaran.'));
      throw err;
    }
  };

  const removeOrder = async (id) => {
    try {
      await api.deleteOrder(id);
      setOrders((prev) => prev.filter((o) => Number(o.id) !== Number(id)));
      setMyOrders((prev) => prev.filter((o) => Number(o.id) !== Number(id)));
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

  /* -------------------- GEN AI CHAT -------------------- */
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
    submitOrderReview,
    customPortfolio,
    saveCustomPortfolio,
    removeCustomPortfolio,
    publishCustomOrder,
    togglePortfolioPublish,
    paymentSettings,
    savePaymentSettings,
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
    agreeOrderPrice,
    proposePriceAdjustment,
    cancelPriceAdjustment,
    respondPriceAdjustment,
    submitOrderPayment,
    verifyOrderPayment,
    deleteOrderPayment,
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