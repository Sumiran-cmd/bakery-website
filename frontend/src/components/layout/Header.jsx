import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import SearchOverlay from './SearchOverlay';
import './Header.css';

const NAV_ITEMS = [
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'Our Story', href: '/our-story' },
      { label: 'The Theory', href: '/about' },
    ]
  },
  {
    label: 'Menu',
    href: '/menu',
    children: [
      { label: 'Bakes & Desserts', href: '/menu/bakes' },
      { label: 'Coffee & Drinks', href: '/menu/drinks' },
      { label: 'Food & Snacks', href: '/menu/food' },
    ]
  },
  { label: 'Locations', href: '/locations' },
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'Shop All', href: '/shop' },
      { label: 'Whole Bean', href: '/shop?category=whole-bean' },
      { label: 'Ground Coffee', href: '/shop?category=ground-coffee' },
      { label: 'Espresso', href: '/shop?category=espresso' },
      { label: 'Single Origin', href: '/shop?category=single-origin' },
      { label: 'Accessories', href: '/shop?category=accessories' },
    ]
  },
  {
    label: 'Explore',
    href: '/explore',
    children: [
      { label: 'Blog', href: '/blog' },
      { label: 'Sustainability', href: '/sustainability' },
    ]
  },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { itemCount, toggleCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const headerRef = useRef(null);
  const dropdownTimer = useRef(null);


  const isHome = location.pathname === '/';

  const isItemActive = (item) => {
    if (item.href === '/menu') {
      return location.pathname.startsWith('/menu');
    }
    if (item.href === '/shop') {
      return location.pathname.startsWith('/shop');
    }
    if (item.href === '/about') {
      return location.pathname === '/about' || location.pathname === '/our-story' || location.pathname === '/the-theory';
    }
    return location.pathname === item.href;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 992) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleDropdownEnter = (label) => {
    clearTimeout(dropdownTimer.current);
    setActiveDropdown(label);
  };
  const handleDropdownLeave = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`site-header ${isHome ? 'is-home' : ''} ${scrolled ? 'scrolled' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        role="banner"
      >
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="header-logo" aria-label="Bean Theory – Home">
            <div className="logo-text">
              <span className="logo-brand">Bean</span>
              <span className="logo-sub">THEORY</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav" role="navigation" aria-label="Main navigation">
            <ul className="nav-list">
              {NAV_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className={`nav-item ${item.children ? 'has-dropdown' : ''}`}
                  onMouseEnter={() => item.children && handleDropdownEnter(item.label)}
                  onMouseLeave={() => item.children && handleDropdownLeave()}
                >
                  <Link
                    to={item.href}
                    className={`nav-link ${isItemActive(item) ? 'active' : ''} ${activeDropdown === item.label ? 'dropdown-open' : ''}`}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown size={14} className={`nav-chevron ${activeDropdown === item.label ? 'open' : ''}`} />
                    )}
                  </Link>
                  {item.children && activeDropdown === item.label && (
                    <div className="nav-dropdown">
                      <ul>
                        {item.children.map(child => (
                          <li key={child.label}>
                            <Link
                              to={child.href}
                              className={`dropdown-link ${location.pathname === child.href ? 'active' : ''}`}
                              onClick={() => setActiveDropdown(null)}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            <button
              id="header-search-btn"
              className="header-icon-btn"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={20} strokeWidth={1.8} />
            </button>

            <Link
              to={isAuthenticated ? '/account' : '/login'}
              className="header-icon-btn"
              aria-label={isAuthenticated ? 'My account' : 'Sign in'}
              title={isAuthenticated && user?.first_name ? `Account (${user.first_name})` : 'Sign in'}
            >
              <User size={20} strokeWidth={1.8} />
            </Link>

            <button
              id="header-cart-btn"
              className="header-icon-btn cart-btn"
              aria-label={`Shopping cart — ${itemCount} items`}
              onClick={toggleCart}
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              {itemCount > 0 && (
                <span className="cart-badge" aria-live="polite">{itemCount}</span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-btn"
              className="header-icon-btn mobile-menu-btn"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(p => !p)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}>
        <nav aria-label="Mobile navigation">
          <ul className="mobile-nav-list">
            {NAV_ITEMS.map((item) => (
              <MobileNavItem
                key={item.label}
                item={item}
                isActive={isItemActive(item)}
                currentPath={location.pathname}
                onClose={() => setMobileOpen(false)}
              />
            ))}
          </ul>
        </nav>
      </div>

      {mobileOpen && (
        <div
          className="mobile-overlay"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function MobileNavItem({ item, isActive, currentPath, onClose }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="mobile-nav-item">
      <div className="mobile-nav-row">
        <Link
          to={item.href}
          className={`mobile-nav-link ${isActive ? 'active' : ''}`}
          onClick={item.children ? undefined : onClose}
        >
          {item.label}
        </Link>
        {item.children && (
          <button
            className="mobile-nav-toggle"
            aria-expanded={open}
            onClick={() => setOpen(p => !p)}
            aria-label={`Toggle ${item.label} submenu`}
          >
            <ChevronDown size={16} className={open ? 'rotated' : ''} />
          </button>
        )}
      </div>
      {item.children && open && (
        <ul className="mobile-subnav">
          {item.children.map(child => (
            <li key={child.label}>
              <Link
                to={child.href}
                className={`mobile-subnav-link ${currentPath === child.href ? 'active' : ''}`}
                onClick={onClose}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
