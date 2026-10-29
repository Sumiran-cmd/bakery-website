import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle, 
  Tag, AlertCircle, ShoppingBag, ArrowLeft, Loader2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../services/api';
import ImagePlaceholder from '../components/common/ImagePlaceholder';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);  // idempotency guard

  // Cryptographically secure idempotency key per checkout attempt
  const generateIdempotencyKey = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `key_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  // Server-calculated quote (authoritative totals)
  const [quote, setQuote] = useState(null);
  const quoteDebounceRef = useRef(null);

  // Shipping form state
  const [formData, setFormData] = useState({
    fullName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
    email: user ? user.email || '' : '',
    phone: user?.phone || '',
    street: '',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati Province',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [couponCode, setCouponCode] = useState('');
  const [pendingCoupon, setPendingCoupon] = useState('');  // submitted coupon code
  const [couponMessage, setCouponMessage] = useState('');
  const [couponIsValid, setCouponIsValid] = useState(null);

  // Fetch authoritative quote from the backend whenever inputs change
  const fetchQuote = async (coupon = pendingCoupon, method = shippingMethod) => {
    if (!cart.items || cart.items.length === 0) {
      setQuote(null);
      return;
    }
    setQuoteLoading(true);
    try {
      const res = await ordersApi.getQuote({ shipping_method: method, coupon_code: coupon });
      setQuote(res.data);
    } catch {
      // On failure, fall back to showing raw cart data — do not compute prices client-side
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    // Debounce quote fetch to avoid spamming the API
    if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);
    quoteDebounceRef.current = setTimeout(() => {
      fetchQuote(pendingCoupon, shippingMethod);
    }, 300);
    return () => clearTimeout(quoteDebounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethod, cart.items?.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setPendingCoupon('');
      setCouponMessage('');
      setCouponIsValid(null);
      await fetchQuote('', shippingMethod);
      return;
    }
    setPendingCoupon(code);
    setQuoteLoading(true);
    try {
      const res = await ordersApi.getQuote({ shipping_method: shippingMethod, coupon_code: code });
      setQuote(res.data);
      if (res.data.coupon_valid) {
        const discount = res.data.discount_amount;
        setCouponMessage(`Coupon "${code}" applied: Rs. ${discount.toLocaleString()} off`);
        setCouponIsValid(true);
        toast.success(`Coupon ${code} applied!`);
      } else if (res.data.coupon_error) {
        setCouponMessage(res.data.coupon_error);
        setCouponIsValid(false);
        toast.error(res.data.coupon_error);
        setPendingCoupon('');  // clear invalid coupon from pending
      }
    } catch {
      setCouponMessage('Could not validate coupon. Please try again.');
      setCouponIsValid(false);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Prevent double-submit
    if (submitted || loading) return;

    if (!cart.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/shop');
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Please provide a valid Nepali phone number');
      return;
    }
    if (!formData.street.trim()) {
      setError('Please provide your delivery street address');
      return;
    }

    if (paymentMethod !== 'cash_on_delivery') {
      setError('Online payment gateways are temporarily unavailable. Please select Cash on Delivery.');
      return;
    }

    setLoading(true);
    setSubmitted(true);

    try {
      const orderPayload = {
        shipping_address: {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          district: formData.district,
          province: formData.province
        },
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        coupon_code: pendingCoupon || '',
        notes: formData.notes
        // NOTE: We do NOT submit prices, discount amounts, or totals.
        // The backend recalculates everything authoritatively.
      };

      const res = await ordersApi.create(orderPayload, {
        headers: {
          'X-Idempotency-Key': idempotencyKeyRef.current
        }
      });
      const placedOrder = res.data.order;
      const guestToken = res.data.guest_token;

      // On successful creation, cycle to a new key for any subsequent checkout
      idempotencyKeyRef.current = generateIdempotencyKey();

      await clearCart();
      toast.success('Order placed successfully! Dhanyabad.');

      // Navigate with the server-confirmed order (never a client-fabricated one)
      navigate(
        `/order-confirmation/${placedOrder.order_number}${guestToken ? `?token=${guestToken}` : ''}`,
        { state: { order: placedOrder } }
      );
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === 'idempotency_payload_mismatch') {
        // Idempotency key was reused with modified payload; regenerate key so user can submit their updated order
        idempotencyKeyRef.current = generateIdempotencyKey();
        const msg = 'Checkout details changed. Please review and place your order again.';
        setError(msg);
        toast.error(msg);
      } else {
        // Surface the actual backend error — do NOT silently create a fake order
        const msg = err.response?.data?.error || 'Failed to place order. Please try again.';
        setError(msg);
        toast.error(msg);
      }
      setSubmitted(false);  // Allow retry (keeps the same idempotency key for network retries)
    } finally {
      setLoading(false);
    }
  };

  // Use server quote when available, otherwise fall back to cart subtotal only for display
  const displaySubtotal = quote?.subtotal ?? cart.subtotal ?? 0;
  const displayShipping = quote?.shipping_cost ?? (shippingMethod === 'express' ? 250 : (displaySubtotal >= 2000 ? 0 : 100));
  const displayDiscount = quote?.discount_amount ?? 0;
  const displayTotal = quote?.total ?? Math.max(0, displaySubtotal - displayDiscount + displayShipping);

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-empty container">
        <div className="empty-box">
          <ShoppingBag size={48} className="empty-icon" />
          <h2>Your Cart is Empty</h2>
          <p>Please select some fresh Himalayan roast before checking out.</p>
          <Link to="/shop" className="btn btn-primary">Return to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Breadcrumb Header */}
        <div className="checkout-header">
          <Link to="/cart" className="back-link">
            <ArrowLeft size={16} /> Back to Cart
          </Link>
          <div className="checkout-steps">
            <span className="step done"><CheckCircle size={14} /> Cart</span>
            <ChevronRight size={14} className="step-sep" />
            <span className="step active">Delivery &amp; Payment</span>
            <ChevronRight size={14} className="step-sep" />
            <span className="step">Confirmation</span>
          </div>
        </div>

        {error && (
          <div className="checkout-alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="checkout-layout">
          {/* Main Left Form Area */}
          <div className="checkout-main">
            {/* 1. Customer & Shipping Info */}
            <section className="checkout-section card">
              <div className="section-title-wrap">
                <span className="section-num">1</span>
                <div>
                  <h2 className="section-heading">Delivery Address</h2>
                  <p className="section-subheading">Where should we deliver your freshly roasted coffee?</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Aarav Sharma"
                    autoComplete="name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number (Nepal) *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="98XXXXXXXX"
                    autoComplete="tel"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="street">Street Address &amp; Landmark *</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    required
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="e.g. House 42, Gyaneshwor Marg (near German Bakery)"
                    autoComplete="street-address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City / Valley Area *</label>
                  <select id="city" name="city" value={formData.city} onChange={handleInputChange}>
                    <option value="Kathmandu">Kathmandu</option>
                    <option value="Lalitpur">Lalitpur (Patan)</option>
                    <option value="Bhaktapur">Bhaktapur</option>
                    <option value="Pokhara">Pokhara</option>
                    <option value="Chitwan">Chitwan / Narayangarh</option>
                    <option value="Dharan">Dharan</option>
                    <option value="Biratnagar">Biratnagar</option>
                    <option value="Butwal">Butwal</option>
                    <option value="Other">Other Nepal District</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="province">Province *</label>
                  <select id="province" name="province" value={formData.province} onChange={handleInputChange}>
                    <option value="Bagmati Province">Bagmati Province</option>
                    <option value="Gandaki Province">Gandaki Province</option>
                    <option value="Koshi Province">Koshi Province</option>
                    <option value="Lumbini Province">Lumbini Province</option>
                    <option value="Madhesh Province">Madhesh Province</option>
                    <option value="Karnali Province">Karnali Province</option>
                    <option value="Sudurpashchim Province">Sudurpashchim Province</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="notes">Special Roasting / Delivery Notes (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="2"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Leave with security gate, call before arrival, etc."
                  />
                </div>
              </div>
            </section>

            {/* 2. Shipping Method */}
            <section className="checkout-section card">
              <div className="section-title-wrap">
                <span className="section-num">2</span>
                <div>
                  <h2 className="section-heading">Shipping Method</h2>
                  <p className="section-subheading">Select your preferred courier service</p>
                </div>
              </div>

              <div className="shipping-options">
                <label className={`shipping-radio-card ${shippingMethod === 'standard' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                  />
                  <div className="radio-body">
                    <div className="radio-header">
                      <Truck size={18} className="option-icon" />
                      <div>
                        <strong>Standard Courier Delivery</strong>
                        <p>1–2 business days inside valley, 2–4 days outside</p>
                      </div>
                    </div>
                    <span className="price-tag">
                      {displaySubtotal >= 2000
                        ? <span className="free-badge">FREE</span>
                        : 'Rs. 100'}
                    </span>
                  </div>
                </label>

                <label className={`shipping-radio-card ${shippingMethod === 'express' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                  />
                  <div className="radio-body">
                    <div className="radio-header">
                      <Truck size={18} className="option-icon express" />
                      <div>
                        <strong>Priority Express Dispatch</strong>
                        <p>Same-day / Next-day morning priority courier</p>
                      </div>
                    </div>
                    <span className="price-tag">Rs. 250</span>
                  </div>
                </label>
              </div>
            </section>

            {/* 3. Payment Method */}
            <section className="checkout-section card">
              <div className="section-title-wrap">
                <span className="section-num">3</span>
                <div>
                  <h2 className="section-heading">Payment Option</h2>
                  <p className="section-subheading">Choose how you'd like to pay</p>
                </div>
              </div>

              <div className="payment-options">
                <label className={`payment-radio-card ${paymentMethod === 'cash_on_delivery' ? 'selected' : ''}`}>
                  <input type="radio" name="paymentMethod" value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')} />
                  <div className="payment-content">
                    <div className="payment-title">
                      <strong>Cash on Delivery (COD)</strong>
                      <span className="popular-badge">Available &amp; Supported</span>
                    </div>
                    <p className="payment-desc">Pay with cash or Fonepay scan when our courier hands over your parcel.</p>
                  </div>
                </label>

                <label className="payment-radio-card disabled-method" title="eSewa integration is temporarily unavailable. Please select Cash on Delivery.">
                  <input type="radio" name="paymentMethod" value="esewa" disabled checked={false} />
                  <div className="payment-content">
                    <div className="payment-title">
                      <strong>eSewa Mobile Wallet</strong>
                      <span className="unavailable-badge">Temporarily Unavailable</span>
                    </div>
                    <p className="payment-desc">Online gateway unavailable. Please select Cash on Delivery.</p>
                  </div>
                </label>

                <label className="payment-radio-card disabled-method" title="Khalti integration is temporarily unavailable. Please select Cash on Delivery.">
                  <input type="radio" name="paymentMethod" value="khalti" disabled checked={false} />
                  <div className="payment-content">
                    <div className="payment-title">
                      <strong>Khalti Digital Wallet</strong>
                      <span className="unavailable-badge">Temporarily Unavailable</span>
                    </div>
                    <p className="payment-desc">Online gateway unavailable. Please select Cash on Delivery.</p>
                  </div>
                </label>

                <label className="payment-radio-card disabled-method" title="Card processing is temporarily unavailable. Please select Cash on Delivery.">
                  <input type="radio" name="paymentMethod" value="card" disabled checked={false} />
                  <div className="payment-content">
                    <div className="payment-title">
                      <div className="card-title-flex">
                        <CreditCard size={18} />
                        <strong>Credit / Debit Card</strong>
                      </div>
                      <span className="unavailable-badge">Temporarily Unavailable</span>
                    </div>
                    <p className="payment-desc">Card gateway unavailable. Please select Cash on Delivery.</p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Right Summary Sidebar */}
          <aside className="checkout-sidebar">
            <div className="order-summary-card card">
              <h3 className="summary-title">Order Summary</h3>

              {/* Items List */}
              <div className="summary-items">
                {cart.items.map(item => (
                  <div key={item.id} className="summary-item-row">
                    <div className="item-thumbnail">
                      <ImagePlaceholder
                        src={typeof item.product?.primary_image === 'string'
                          ? item.product?.primary_image
                          : item.product?.primary_image?.image_url || item.product?.primary_image}
                        alt={item.product?.name}
                        aspectRatio="1/1"
                        className="thumb-img"
                      />
                      <span className="qty-badge">{item.quantity}</span>
                    </div>
                    <div className="item-info">
                      <span className="item-name">{item.product?.name}</span>
                      <span className="item-variant">{item.variant?.name}</span>
                    </div>
                    <div className="item-total">
                      Rs. {((item.variant?.price || 0) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="coupon-form-box">
                <div className="coupon-input-group">
                  <Tag size={16} className="coupon-icon" />
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. BEAN10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    aria-label="Coupon code"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="btn btn-sm btn-outline"
                    disabled={quoteLoading}
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <span className={`coupon-msg ${couponIsValid ? 'coupon-success-text' : 'coupon-error-text'}`}
                    role="status">
                    {couponMessage}
                  </span>
                )}
              </div>

              {/* Financial Breakdown — server-authoritative */}
              <div className="summary-breakdown">
                {quoteLoading && (
                  <div className="quote-loading">
                    <Loader2 size={14} className="spinner" /> Updating totals…
                  </div>
                )}
                <div className="breakdown-row">
                  <span>Subtotal</span>
                  <span>Rs. {displaySubtotal.toLocaleString()}</span>
                </div>

                {displayDiscount > 0 && (
                  <div className="breakdown-row discount-row">
                    <span>Discount {pendingCoupon && `(${pendingCoupon})`}</span>
                    <span>- Rs. {displayDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="breakdown-row">
                  <span>Shipping</span>
                  <span>{displayShipping === 0
                    ? <strong className="free-text">FREE</strong>
                    : `Rs. ${displayShipping}`}
                  </span>
                </div>

                <div className="breakdown-divider" />

                <div className="breakdown-row total-row">
                  <span>Total Amount</span>
                  <span className="total-amount">Rs. {Math.round(displayTotal).toLocaleString()}</span>
                </div>
                <small className="tax-inclusive">Inclusive of all local taxes &amp; VAT</small>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || submitted}
                className="btn btn-primary btn-block place-order-btn"
                aria-busy={loading}
              >
                {loading
                  ? <><Loader2 size={16} className="spinner" /> Processing Order…</>
                  : `Confirm Order • Rs. ${Math.round(displayTotal).toLocaleString()}`}
              </button>

              {/* Trust Badges */}
              <div className="checkout-trust-box">
                <div className="trust-item">
                  <ShieldCheck size={16} />
                  <span>100% Nepali Single-Origin Certified</span>
                </div>
                <div className="trust-item">
                  <Truck size={16} />
                  <span>Roasted Fresh &amp; Dispatched from Kathmandu</span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
