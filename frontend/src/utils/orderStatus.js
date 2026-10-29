/**
 * Helper to map order payment status and method to human-readable, truthful display text.
 * Replaces the misleading fallback that previously labeled all unpaid orders as "Pending (COD)".
 */
export function getPaymentStatusDisplay(paymentStatus, paymentMethod) {
  const status = (paymentStatus || '').toLowerCase();
  const method = (paymentMethod || '').toLowerCase();

  if (status === 'paid') {
    return { text: 'Paid', className: 'status-paid' };
  }
  if (status === 'failed') {
    return { text: 'Payment Failed', className: 'status-failed' };
  }
  if (status === 'cancelled') {
    return { text: 'Payment Cancelled', className: 'status-cancelled' };
  }
  if (status === 'pending') {
    if (method === 'cash_on_delivery') {
      return { text: 'Payment Due on Delivery', className: 'status-cod' };
    }
    return { text: 'Payment Pending', className: 'status-pending' };
  }
  if (status === 'authorized') {
    return { text: 'Payment Authorized', className: 'status-pending' };
  }
  if (status === 'refunded') {
    return { text: 'Refunded', className: 'status-cancelled' };
  }
  return { text: 'Payment Pending', className: 'status-pending' };
}
