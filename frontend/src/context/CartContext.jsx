import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartApi } from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const EMPTY_CART = { items: [], subtotal: 0, item_count: 0 };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [cartError, setCartError] = useState(false);  // true when cart failed to load
  const [isOpen, setIsOpen] = useState(false);
  const fetchInFlight = useRef(false);

  const fetchCart = useCallback(async () => {
    // Prevent concurrent fetches from overwriting each other
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    setCartError(false);
    try {
      const res = await cartApi.get();
      setCart(res.data.cart || EMPTY_CART);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        // Not authenticated — empty cart is correct
        setCart(EMPTY_CART);
      } else {
        // Network / server error — keep stale state, mark error so UI can show a message
        setCartError(true);
      }
    } finally {
      fetchInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, variantId, quantity = 1) => {
    setLoading(true);
    try {
      const res = await cartApi.addItem({ product_id: productId, variant_id: variantId, quantity });
      setCart(res.data.cart);
      setCartError(false);
      toast.success('Added to cart!', { icon: '☕' });
      setIsOpen(true);
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add to cart';
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    try {
      const res = await cartApi.updateItem(itemId, { quantity });
      setCart(res.data.cart);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update item');
    }
  }, []);

  const removeItem = useCallback(async (itemId) => {
    try {
      const res = await cartApi.removeItem(itemId);
      setCart(res.data.cart);
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await cartApi.clear();
      setCart(EMPTY_CART);
    } catch {
      // Clear locally even if the API fails — order was already placed
      setCart(EMPTY_CART);
    }
  }, []);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(p => !p);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      cartError,  // true = load failed (not empty)
      isOpen,
      itemCount: cart.item_count || 0,
      subtotal: cart.subtotal || 0,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
      fetchCart,
      openCart,
      closeCart,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
