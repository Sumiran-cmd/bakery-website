import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, MapPin, LogOut, Shield, 
  ExternalLink, Calendar, Coffee, Plus, Check, 
  Trash2, AlertCircle, Edit2, Eye, EyeOff, X 
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { ordersApi, addressesApi, extractErrorMessage } from '../services/api';
import toast from 'react-hot-toast';
import './AccountPage.css';

export default function AccountPage() {
  const { user, logout, updateProfile, changePassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    street: '',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati Province',
    is_default: false
  });

  // Profile Edit State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // Initialize profile form when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError('');
    try {
      const res = await ordersApi.getAll();
      setOrders(res.data.orders || []);
    } catch (err) {
      setOrdersError(extractErrorMessage(err, 'Failed to retrieve order history.'));
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Fetch Addresses
  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const res = await addressesApi.getAll();
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.warn('Failed to load addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchAddresses();
    }
  }, [isAuthenticated, fetchOrders, fetchAddresses]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Add Address Handler
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.full_name.trim() || !newAddress.phone.trim() || !newAddress.street.trim()) {
      toast.error('Please fill in all required address fields');
      return;
    }

    setSubmittingAddress(true);
    try {
      const res = await addressesApi.create(newAddress);
      toast.success('Address saved successfully');
      setAddresses(prev => [res.data.address, ...prev]);
      setShowAddressModal(false);
      setNewAddress({
        label: 'Home',
        full_name: '',
        phone: '',
        street: '',
        city: 'Kathmandu',
        district: 'Kathmandu',
        province: 'Bagmati Province',
        is_default: false
      });
      fetchAddresses();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to save address'));
    } finally {
      setSubmittingAddress(false);
    }
  };

  // Set Default Address Handler
  const handleSetDefaultAddress = async (id) => {
    try {
      await addressesApi.setDefault(id);
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      toast.success('Default delivery address updated');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not update default address'));
    }
  };

  // Delete Address Handler
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressesApi.delete(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address removed');
      fetchAddresses();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not delete address'));
    }
  };

  // Profile Update Handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.first_name.trim()) {
      toast.error('First name is required');
      return;
    }

    setSubmittingProfile(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated successfully');
      setShowProfileModal(false);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');

    if (!currentPassword) {
      setPwError('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setChangingPw(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to change password. Verify your current password.');
      setPwError(msg);
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        {/* Profile Header */}
        <div className="account-profile-header card">
          <div className="profile-avatar">
            {(user?.first_name?.[0] || 'K').toUpperCase()}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">
              {user?.first_name} {user?.last_name || ''}
            </h1>
            <p className="profile-email">{user?.email}</p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="member-badge">
                <Coffee size={13} /> Bean Theory Guild Member
              </span>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="btn btn-sm btn-ghost"
                style={{ fontSize: '12px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Edit2 size={12} /> Edit Profile
              </button>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-outline logout-btn">
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {/* Tab Layout */}
        <div className="account-grid">
          {/* Navigation Sidebar */}
          <aside className="account-nav card" aria-label="Account navigation">
            <button
              className={`nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} />
              <span>Orders & History</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={18} />
              <span>Saved Addresses</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              <Coffee size={18} />
              <span>Coffee Club & Roasts</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} />
              <span>Account Security</span>
            </button>
          </aside>

          {/* Content Area */}
          <main className="account-content">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h2>Order History</h2>
                  <p>Track current orders or re-order your favorite roasts</p>
                </div>

                {loadingOrders ? (
                  <div className="loading-state card" style={{ padding: '2rem', textAlign: 'center' }}>
                    Loading orders...
                  </div>
                ) : ordersError ? (
                  <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <AlertCircle size={32} color="#C62828" style={{ margin: '0 auto 0.5rem auto' }} />
                    <p style={{ color: '#C62828', marginBottom: '1rem' }}>{ordersError}</p>
                    <button onClick={fetchOrders} className="btn btn-sm btn-outline">
                      Retry Loading Orders
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="empty-orders card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Package size={42} style={{ color: '#9C9189', margin: '0 auto 1rem auto' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No orders placed yet</h3>
                    <p style={{ color: '#635853', maxWidth: '380px', margin: '0 auto 1.5rem auto' }}>
                      Experience the distinctive aroma and brightness of freshly roasted high-altitude Himalayan Arabica.
                    </p>
                    <Link to="/shop" className="btn btn-primary btn-sm">Explore Specialty Shop</Link>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map((ord) => (
                      <div key={ord.id} className="order-item-card card">
                        <div className="order-card-header">
                          <div>
                            <span className="order-id-label">{ord.order_number}</span>
                            <span className="order-date-label">
                              <Calendar size={13} /> {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="order-status-group">
                            <span className={`status-pill status-${ord.status}`}>
                              {ord.status?.toUpperCase() || 'PENDING'}
                            </span>
                            <span className="order-total-price">
                              Rs. {(ord.total || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="order-card-items">
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="order-line-row">
                              <div>
                                <strong>{it.product_name}</strong>
                                <span className="variant-tag">{it.variant_name}</span>
                              </div>
                              <span className="line-qty">Qty: {it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="order-card-footer">
                          <Link
                            to={`/order-confirmation/${ord.order_number}`}
                            className="btn btn-sm btn-outline"
                          >
                            <ExternalLink size={14} /> View Details
                          </Link>
                          <Link to="/shop" className="btn btn-sm btn-secondary">
                            Reorder Roasts
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="tab-pane">
                <div className="pane-header flex-header">
                  <div>
                    <h2>Saved Addresses</h2>
                    <p>Manage your delivery destinations across Nepal</p>
                  </div>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="btn btn-sm btn-primary"
                  >
                    <Plus size={15} /> Add Address
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    Loading addresses...
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <MapPin size={40} style={{ color: '#9C9189', margin: '0 auto 1rem auto' }} />
                    <h3>No saved addresses</h3>
                    <p style={{ color: '#635853', marginBottom: '1.5rem' }}>
                      Save your home, studio, or office address for seamless one-click checkout.
                    </p>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus size={15} /> Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="address-grid">
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`address-card card ${addr.is_default ? 'is-default' : ''}`}>
                        <div className="address-card-header">
                          <span className="address-tag-badge">{addr.label || 'Home'}</span>
                          {addr.is_default && (
                            <span className="default-pill">
                              <Check size={12} /> Default
                            </span>
                          )}
                        </div>
                        <h4 className="address-name">{addr.full_name}</h4>
                        <p className="address-text">{addr.street}</p>
                        <p className="address-text">{addr.city}, {addr.province}</p>
                        <p className="address-phone">{addr.phone}</p>

                        <div className="address-card-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {!addr.is_default ? (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="btn btn-sm btn-ghost"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 600 }}>Default Shipping</span>
                          )}

                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="btn btn-sm btn-ghost"
                            style={{ color: '#C62828' }}
                            title="Delete address"
                            aria-label={`Delete address ${addr.label}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Address Modal */}
                {showAddressModal && (
                  <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal-box card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="modal-title" style={{ margin: 0 }}>Add New Delivery Address</h3>
                        <button
                          type="button"
                          onClick={() => setShowAddressModal(false)}
                          className="btn btn-ghost"
                          style={{ padding: '4px' }}
                          aria-label="Close modal"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleAddAddress} className="modal-form">
                        <div className="form-group">
                          <label>Address Label (e.g., Home, Studio, Office)</label>
                          <input
                            type="text"
                            value={newAddress.label}
                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                            placeholder="Home, Office, Roastery Studio"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newAddress.full_name}
                            onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                            placeholder="Full name of recipient"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            placeholder="+977 98XXXXXXXX"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Street Address & Landmark *</label>
                          <input
                            type="text"
                            required
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            placeholder="e.g., House 14, Jhamsikhel Marg"
                            className="form-input"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label>City *</label>
                            <input
                              type="text"
                              required
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>District *</label>
                            <input
                              type="text"
                              required
                              value={newAddress.district}
                              onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Province *</label>
                          <input
                            type="text"
                            required
                            value={newAddress.province}
                            onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                            className="form-input"
                          />
                        </div>

                        <div className="modal-btn-row">
                          <button
                            type="button"
                            onClick={() => setShowAddressModal(false)}
                            className="btn btn-outline"
                            disabled={submittingAddress}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submittingAddress}
                          >
                            {submittingAddress ? 'Saving...' : 'Save Address'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Coffee Club & Roasts Tab */}
            {activeTab === 'subscription' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h2>Bean Theory Coffee Club</h2>
                  <p>Freshly roasted single-origin beans delivered directly to your doorstep</p>
                </div>

                <div className="club-promo-card card">
                  <div className="club-promo-content">
                    <span className="roastery-tag">Artisanal Roaster's Choice</span>
                    <h3>Never Run Out of Fresh Specialty Coffee</h3>
                    <p>
                      Receive 2 x 250g bags of freshly harvested, small-batch roasted Nepali Arabica every month with complimentary shipping anywhere in Nepal.
                    </p>
                    <ul className="club-perks">
                      <li>✓ Roasted within 48 hours of dispatch</li>
                      <li>✓ Exclusive micro-lots from Ilam, Kavre & Nuwakot</li>
                      <li>✓ 15% subscriber savings on all brewing gear</li>
                    </ul>
                    <Link to="/shop" className="btn btn-primary">
                      Subscribe for Rs. 1,950 / month
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h2>Account Security</h2>
                  <p>Manage your password and authentication credentials</p>
                </div>

                <form className="security-form card" onSubmit={handleChangePassword} noValidate>
                  {pwError && (
                    <div className="auth-alert-banner error" style={{ margin: 0 }}>
                      <AlertCircle size={16} />
                      <span>{pwError}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Current Email</label>
                    <input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      className="input-disabled form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sec-current-pw">Current Password *</label>
                    <div className="password-wrap" style={{ position: 'relative' }}>
                      <input
                        id="sec-current-pw"
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="form-input"
                        autoComplete="current-password"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowCurrentPw(p => !p)}
                        aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="sec-new-pw">New Password * (Min. 8 characters)</label>
                    <div className="password-wrap" style={{ position: 'relative' }}>
                      <input
                        id="sec-new-pw"
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="form-input"
                        autoComplete="new-password"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowNewPw(p => !p)}
                        aria-label={showNewPw ? 'Hide password' : 'Show password'}
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="sec-confirm-pw">Confirm New Password *</label>
                    <input
                      id="sec-confirm-pw"
                      type={showNewPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="form-input"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={changingPw}
                  >
                    {changingPw ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-box card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Update Profile</h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="btn btn-ghost"
                style={{ padding: '4px' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="modal-form">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+977 98XXXXXXXX"
                  className="form-input"
                />
              </div>

              <div className="modal-btn-row">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="btn btn-outline"
                  disabled={submittingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingProfile}
                >
                  {submittingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
