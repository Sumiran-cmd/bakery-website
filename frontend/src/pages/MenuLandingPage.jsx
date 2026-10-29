import { useEffect } from 'react';
import { Sparkles, Clock, HeartHandshake, Coffee } from 'lucide-react';
import MenuCategoryGrid from '../components/menu/MenuCategoryGrid';
import { MENU_CATEGORIES } from '../data/menuCategories';
import '../styles/menu-landing.css';

/**
 * MenuLandingPage — Dedicated category selection hub at /menu
 * Provides visitors with a visual overview of Bean Theory's 3 primary offerings:
 * Bakes & Desserts, Coffee & Drinks, and Food & Snacks.
 */
export default function MenuLandingPage() {
  useEffect(() => {
    document.title = 'Explore Our Menu | Bean Theory — Coffee & Bakery Nepal';
  }, []);

  return (
    <div className="menu-landing-page">
      {/* Editorial Page Header */}
      <header className="menu-landing-hero">
        <div className="menu-hero-pill">
          <Sparkles size={13} />
          <span>Curated Offerings</span>
        </div>
        <h1 className="menu-hero-title">Explore Our Menu</h1>
        <p className="menu-hero-tagline">“Something wonderful for every craving.”</p>
        <p className="menu-hero-desc">
          From freshly baked artisan treats to carefully crafted specialty brews and satisfying savoury bites, discover your next favourite taste at Bean Theory.
        </p>
      </header>

      {/* Primary Category Selection Grid */}
      <MenuCategoryGrid categories={MENU_CATEGORIES} />

      {/* Bean Theory Quality Reassurance Banner */}
      <section className="menu-features-banner" aria-label="Our Craft Commitment">
        <div className="menu-features-inner">
          <div className="menu-feature-item">
            <div className="menu-feature-icon">
              <Clock size={22} strokeWidth={1.8} />
            </div>
            <div className="menu-feature-text">
              <h4>Baked Fresh Every Dawn</h4>
              <p>Our slow-fermented croissants, sourdough, and sweet treats come hot from the oven every morning.</p>
            </div>
          </div>

          <div className="menu-feature-item">
            <div className="menu-feature-icon">
              <Coffee size={22} strokeWidth={1.8} />
            </div>
            <div className="menu-feature-text">
              <h4>Himalayan Specialty Coffee</h4>
              <p>Single-origin arabica roasted in micro-batches and pulled on custom precision espresso machinery.</p>
            </div>
          </div>

          <div className="menu-feature-item">
            <div className="menu-feature-icon">
              <HeartHandshake size={22} strokeWidth={1.8} />
            </div>
            <div className="menu-feature-text">
              <h4>All-Day Kitchen Bites</h4>
              <p>Wholesome sandwiches, toasts, and nourishing bowls made with locally sourced Himalayan produce.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
