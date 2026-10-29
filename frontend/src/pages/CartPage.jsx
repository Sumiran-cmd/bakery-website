import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ImagePlaceholder from '../components/common/ImagePlaceholder';
import './CartPage.css';

export default function CartPage() {
  const { cart, updateItem, removeItem, itemCount } = useCart();

  if (itemCount === 0) {
    return (
      <div className="cart-page-empty">
        <div className="container">
          <div className="empty-state">
            <ShoppingBag size={64} strokeWidth={1} />
            <h1>Your cart is empty</h1>
            <p>Looks like you haven't added any coffee yet.</p>
            <Link to="/shop" className="btn btn-primary btn-lg" id="cart-shop-btn">
              Explore Our Coffee
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shippingCost = cart.subtotal >= 2000 ? 0 : 200;
  const total = cart.subtotal + shippingCost;

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-page-header">
          <h1>Shopping Cart</h1>
          <span className="cart-page-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        </div>

        <div className="cart-page-layout">
          {/* Items */}
          <div className="cart-page-items">
            <div className="cart-items-header">
              <span>Product</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
            <ul className="cart-page-list">
              {cart.items.map(item => (
                <li key={item.id} className="cart-page-item">
                  {/* Image */}
                  <Link to={`/products/${item.product?.slug}`} className="cart-page-item-img">
                    <ImagePlaceholder
                      src={item.product?.primary_image}
                      alt={item.product?.name}
                      aspectRatio="1/1"
                    />
                  </Link>
                  {/* Info */}
                  <div className="cart-page-item-info">
                    <Link to={`/products/${item.product?.slug}`} className="cart-page-item-name">
                      {item.product?.name}
                    </Link>
                    <span className="cart-page-item-variant">{item.variant?.name}</span>
                    <span className="cart-page-item-unit">
                      Rs. {item.variant?.price?.toLocaleString()} each
                    </span>
                    <button
                      className="cart-page-remove"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  {/* Qty */}
                  <div className="cart-page-qty">
                    <div className="quantity-control">
                      <button className="qty-btn-lg" onClick={() => updateItem(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1} aria-label="Decrease">
                        <Minus size={14} />
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button className="qty-btn-lg" onClick={() => updateItem(item.id, item.quantity + 1)}
                        aria-label="Increase">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  {/* Total */}
                  <div className="cart-page-item-total">
                    Rs. {item.line_total?.toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-lines">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>Rs. {cart.subtotal?.toLocaleString()}</span>
              </div>
              <div className="summary-line">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : `Rs. ${shippingCost}`}</span>
              </div>
              {shippingCost > 0 && (
                <p className="free-shipping-note">
                  Add Rs. {(2000 - cart.subtotal).toLocaleString()} more for free shipping
                </p>
              )}
              <div className="summary-divider" />
              <div className="summary-line summary-total">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
            <Link to="/checkout" id="cart-checkout-btn" className="btn btn-primary cart-summary-cta">
              Proceed to Checkout
              <ArrowRight size={16} />
            </Link>
            <Link to="/shop" className="btn btn-ghost cart-summary-continue">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
