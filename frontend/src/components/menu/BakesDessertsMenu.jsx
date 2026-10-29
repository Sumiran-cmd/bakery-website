import { useState, useMemo } from 'react';
import { BAKERY_CATEGORIES, BAKERY_PRODUCTS } from '../../data/bakeryProducts';
import MenuProductCard from './MenuProductCard';
import './BakesDessertsMenu.css';

/**
 * BakesDessertsMenu — the complete Bakes & Desserts page section.
 *
 * Includes:
 *  - Section introduction (heading + description)
 *  - Horizontally-scrollable category filter bar
 *  - Responsive two-column product grid that filters on category click
 */
export default function BakesDessertsMenu() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return BAKERY_PRODUCTS;
    return BAKERY_PRODUCTS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <section className="bakes-section" aria-labelledby="bakes-heading">
      {/* ── Section Introduction ─────────────────────────── */}
      <div className="bakes-intro">
        <div className="container">
          <p className="bakes-eyebrow">From Our Kitchen</p>
          <h1 id="bakes-heading" className="bakes-title">
            Bakes &amp; Desserts
          </h1>
          <p className="bakes-description">
            Handcrafted every morning using carefully sourced ingredients —
            from buttery laminated pastries and rich chocolate confections to
            delicate cakes and savoury bakes, each piece is made to be enjoyed
            the moment it leaves the oven.
          </p>
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────── */}
      <div className="bakes-divider" role="separator" />

      {/* ── Category Filter ───────────────────────────────── */}
      <div className="bakes-filter-wrap">
        <div className="container">
          <nav
            className="bakes-filter-bar"
            aria-label="Filter by category"
            role="tablist"
          >
            {BAKERY_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                id={`bakes-filter-${cat.id}`}
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`bakes-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Product Grid ──────────────────────────────────── */}
      <div className="bakes-grid-wrap">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="bakes-empty" aria-live="polite">
              <p>No items in this category yet. Check back soon.</p>
            </div>
          ) : (
            <div
              className="bakes-grid"
              role="tabpanel"
              aria-live="polite"
              aria-label={`${BAKERY_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? ''} items`}
            >
              {filtered.map((product) => (
                <MenuProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
