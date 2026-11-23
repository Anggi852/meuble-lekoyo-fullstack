import { Routes, Route, Navigate } from 'react-router-dom'
import CustomerLayout from './components/CustomerLayout'
import AdminLayout from './components/admin/AdminLayout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Wishlist from './pages/Wishlist'
import Custom from './pages/Custom'
import AdminLogin from './pages/AdminLogin'
import Overview from './pages/admin/Overview'
import Orders from './pages/admin/Orders'
import Products from './pages/admin/Products'
import CustomGallery from './pages/admin/CustomGallery'
import Faqs from './pages/admin/Faqs'
import Testimonials from './pages/admin/Testimonials'
import Chats from './pages/admin/Chats'
import Analytics from './pages/admin/Analytics'
import Sales from './pages/admin/Sales'
import ScrollToTop from './components/ScrollToTop'
import { AppProvider } from './context/AppContext'

function App() {
  return (
    <AppProvider>
      <ScrollToTop />
      <Routes>
        {/* Sisi pelanggan */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/custom" element={<Custom />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Route>

        {/* Sisi owner (terpisah dari tampilan pelanggan) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="custom-gallery" element={<CustomGallery />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="testimonials" element={<Testimonials />} />
          <Route path="chats" element={<Chats />} />
          <Route path="sales" element={<Sales />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  )
}

export default App
