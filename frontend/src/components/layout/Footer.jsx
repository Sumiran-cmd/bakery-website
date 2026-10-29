import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import './Footer.css';

function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function FacebookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  );
}

const FOOTER_LINKS = {
  Shop: [
    { label: 'Shop All', href: '/shop' },
    { label: 'Whole Bean', href: '/shop?category=whole-bean' },
    { label: 'Ground Coffee', href: '/shop?category=ground-coffee' },
    { label: 'Espresso', href: '/shop?category=espresso' },
    { label: 'Single Origin', href: '/shop?category=single-origin' },
    { label: 'Accessories', href: '/shop?category=accessories' },
  ],
  Company: [
    { label: 'Our Story', href: '/our-story' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Locations', href: '/locations' },
    { label: 'The Theory', href: '/about' },
    { label: 'Blog', href: '/blog' },
  ],
  Help: [
    { label: 'My Account', href: '/account' },
    { label: 'Order Tracking', href: '/orders' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact Us', href: '/contact' },
  ],
};

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      {/* Newsletter */}
      <div className="footer-newsletter">
        <div className="container">
          <div className="newsletter-inner">
            <div className="newsletter-text">
              <h3>Stay in the loop.</h3>
              <p>Get updates on new beans, brewing guides, and exclusive offers.</p>
            </div>
            <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="newsletter-input"
                aria-label="Email for newsletter"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Brand column */}
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-brand">Bean</span>
                <span className="logo-sub">THEORY</span>
              </div>
              <p className="footer-tagline">
                It's not just about coffee,<br />it's all about coffee.
              </p>
              <div className="footer-contact">
                <a href="mailto:hello@beantheory.com.np" className="footer-contact-item">
                  <Mail size={14} />
                  hello@beantheory.com.np
                </a>
                <a href="tel:+977-1-4000000" className="footer-contact-item">
                  <Phone size={14} />
                  +977-1-4000000
                </a>
                <div className="footer-contact-item">
                  <MapPin size={14} />
                  Jhamsikhel, Lalitpur, Nepal
                </div>
              </div>
              <div className="footer-social">
                <a href="https://instagram.com/beantheorycoffee" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
                  <InstagramIcon size={18} />
                </a>
                <a href="https://facebook.com/beantheorycoffee" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-link">
                  <FacebookIcon size={18} />
                </a>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading} className="footer-column">
                <h4 className="footer-heading">{heading}</h4>
                <ul className="footer-link-list">
                  {links.map(link => (
                    <li key={link.label}>
                      <Link to={link.href} className="footer-link">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-inner">
            <p className="footer-copyright">
              © {CURRENT_YEAR} Bean Theory Nepal. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
