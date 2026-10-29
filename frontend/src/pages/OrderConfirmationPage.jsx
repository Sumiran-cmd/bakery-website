import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle2, PackageCheck, MapPin, 
  Printer, ArrowRight, Phone, Coffee, Clock 
} from 'lucide-react';
import { ordersApi } from '../services/api';
import { getPaymentStatusDisplay } from '../utils/orderStatus';
import './OrderConfirmationPage.css';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  // Extract guest token from URL params (set by CheckoutPage for guest orders)
  const searchParams = new URLSearchParams(location.search);
  const guestToken = searchParams.get('token');

  useEffect(() => {
    // If order was passed in navigation state, we already have it
    if (order) return;

    // Otherwise, fetch from backend API
    const fetchOrder = async () => {
      try {
        const res = await ordersApi.getByNumber(orderNumber, guestToken);
        setOrder(res.data.order);
      } catch (err) {
        console.warn('Could not fetch order by number:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, order, guestToken]);

  const handlePrint = () => {
    window.print();
  };

  const paymentMethodLabels = {
    cash_on_delivery: 'Cash on Delivery (Pay upon arrival)',
    esewa: 'eSewa Mobile Wallet',
    khalti: 'Khalti Digital Wallet',
    card: 'Credit / Debit Card'
  };

  // Calculate estimated delivery date based on order date
  const formattedDeliveryDate = useMemo(() => {
    const rawDate = order?.created_at;
    if (!rawDate) return '2–3 business days';
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return '2–3 business days';
    const delivery = new Date(parsed.getTime() + 2 * 24 * 60 * 60 * 1000);
    return delivery.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }, [order?.created_at]);

  const paymentStatusInfo = getPaymentStatusDisplay(order?.payment_status, order?.payment_method);

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="container confirmation-container" style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <h2>Loading Order Details...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="container confirmation-container" style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
          <h2>Order Not Found</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 'var(--space-3) 0 var(--space-6)' }}>
            We could not find order #{orderNumber}. If this was a guest order, please ensure you used the direct confirmation link sent to your email.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to="/shop" className="btn btn-primary">Browse Shop</Link>
            <Link to="/account" className="btn btn-outline">My Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="container confirmation-container">
        {/* Success Hero Header */}
        <div className="confirmation-hero card">
          <div className="check-icon-wrap">
            <CheckCircle2 size={56} className="check-icon" />
          </div>
          <span className="confirmation-subtitle">Dhanyabad! Order Confirmed</span>
          <h1 className="confirmation-title">Fresh Roast Is On Its Way</h1>
          <p className="confirmation-intro">
            We have received your coffee order. Our roastery team in Patan, Nepal is already preparing your batch with care.
          </p>

          <div className="order-meta-pill-bar">
            <div className="meta-pill">
              <span className="pill-label">Order Number</span>
              <strong className="pill-value">{orderNumber}</strong>
            </div>
            <div className="meta-pill">
              <span className="pill-label">Est. Delivery</span>
              <strong className="pill-value">{formattedDeliveryDate}</strong>
            </div>
            <div className="meta-pill">
              <span className="pill-label">Payment Status</span>
              <strong className={`pill-value status-badge ${paymentStatusInfo.className}`}>
                {paymentStatusInfo.text}
              </strong>
            </div>
          </div>
        </div>

        {/* Detailed Receipt Card */}
        <div className="confirmation-details-grid">
          {/* Left Column: Items and Totals */}
          <div className="receipt-card card">
            <div className="receipt-header">
              <div className="receipt-brand">
                <Coffee size={22} className="brand-icon" />
                <span className="brand-name">Bean Theory Coffee Roasters</span>
              </div>
              <button onClick={handlePrint} className="btn btn-sm btn-outline print-btn no-print">
                <Printer size={15} /> Print Receipt
              </button>
            </div>

            <div className="items-table-wrap">
              <table className="confirmation-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Grind / Variant</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order?.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="item-name-cell">
                          <strong>{item.product_name}</strong>
                        </td>
                        <td className="item-variant-cell">{item.variant_name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">
                          Rs. {(item.line_total || (item.unit_price * item.quantity)).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">Artisanal Nepali Coffee Selection</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="confirmation-totals">
              <div className="total-line">
                <span>Subtotal</span>
                <span>Rs. {(order?.subtotal || 0).toLocaleString()}</span>
              </div>
              {order?.discount_amount > 0 && (
                <div className="total-line discount-line">
                  <span>Special Discount</span>
                  <span>- Rs. {Number(order.discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="total-line">
                <span>Shipping Cost</span>
                <span>{order?.shipping_cost === 0 ? 'FREE' : `Rs. ${order?.shipping_cost || 0}`}</span>
              </div>
              <div className="total-line grand-total-line">
                <span>Total Amount</span>
                <span className="highlight-price">Rs. {(order?.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery and Support Info */}
          <div className="delivery-info-stack">
            {/* Delivery address card */}
            <div className="info-card card">
              <h3 className="info-card-title">
                <MapPin size={18} /> Delivery Address
              </h3>
              {order?.shipping_address ? (
                <address className="address-content">
                  <strong>{order.shipping_address.full_name}</strong>
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.district}
                  </p>
                  <p>{order.shipping_address.province}</p>
                  <p className="phone-line">
                    <Phone size={14} /> {order.shipping_address.phone}
                  </p>
                </address>
              ) : (
                <p className="text-muted">Standard Kathmandu Valley Delivery</p>
              )}
            </div>

            {/* Payment Method card */}
            <div className="info-card card">
              <h3 className="info-card-title">
                <PackageCheck size={18} /> Payment Information
              </h3>
              <p className="payment-info-text">
                <strong>Method:</strong> {paymentMethodLabels[order?.payment_method] || order?.payment_method || 'Cash on Delivery'}
              </p>
              <div className="roast-dispatch-badge">
                <Clock size={16} />
                <span>Packaged fresh in valve sealed bags with one-way degassing freshness valve</span>
              </div>
            </div>

            {/* Roastery Support card */}
            <div className="info-card support-card card">
              <h4 className="support-title">Need help with your order?</h4>
              <p className="support-desc">
                Have questions about your roast date or delivery timing? Reach our roastery concierge directly.
              </p>
              <div className="support-actions">
                <a href="tel:+97715534123" className="btn btn-sm btn-outline">
                  <Phone size={14} /> Call Roastery
                </a>
                <a
                  href="https://wa.me/9779801234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-secondary"
                >
                  WhatsApp Concierge
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation CTAs */}
        <div className="confirmation-actions no-print">
          <Link to="/shop" className="btn btn-primary">
            Explore More Coffees <ArrowRight size={16} />
          </Link>
          <Link to="/account" className="btn btn-outline">
            View My Order History
          </Link>
        </div>
      </div>
    </div>
  );
}
