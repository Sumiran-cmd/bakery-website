import unittest
import json
import hashlib
from datetime import datetime, timedelta, timezone
from app import create_app
from app.extensions import db
from app.models import User, Address, TokenBlocklist, PasswordResetToken
from app.services.rate_limiter import rate_limiter


class AuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        rate_limiter.clear()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def _register_user(self, email='test@beantheory.com.np', password='password123', first_name='Test', last_name='User'):
        return self.client.post('/api/auth/register', json={
            'email': email,
            'password': password,
            'password_confirmation': password,
            'first_name': first_name,
            'last_name': last_name
        })

    def _login_user(self, email='test@beantheory.com.np', password='password123'):
        return self.client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })

    # 1. Successful Registration
    def test_successful_registration(self):
        res = self._register_user()
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn('user', data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['email'], 'test@beantheory.com.np')
        self.assertEqual(data['user']['first_name'], 'Test')
        self.assertNotIn('password_hash', data['user'])

        # Check database
        user = User.query.filter_by(email='test@beantheory.com.np').first()
        self.assertIsNotNone(user)
        self.assertFalse(user.is_admin)  # Never grant admin by default
        self.assertTrue(user.check_password('password123'))

    # 2. Duplicate Registration
    def test_duplicate_registration(self):
        self._register_user()
        res = self._register_user()
        self.assertEqual(res.status_code, 409)
        self.assertIn('already exists', res.get_json()['error'])

    # 3. Missing Fields
    def test_registration_missing_fields(self):
        res = self.client.post('/api/auth/register', json={
            'email': 'incomplete@beantheory.com.np'
        })
        self.assertEqual(res.status_code, 400)

    # 4. Invalid Email
    def test_registration_invalid_email(self):
        res = self.client.post('/api/auth/register', json={
            'email': 'not-an-email',
            'password': 'password123',
            'first_name': 'Valid'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('valid email', res.get_json()['error'])

    # 5. Password Policy
    def test_registration_password_policy(self):
        # Too short
        res = self.client.post('/api/auth/register', json={
            'email': 'short@beantheory.com.np',
            'password': '123',
            'first_name': 'Short'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('at least 8 characters', res.get_json()['error'])

        # Mismatch
        res = self.client.post('/api/auth/register', json={
            'email': 'mismatch@beantheory.com.np',
            'password': 'password123',
            'password_confirmation': 'different123',
            'first_name': 'Mismatch'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('do not match', res.get_json()['error'])

    # 6. Successful Login
    def test_successful_login(self):
        self._register_user()
        res = self._login_user()
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('user', data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['email'], 'test@beantheory.com.np')

    # 7. Incorrect Password
    def test_login_incorrect_password(self):
        self._register_user()
        res = self._login_user(password='wrongpass')
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.get_json()['error'], 'Invalid email or password')

    # 8. Unknown Email
    def test_login_unknown_email(self):
        res = self._login_user(email='ghost@beantheory.com.np')
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.get_json()['error'], 'Invalid email or password')

    # 9. Email Normalization
    def test_email_normalization(self):
        self._register_user(email='  SpAcY.UsEr@BeanTheory.com.np  ')
        res = self._login_user(email='spacy.user@beantheory.com.np')
        self.assertEqual(res.status_code, 200)

    # 10. Current User Me Endpoint
    def test_current_user_me(self):
        self._register_user()
        login_res = self._login_user()
        token = login_res.get_json()['token']

        res = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['user']['email'], 'test@beantheory.com.np')

    # 11. Unauthenticated Protected Access
    def test_unauthenticated_access(self):
        res = self.client.get('/api/auth/me')
        self.assertEqual(res.status_code, 401)

    # 12. Logout & Token Revocation
    def test_logout_and_revocation(self):
        self._register_user()
        login_res = self._login_user()
        token = login_res.get_json()['token']

        # Logout
        logout_res = self.client.post('/api/auth/logout', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(logout_res.status_code, 200)

        # Attempt to access protected endpoint with the revoked token
        subsequent_res = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(subsequent_res.status_code, 401)
        self.assertEqual(subsequent_res.get_json().get('code'), 'token_revoked')

    # 13. Rate Limiting
    def test_rate_limiting(self):
        ip_key = "login_127.0.0.1_bad@test.com"
        rate_limiter.reset(ip_key)

        for _ in range(5):
            self.client.post('/api/auth/login', json={'email': 'bad@test.com', 'password': 'wrong'})

        res = self.client.post('/api/auth/login', json={'email': 'bad@test.com', 'password': 'wrong'})
        self.assertEqual(res.status_code, 429)

    # 14. Forgot Password & Safe Non-Enumeration
    def test_forgot_password_generic_response(self):
        # Existing user
        self._register_user(email='real@beantheory.com.np')
        res_real = self.client.post('/api/auth/forgot-password', json={'email': 'real@beantheory.com.np'})
        self.assertEqual(res_real.status_code, 200)

        # Non-existing user
        res_fake = self.client.post('/api/auth/forgot-password', json={'email': 'fake@beantheory.com.np'})
        self.assertEqual(res_fake.status_code, 200)
        self.assertEqual(res_real.get_json()['message'], res_fake.get_json()['message'])

    # 15. Password Reset Flow: Token, Single-Use, and Expiration
    def test_password_reset_flow(self):
        self._register_user(email='resetme@beantheory.com.np', password='oldpassword123')
        user = User.query.filter_by(email='resetme@beantheory.com.np').first()

        # Generate a test raw token & hash
        raw_token = 'test-secure-reset-token-sample-123'
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1),
            used=False
        )
        db.session.add(reset_record)
        db.session.commit()

        # Verify token endpoint
        verify_res = self.client.get(f'/api/auth/verify-reset-token/{raw_token}')
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.get_json()['valid'])

        # Reset password
        reset_res = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'password': 'brandnewpassword123',
            'password_confirmation': 'brandnewpassword123'
        })
        self.assertEqual(reset_res.status_code, 200)

        # Old password rejected
        login_old = self._login_user(email='resetme@beantheory.com.np', password='oldpassword123')
        self.assertEqual(login_old.status_code, 401)

        # New password accepted
        login_new = self._login_user(email='resetme@beantheory.com.np', password='brandnewpassword123')
        self.assertEqual(login_new.status_code, 200)

        # Token is single-use: subsequent attempt fails
        retry_res = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'password': 'anotherpassword123'
        })
        self.assertEqual(retry_res.status_code, 400)

    # 16. Profile Update
    def test_profile_update(self):
        self._register_user(first_name='Original', last_name='Name')
        login_res = self._login_user()
        token = login_res.get_json()['token']

        res = self.client.put('/api/auth/profile', headers={'Authorization': f'Bearer {token}'}, json={
            'first_name': 'UpdatedFirst',
            'last_name': 'UpdatedLast',
            'phone': '+977-9812345678'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['user']['first_name'], 'UpdatedFirst')
        self.assertEqual(data['user']['last_name'], 'UpdatedLast')
        self.assertEqual(data['user']['phone'], '+977-9812345678')

    # 17. Authenticated Password Change
    def test_change_password(self):
        self._register_user(password='originalpass123')
        login_res = self._login_user(password='originalpass123')
        token = login_res.get_json()['token']

        # Wrong current password fails
        res_fail = self.client.post('/api/auth/change-password', headers={'Authorization': f'Bearer {token}'}, json={
            'current_password': 'wrongpassword',
            'new_password': 'newpassword123'
        })
        self.assertEqual(res_fail.status_code, 401)

        # Correct current password succeeds
        res_ok = self.client.post('/api/auth/change-password', headers={'Authorization': f'Bearer {token}'}, json={
            'current_password': 'originalpass123',
            'new_password': 'newpassword123',
            'confirm_password': 'newpassword123'
        })
        self.assertEqual(res_ok.status_code, 200)

        # Login with new password works
        login_new = self._login_user(password='newpassword123')
        self.assertEqual(login_new.status_code, 200)

    # 18. Address CRUD and Resource Isolation
    def test_address_crud_and_isolation(self):
        # User A
        self._register_user(email='usera@beantheory.com.np', password='password123')
        token_a = self._login_user(email='usera@beantheory.com.np')['token'] if isinstance(self._login_user(email='usera@beantheory.com.np'), dict) else self._login_user(email='usera@beantheory.com.np').get_json()['token']

        # User B
        self._register_user(email='userb@beantheory.com.np', password='password123')
        token_b = self._login_user(email='userb@beantheory.com.np').get_json()['token']

        # User A creates address
        add_res = self.client.post('/api/addresses', headers={'Authorization': f'Bearer {token_a}'}, json={
            'label': 'Home',
            'full_name': 'User A',
            'phone': '9841000000',
            'street': 'Jhamsikhel Marg',
            'city': 'Lalitpur',
            'district': 'Lalitpur',
            'province': 'Bagmati'
        })
        self.assertEqual(add_res.status_code, 201)
        addr_id = add_res.get_json()['address']['id']

        # User A can retrieve it
        list_a = self.client.get('/api/addresses', headers={'Authorization': f'Bearer {token_a}'})
        self.assertEqual(len(list_a.get_json()['addresses']), 1)

        # User B list is empty
        list_b = self.client.get('/api/addresses', headers={'Authorization': f'Bearer {token_b}'})
        self.assertEqual(len(list_b.get_json()['addresses']), 0)

        # User B CANNOT edit User A's address
        edit_b = self.client.put(f'/api/addresses/{addr_id}', headers={'Authorization': f'Bearer {token_b}'}, json={
            'full_name': 'Hacker'
        })
        self.assertEqual(edit_b.status_code, 404)

        # User B CANNOT delete User A's address
        del_b = self.client.delete(f'/api/addresses/{addr_id}', headers={'Authorization': f'Bearer {token_b}'})
        self.assertEqual(del_b.status_code, 404)

        # User A CAN delete their address
        del_a = self.client.delete(f'/api/addresses/{addr_id}', headers={'Authorization': f'Bearer {token_a}'})
        self.assertEqual(del_a.status_code, 200)


if __name__ == '__main__':
    unittest.main()
