import re
import secrets
import hashlib
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app, make_response
from app.extensions import db
from app.models import User, TokenBlocklist, PasswordResetToken
from app.services.email_service import send_password_reset_email
from app.services.rate_limiter import rate_limiter
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    unset_jwt_cookies
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')


def _get_client_ip():
    """Returns real client IP. Werkzeug ProxyFix handles proxy extraction safely when TRUST_PROXY is True."""
    return request.remote_addr or '127.0.0.1'


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    ip = _get_client_ip()

    max_attempts = current_app.config.get('REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS', 15)
    window = current_app.config.get('AUTH_RATE_LIMIT_WINDOW_SECONDS', 900)

    if rate_limiter.is_rate_limited(f"reg_{ip}", max_attempts=max_attempts, window_seconds=window):
        retry_after = rate_limiter.get_retry_after(f"reg_{ip}", window_seconds=window)
        resp = jsonify({
            'error': 'Too many registration requests. Please try again later.',
            'code': 'rate_limit_exceeded',
            'retry_after': retry_after
        })
        resp.headers['Retry-After'] = str(retry_after)
        return resp, 429

    # Record every registration attempt to prevent abuse and brute force
    rate_limiter.record_attempt(f"reg_{ip}", window_seconds=window)

    email = str(data.get('email', '')).strip().lower()
    first_name = str(data.get('first_name', '')).strip()
    last_name = str(data.get('last_name', '')).strip()
    phone = str(data.get('phone', '')).strip()
    password = str(data.get('password', ''))
    password_confirmation = str(data.get('password_confirmation', ''))

    # Validation
    if not email or not first_name or not password:
        return jsonify({'error': 'Email, first name, and password are required'}), 400

    if not EMAIL_REGEX.match(email) or len(email) > 255:
        return jsonify({'error': 'Please provide a valid email address'}), 400

    if len(first_name) < 2 or len(first_name) > 100:
        return jsonify({'error': 'First name must be between 2 and 100 characters'}), 400

    if len(last_name) > 100:
        return jsonify({'error': 'Last name cannot exceed 100 characters'}), 400

    if phone and len(phone) > 25:
        return jsonify({'error': 'Phone number is too long'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    if password_confirmation and password != password_confirmation:
        return jsonify({'error': 'Passwords do not match'}), 400

    # Uniqueness check
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email address already exists'}), 409

    try:
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_admin=False
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))
        response = make_response(jsonify({
            'user': user.to_dict(),
            'token': token,
            'message': 'Account created successfully'
        }), 201)

        set_access_cookies(response, token)
        return response

    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Registration database error: %s", str(e))
        return jsonify({'error': 'Unable to complete registration. Please try again.'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    ip = _get_client_ip()

    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    remember = bool(data.get('remember', False))

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    rate_key = f"login_{ip}_{email}"
    ip_rate_key = f"login_ip_{ip}"
    max_attempts = current_app.config.get('AUTH_RATE_LIMIT_MAX_ATTEMPTS', 10)
    ip_max_attempts = current_app.config.get('AUTH_IP_RATE_LIMIT_MAX_ATTEMPTS', 30)
    window = current_app.config.get('AUTH_RATE_LIMIT_WINDOW_SECONDS', 900)

    # 1. IP-level brute force protection
    if rate_limiter.is_rate_limited(ip_rate_key, max_attempts=ip_max_attempts, window_seconds=window):
        return jsonify({'error': 'Too many failed sign-in attempts from this network. Please try again in 15 minutes.'}), 429

    # 2. Account-level brute force protection
    if rate_limiter.is_rate_limited(rate_key, max_attempts=max_attempts, window_seconds=window):
        return jsonify({'error': 'Too many failed sign-in attempts. Please try again in 15 minutes.'}), 429

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        rate_limiter.record_attempt(ip_rate_key)
        rate_limiter.record_attempt(rate_key)
        return jsonify({'error': 'Invalid email or password'}), 401

    # Successful login: reset account failed counter
    rate_limiter.reset(rate_key)

    expires_delta = (
        current_app.config.get('JWT_REMEMBER_TOKEN_EXPIRES')
        if remember else
        current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
    )

    token = create_access_token(identity=str(user.id), expires_delta=expires_delta)
    response = make_response(jsonify({
        'user': user.to_dict(),
        'token': token,
        'message': 'Signed in successfully'
    }), 200)

    max_age_seconds = int(expires_delta.total_seconds()) if hasattr(expires_delta, 'total_seconds') else None
    set_access_cookies(response, token, max_age=max_age_seconds)
    return response


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200



@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jwt_data = get_jwt()
    jti = jwt_data.get('jti')
    exp = jwt_data.get('exp')
    user_id_raw = get_jwt_identity()
    user_id = int(user_id_raw) if user_id_raw else None

    if jti:
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc).replace(tzinfo=None) if exp else None
        revoked_token = TokenBlocklist(
            jti=jti,
            token_type=jwt_data.get('type', 'access'),
            user_id=user_id,
            expires_at=expires_at
        )
        db.session.add(revoked_token)
        db.session.commit()

    response = make_response(jsonify({'message': 'Logged out successfully'}), 200)
    unset_jwt_cookies(response)
    return response


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json() or {}

    if 'first_name' in data:
        fn = str(data['first_name']).strip()
        if len(fn) < 2 or len(fn) > 100:
            return jsonify({'error': 'First name must be between 2 and 100 characters'}), 400
        user.first_name = fn

    if 'last_name' in data:
        ln = str(data['last_name']).strip()
        if len(ln) > 100:
            return jsonify({'error': 'Last name cannot exceed 100 characters'}), 400
        user.last_name = ln

    if 'phone' in data:
        ph = str(data['phone']).strip()
        if len(ph) > 25:
            return jsonify({'error': 'Phone number is too long'}), 400
        user.phone = ph

    # If email update requested
    if 'email' in data:
        new_email = str(data['email']).strip().lower()
        if new_email != user.email:
            if not EMAIL_REGEX.match(new_email):
                return jsonify({'error': 'Invalid email format'}), 400
            existing = User.query.filter_by(email=new_email).first()
            if existing and existing.id != user.id:
                return jsonify({'error': 'This email address is already in use by another account'}), 409
            user.email = new_email

    db.session.commit()
    return jsonify({
        'user': user.to_dict(),
        'message': 'Profile updated successfully'
    }), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json() or {}

    current_password = str(data.get('current_password', ''))
    new_password = str(data.get('new_password', ''))
    confirm_password = str(data.get('confirm_password', ''))

    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password are required'}), 400

    if not user.check_password(current_password):
        return jsonify({'error': 'Current password does not match our records'}), 401

    if len(new_password) < 8:
        return jsonify({'error': 'New password must be at least 8 characters long'}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match'}), 400

    user.set_password(new_password)

    # Invalidate previous token and issue refreshed token
    jwt_data = get_jwt()
    jti = jwt_data.get('jti')
    if jti:
        db.session.add(TokenBlocklist(jti=jti, user_id=user.id))

    db.session.commit()

    new_token = create_access_token(identity=str(user.id))
    response = make_response(jsonify({
        'message': 'Password changed successfully',
        'token': new_token,
        'user': user.to_dict()
    }), 200)

    set_access_cookies(response, new_token)
    return response


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    ip = _get_client_ip()

    # Rate limiting: max 5 forgot password requests per 15 min per IP
    if rate_limiter.is_rate_limited(f"pw_reset_{ip}", max_attempts=5, window_seconds=900):
        return jsonify({
            'message': 'If an account exists with this email, instructions have been sent.'
        }), 200

    rate_limiter.record_attempt(f"pw_reset_{ip}")
    email = str(data.get('email', '')).strip().lower()

    # Always return 200 generic message to prevent account enumeration
    generic_success = {
        'message': 'If an account exists with this email, instructions to reset your password have been sent.'
    }

    if not email or not EMAIL_REGEX.match(email):
        return jsonify(generic_success), 200

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify(generic_success), 200

    try:
        # Generate single-use high-entropy token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

        # Invalidate any previously active reset tokens for this user
        PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})

        from datetime import timedelta
        expiration_hours = current_app.config.get('PASSWORD_RESET_TOKEN_EXPIRATION_HOURS', 1)
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        expires_at = now_utc + timedelta(hours=expiration_hours)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False
        )
        db.session.add(reset_record)
        db.session.commit()

        # Build reset URL
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend_url.rstrip('/')}/reset-password/{raw_token}"

        # Dispatch email
        send_password_reset_email(user.email, reset_url, user.first_name)

        return jsonify(generic_success), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Error creating password reset token: %s", str(e))
        return jsonify(generic_success), 200


@auth_bp.route('/verify-reset-token/<token>', methods=['GET'])
def verify_reset_token(token):
    if not token or len(token) < 16:
        return jsonify({'valid': False, 'error': 'Invalid reset link format'}), 400

    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    reset_record = PasswordResetToken.query.filter_by(token_hash=token_hash, used=False).first()

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if not reset_record or reset_record.expires_at < now_utc:
        return jsonify({
            'valid': False,
            'error': 'This password reset link is invalid or has expired. Please request a new one.'
        }), 400

    return jsonify({'valid': True, 'message': 'Reset token is valid'}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = str(data.get('token', '')).strip()
    password = str(data.get('password', ''))
    password_confirmation = str(data.get('password_confirmation', ''))

    if not token or not password:
        return jsonify({'error': 'Token and new password are required'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400

    if password_confirmation and password != password_confirmation:
        return jsonify({'error': 'Passwords do not match'}), 400

    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)

    # Concurrency-safe atomic token consumption:
    # Exactly one concurrent caller will update the record from used=False to used=True
    updated_count = PasswordResetToken.query.filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at >= now_utc
    ).update({'used': True})

    if updated_count == 0:
        return jsonify({
            'error': 'This password reset link is invalid, expired, or has already been used. Please request a new link.'
        }), 400

    try:
        reset_record = PasswordResetToken.query.filter_by(token_hash=token_hash).first()
        user = db.session.get(User, reset_record.user_id)
        if not user:
            db.session.rollback()
            return jsonify({'error': 'Associated user account not found'}), 404

        # set_password updates user.password_hash and user.password_changed_at
        user.set_password(password)

        # Invalidate any other outstanding reset tokens for this user
        PasswordResetToken.query.filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({'used': True})

        db.session.commit()

        return jsonify({
            'message': 'Your password has been successfully reset. You can now sign in with your new credentials.'
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Error resetting password: %s", str(e))
        return jsonify({'error': 'Failed to reset password. Please try again.'}), 500
