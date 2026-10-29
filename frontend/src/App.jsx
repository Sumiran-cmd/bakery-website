import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AccountPage from './pages/AccountPage';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AboutPage from './pages/AboutPage';
import BakesPage from './pages/BakesPage';
import DrinksPage from './pages/DrinksPage';
import FoodPage from './pages/FoodPage';
import MenuLandingPage from './pages/MenuLandingPage';

import './App.css';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

// 404 Not Found Component
function NotFound() {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="not-found-card card">
          <span className="not-found-badge">404</span>
          <h1>Page Not Found</h1>
          <p>
            It seems the page or specialty roast you were searching for has moved, or the aroma drifted away.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">Return Home</Link>
            <Link to="/shop" className="btn btn-outline">Explore Shop</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <div className="app-wrapper">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                <Route path="/account" element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/our-story" element={<AboutPage />} />
                <Route path="/menu" element={<MenuLandingPage />} />
                <Route path="/menu/bakes" element={<BakesPage />} />
                <Route path="/menu/bakes-desserts" element={<BakesPage />} />
                <Route path="/menu/drinks" element={<DrinksPage />} />
                <Route path="/menu/coffee-drinks" element={<DrinksPage />} />
                <Route path="/menu/food" element={<FoodPage />} />
                <Route path="/menu/food-snacks" element={<FoodPage />} />
                <Route path="/the-theory" element={<AboutPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <CartDrawer />
          </div>

          {/* Toast Notification Container */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#2B1B17',
                color: '#FAF7F2',
                fontFamily: 'inherit',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid rgba(212, 163, 115, 0.3)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#2E7D32',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#C62828',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
