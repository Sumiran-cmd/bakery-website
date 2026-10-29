import test from 'node:test';
import assert from 'node:assert/strict';
import { extractErrorMessage } from '../services/api.js';

test('extractErrorMessage extracts backend error field', () => {
  const err = { response: { data: { error: 'Invalid email or password' } } };
  assert.equal(extractErrorMessage(err), 'Invalid email or password');
});

test('extractErrorMessage extracts message field', () => {
  const err = { response: { data: { message: 'Instructions sent' } } };
  assert.equal(extractErrorMessage(err), 'Instructions sent');
});

test('extractErrorMessage handles network failure', () => {
  const err = new Error('Network Error');
  assert.match(extractErrorMessage(err), /Unable to reach the server/);
});

test('extractErrorMessage handles timeout ECONNABORTED', () => {
  const err = { code: 'ECONNABORTED' };
  assert.match(extractErrorMessage(err), /Request timed out/);
});

test('extractErrorMessage falls back to default message', () => {
  assert.equal(extractErrorMessage(null, 'Custom fallback'), 'Custom fallback');
  assert.equal(extractErrorMessage({}, 'Custom fallback'), 'Custom fallback');
});

// Validation rules verification
function validateRegistration({ first_name, email, password, password_confirmation }) {
  const errors = {};
  if (!first_name || first_name.trim().length < 2) errors.first_name = 'First name required (min 2 chars)';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Valid email required';
  if (!password || password.length < 8) errors.password = 'Password must be at least 8 chars';
  if (password !== password_confirmation) errors.password_confirmation = 'Passwords must match';
  return errors;
}

test('Registration validation passes on valid payload', () => {
  const res = validateRegistration({
    first_name: 'Karma',
    email: 'karma@beantheory.com.np',
    password: 'securepassword123',
    password_confirmation: 'securepassword123'
  });
  assert.deepEqual(res, {});
});

test('Registration validation catches invalid email and short password', () => {
  const res = validateRegistration({
    first_name: 'K',
    email: 'invalid-email',
    password: 'short',
    password_confirmation: 'different'
  });
  assert.ok(res.first_name);
  assert.ok(res.email);
  assert.ok(res.password);
  assert.ok(res.password_confirmation);
});
