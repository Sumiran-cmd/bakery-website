import test from 'node:test';
import assert from 'node:assert/strict';
import { getPaymentStatusDisplay } from '../utils/orderStatus.js';

test('getPaymentStatusDisplay truthfully maps paid status', () => {
  const res = getPaymentStatusDisplay('paid', 'cash_on_delivery');
  assert.equal(res.text, 'Paid');
  assert.equal(res.className, 'status-paid');
});

test('getPaymentStatusDisplay truthfully maps COD pending status', () => {
  const res = getPaymentStatusDisplay('pending', 'cash_on_delivery');
  assert.equal(res.text, 'Payment Due on Delivery');
  assert.equal(res.className, 'status-cod');
});

test('getPaymentStatusDisplay does NOT claim online pending is COD', () => {
  const resEsewa = getPaymentStatusDisplay('pending', 'esewa');
  assert.equal(resEsewa.text, 'Payment Pending');
  assert.equal(resEsewa.className, 'status-pending');

  const resCard = getPaymentStatusDisplay('pending', 'card');
  assert.equal(resCard.text, 'Payment Pending');
});

test('getPaymentStatusDisplay handles failed, cancelled, and refunded statuses', () => {
  const failed = getPaymentStatusDisplay('failed', 'card');
  assert.equal(failed.text, 'Payment Failed');
  assert.equal(failed.className, 'status-failed');

  const cancelled = getPaymentStatusDisplay('cancelled', 'cash_on_delivery');
  assert.equal(cancelled.text, 'Payment Cancelled');
  assert.equal(cancelled.className, 'status-cancelled');

  const refunded = getPaymentStatusDisplay('refunded', 'card');
  assert.equal(refunded.text, 'Refunded');
});

test('getPaymentStatusDisplay has safe fallback for unknown or null status', () => {
  const resNull = getPaymentStatusDisplay(null, null);
  assert.equal(resNull.text, 'Payment Pending');
  assert.notEqual(resNull.text, 'Paid');

  const resUnknown = getPaymentStatusDisplay('mystery_state', 'esewa');
  assert.equal(resUnknown.text, 'Payment Pending');
  assert.notEqual(resUnknown.text, 'Paid');
});

// Idempotency Key formatting and isolation test
test('idempotency key generation produces distinct keys', () => {
  const generateKey = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `key_${Date.now()}_${Math.random().toString(36).substring(2)}`);
  const key1 = generateKey();
  const key2 = generateKey();
  assert.ok(key1.length >= 10);
  assert.ok(key2.length >= 10);
  assert.notEqual(key1, key2);
});
