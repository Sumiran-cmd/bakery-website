import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { authApi, extractErrorMessage } from '../services/api';
import toast from 'react-hot-toast';
import './AuthPage.css';

// Reusable Brand Visual Sidebar Panel for Desktop
function AuthVisualSidebar({ title, subtitle, badgeText = "Artisan Roastery & Bakery" }) {
  return (
    <div className="auth-visual-panel" aria-hidden="true">
      <img
        src="/images/products/bean-theory-espresso-roast.jpg"
        alt="Bean Theory Artisan Roastery"
        className="auth-visual-bg"
      />
      <div className="auth-visual-overlay" />
      
      <div className="auth-visual-content">
        <div className="auth-visual-brand">
          <span className="visual-logo-brand">Bean</span>
          <span className="visual-logo-sub">THEORY</span>
        </div>

        <div className="auth-visual-quote">
          <div className="visual-pill">
            <Sparkles size={13} />
            <span>{badgeText}</span>
          </div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="auth-visual-footer">
          <div className="visual-perk-item">
            <span className="visual-perk-dot" />
            <span>Single-Origin Himalayan Micro-lots</span>
          </div>
          <div className="visual-perk-item">
            <span className="visual-perk-dot" />
            <span>Freshly Roasted in Kathmandu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. LOGIN PAGE
// ─────────────────────────────────────────────────────────────
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const intendedDestination = location.state?.from?.pathname || '/account';

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(intendedDestination, { replace: true });
    }
  }, [isAuthenticated, navigate, intendedDestination]);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
        remember
      });
      toast.success('Welcome back to Bean Theory!');
      navigate(intendedDestination, { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid email or password');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Visual Brand Side */}
        <AuthVisualSidebar
          title="Elevate Your Daily Ritual"
          subtitle="Sign in to access your curated subscriptions, saved shipping destinations, and recent roastery orders."
          badgeText="Welcome Back"
        />

        {/* Login Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h1>Sign In</h1>
            <p>Welcome back to Bean Theory. Enter your credentials to continue.</p>
          </div>

          {serverError && (
            <div className="auth-alert-banner error" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{serverError}</span>
            </div>
          )}

          <form className="auth-actual-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field-group">
              <label htmlFor="login-email" className="auth-field-label">
                <span>Email Address <span className="auth-required-mark">*</span></span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors(p => ({ ...p, email: null }));
                  }}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className={`auth-input-field ${formErrors.email ? 'has-error' : ''}`}
                  disabled={loading}
                />
              </div>
              {formErrors.email && (
                <span className="auth-field-error" role="alert">
                  <AlertCircle size={13} /> {formErrors.email}
                </span>
              )}
            </div>

            <div className="auth-field-group">
              <label htmlFor="login-password" className="auth-field-label">
                <span>Password <span className="auth-required-mark">*</span></span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors(p => ({ ...p, password: null }));
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className={`auth-input-field has-toggle ${formErrors.password ? 'has-error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-pw-toggle-btn"
                  onClick={() => setShowPw(prev => !prev)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {formErrors.password && (
                <span className="auth-field-error" role="alert">
                  <AlertCircle size={13} /> {formErrors.password}
                </span>
              )}
            </div>

            <div className="auth-form-utilities">
              <label className="auth-remember-label">
                <input
                  type="checkbox"
                  id="login-remember"
                  className="auth-checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-btn-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-panel-footer">
            <p className="auth-switch-text">
              Don't have an account yet?
              <Link to="/register" className="auth-switch-link">
                Create one now
              </Link>
            </p>
            <Link to="/shop" className="auth-guest-cta">
              Continue shopping as guest →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. REGISTRATION PAGE
// ─────────────────────────────────────────────────────────────
export function RegisterPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/account', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const setField = (field) => (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, [field]: val }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.first_name.trim()) {
      errs.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      errs.first_name = 'Must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!formData.password_confirmation) {
      errs.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      errs.password_confirmation = 'Passwords do not match';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation
      });
      toast.success('Welcome to Bean Theory! Your account is ready.');
      navigate('/account');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Registration failed. Please check your information.');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Visual Brand Side */}
        <AuthVisualSidebar
          title="Join the Specialty Coffee Movement"
          subtitle="Enjoy artisanal whole bean offerings, faster checkout, tailored roast recommendations, and member privileges."
          badgeText="Craft Roasted in Nepal"
        />

        {/* Registration Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h1>Create Account</h1>
            <p>Join the Bean Theory community and explore handcrafted Himalayan coffees.</p>
          </div>

          {serverError && (
            <div className="auth-alert-banner error" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{serverError}</span>
            </div>
          )}

          <form className="auth-actual-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid-2">
              <div className="auth-field-group">
                <label htmlFor="reg-first-name" className="auth-field-label">
                  <span>First Name <span className="auth-required-mark">*</span></span>
                </label>
                <input
                  id="reg-first-name"
                  type="text"
                  value={formData.first_name}
                  onChange={setField('first_name')}
                  placeholder="Karma"
                  autoComplete="given-name"
                  required
                  className={`auth-input-field ${formErrors.first_name ? 'has-error' : ''}`}
                  disabled={loading}
                />
                {formErrors.first_name && (
                  <span className="auth-field-error" role="alert">
                    <AlertCircle size={13} /> {formErrors.first_name}
                  </span>
                )}
              </div>

              <div className="auth-field-group">
                <label htmlFor="reg-last-name" className="auth-field-label">
                  <span>Last Name <span className="auth-optional-mark">(optional)</span></span>
                </label>
                <input
                  id="reg-last-name"
                  type="text"
                  value={formData.last_name}
                  onChange={setField('last_name')}
                  placeholder="Gurung"
                  autoComplete="family-name"
                  className="auth-input-field"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="reg-email" className="auth-field-label">
                <span>Email Address <span className="auth-required-mark">*</span></span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={formData.email}
                onChange={setField('email')}
                placeholder="you@domain.com"
                autoComplete="email"
                required
                className={`auth-input-field ${formErrors.email ? 'has-error' : ''}`}
                disabled={loading}
              />
              {formErrors.email && (
                <span className="auth-field-error" role="alert">
                  <AlertCircle size={13} /> {formErrors.email}
                </span>
              )}
            </div>

            <div className="auth-field-group">
              <label htmlFor="reg-phone" className="auth-field-label">
                <span>Phone Number <span className="auth-optional-mark">(optional)</span></span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={formData.phone}
                onChange={setField('phone')}
                placeholder="+977 98XXXXXXXX"
                autoComplete="tel"
                className="auth-input-field"
                disabled={loading}
              />
            </div>

            <div className="form-grid-2">
              <div className="auth-field-group">
                <label htmlFor="reg-password" className="auth-field-label">
                  <span>Password <span className="auth-required-mark">*</span></span>
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="reg-password"
                    type={showPw ? 'text' : 'password'}
                    value={formData.password}
                    onChange={setField('password')}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    required
                    className={`auth-input-field has-toggle ${formErrors.password ? 'has-error' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle-btn"
                    onClick={() => setShowPw(prev => !prev)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {formErrors.password && (
                  <span className="auth-field-error" role="alert">
                    <AlertCircle size={13} /> {formErrors.password}
                  </span>
                )}
              </div>

              <div className="auth-field-group">
                <label htmlFor="reg-confirm-pw" className="auth-field-label">
                  <span>Confirm Password <span className="auth-required-mark">*</span></span>
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="reg-confirm-pw"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={formData.password_confirmation}
                    onChange={setField('password_confirmation')}
                    placeholder="Re-type password"
                    autoComplete="new-password"
                    required
                    className={`auth-input-field has-toggle ${formErrors.password_confirmation ? 'has-error' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle-btn"
                    onClick={() => setShowConfirmPw(prev => !prev)}
                    aria-label={showConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {formErrors.password_confirmation && (
                  <span className="auth-field-error" role="alert">
                    <AlertCircle size={13} /> {formErrors.password_confirmation}
                  </span>
                )}
              </div>
            </div>

            <p className="password-requirements-hint">
              Password must be at least 8 characters long.
            </p>

            <button
              type="submit"
              id="register-submit-btn"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-btn-spinner" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-panel-footer">
            <p className="auth-switch-text">
              Already have a Bean Theory account?
              <Link to="/login" className="auth-switch-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. FORGOT PASSWORD PAGE
// ─────────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSubmitted(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send recovery email. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container single-column">
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <Link to="/login" className="auth-guest-cta" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
            <h1>Reset Password</h1>
            <p>Enter the email address associated with your account, and we'll dispatch password recovery instructions.</p>
          </div>

          {submitted ? (
            <div className="auth-alert-banner success" style={{ flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <CheckCircle size={20} color="#166534" />
                <span>Instructions Dispatched</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: '#166534' }}>
                If an account exists for <strong>{email}</strong>, a secure reset link has been dispatched. Please check your inbox (and spam folder) within the next few minutes.
              </p>
              <div style={{ marginTop: '0.5rem' }}>
                <Link to="/login" className="btn btn-outline btn-sm">
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form className="auth-actual-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="auth-alert-banner error" role="alert">
                  <AlertCircle size={18} className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <div className="auth-field-group">
                <label htmlFor="forgot-email" className="auth-field-label">
                  <span>Registered Email Address <span className="auth-required-mark">*</span></span>
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="auth-input-field"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-btn-spinner" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Recovery Email</span>
                )}
              </button>
            </form>
          )}

          <div className="auth-panel-footer">
            <p className="auth-switch-text">
              Remembered your credentials?
              <Link to="/login" className="auth-switch-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. RESET PASSWORD PAGE
// ─────────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verify token on mount
  useEffect(() => {
    let active = true;
    const checkToken = async () => {
      try {
        const res = await authApi.verifyResetToken(token);
        if (active) {
          setValidToken(res.data.valid);
          setVerifying(false);
        }
      } catch (err) {
        if (active) {
          setValidToken(false);
          setTokenError(extractErrorMessage(err, 'This reset link is invalid or has expired.'));
          setVerifying(false);
        }
      }
    };
    checkToken();
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        password,
        password_confirmation: passwordConfirmation
      });
      toast.success('Password updated successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to reset password. Please request a new link.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container single-column">
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <div className="auth-visual-brand" style={{ marginBottom: '1rem' }}>
              <span className="visual-logo-brand" style={{ color: 'var(--color-espresso)' }}>Bean</span>
              <span className="visual-logo-sub" style={{ color: 'var(--color-terracotta)' }}>THEORY</span>
            </div>
            <h1>Choose New Password</h1>
            <p>Please enter and confirm a new secure password for your account.</p>
          </div>

          {verifying ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#635853' }}>
              <div className="auth-btn-spinner" style={{ borderColor: 'rgba(184, 93, 58, 0.3)', borderTopColor: '#B85D3A', margin: '0 auto 1rem auto' }} />
              <p>Verifying your reset token...</p>
            </div>
          ) : !validToken ? (
            <div className="auth-alert-banner error" style={{ flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <AlertCircle size={20} />
                <span>Link Expired or Invalid</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{tokenError}</p>
              <div style={{ marginTop: '0.5rem' }}>
                <Link to="/forgot-password" className="btn btn-primary btn-sm">
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : (
            <form className="auth-actual-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="auth-alert-banner error" role="alert">
                  <AlertCircle size={18} className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <div className="auth-field-group">
                <label htmlFor="new-password" className="auth-field-label">
                  <span>New Password <span className="auth-required-mark">*</span></span>
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="new-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    required
                    className="auth-input-field has-toggle"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle-btn"
                    onClick={() => setShowPw(prev => !prev)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label htmlFor="confirm-new-password" className="auth-field-label">
                  <span>Confirm New Password <span className="auth-required-mark">*</span></span>
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="confirm-new-password"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Re-type password"
                    autoComplete="new-password"
                    required
                    className="auth-input-field has-toggle"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle-btn"
                    onClick={() => setShowConfirmPw(prev => !prev)}
                    aria-label={showConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-btn-spinner" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password & Sign In</span>
                )}
              </button>
            </form>
          )}

          <div className="auth-panel-footer">
            <Link to="/login" className="auth-guest-cta">
              <ArrowLeft size={16} /> Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
