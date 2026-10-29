import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import ImagePlaceholder from '../common/ImagePlaceholder';
import './CartDrawer.css';

export default function CartDrawer() {
  const { cart, isOpen, closeCart, updateItem, removeItem, itemCount } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="cart-backdrop" aria-hidden="true" onClick={closeCart} />
      )}

      {/* Drawer */}
      <aside
        id="cart-drawer"
        className={`cart-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        role="dialog"
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            <ShoppingBag size={20} />
            Your Cart
            {itemCount > 0 && <span className="cart-drawer-count">({itemCount})</span>}
          </h2>
          <button
            className="cart-close-btn"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="cart-drawer-body">
          {cart.items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">
                <ShoppingBag size={48} strokeWidth={1.2} />
              </div>
              <p className="cart-empty-title">Your cart is empty</p>
              <p className="cart-empty-sub">Add some coffee to get started</p>
              <Link to="/shop" className="btn btn-primary btn-sm" onClick={closeCart}>
                Shop Now
              </Link>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cart.items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal-row">
              <span>Subtotal</span>
              <span className="cart-subtotal-amount">
                Rs. {cart.subtotal.toLocaleString()}
              </span>
            </div>
            <p className="cart-shipping-note">
              Shipping calculated at checkout. Free shipping on orders over Rs. 2,000
            </p>
            <Link
              to="/checkout"
              className="btn btn-primary cart-checkout-btn"
              onClick={closeCart}
            >
              Checkout
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/cart"
              className="btn btn-ghost cart-view-btn"
              onClick={closeCart}
            >
              View Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

function CartItem({ item, onUpdate, onRemove }) {
  return (
    <li className="cart-item">
      <div className="cart-item-img">
        <ImagePlaceholder
          src={item.product?.primary_image}
          alt={item.product?.name}
          aspectRatio="1/1"
        />
      </div>
      <div className="cart-item-info">
        <div className="cart-item-header">
          <Link to={`/products/${item.product?.slug}`} className="cart-item-name">
            {item.product?.name}
          </Link>
          <button
            className="cart-item-remove"
            onClick={() => onRemove(item.id)}
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <span className="cart-item-variant">{item.variant?.name}</span>
        <div className="cart-item-footer">
          <div className="cart-qty-controls">
            <button
              className="qty-btn"
              onClick={() => onUpdate(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1}
            >
              <Minus size={12} />
            </button>
            <span className="qty-value" aria-label={`Quantity: ${item.quantity}`}>
              {item.quantity}
            </span>
            <button
              className="qty-btn"
              onClick={() => onUpdate(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
          </div>
          <span className="cart-item-price">
            Rs. {item.line_total?.toLocaleString()}
          </span>
        </div>
      </div>
    </li>
  );
}
