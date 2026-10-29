import { useState, useMemo } from 'react';
import { DRINKS_CATEGORIES, DRINKS_PRODUCTS } from '../../data/drinksProducts';
import DrinkProductCard from './DrinkProductCard';
import './CoffeeDrinksMenu.css';

/**
 * CoffeeDrinksMenu — the complete Coffee & Drinks menu section.
 *
 * Includes:
 *  - Section introduction (heading + description)
 *  - Horizontally-scrollable category filter bar
 *  - Responsive two-column product grid that filters on category click
 */
export default function CoffeeDrinksMenu() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return DRINKS_PRODUCTS;
    return DRINKS_PRODUCTS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <section className="drinks-section" aria-labelledby="drinks-heading">
      {/* ── Section Introduction ───────────────────────────── */}
      <div className="drinks-intro">
        <div className="container">
          <p className="drinks-eyebrow">Our Brew Bar</p>
          <h1 id="drinks-heading" className="drinks-title">
            Coffee &amp; Drinks
          </h1>
          <p className="drinks-description">
            Every cup begins with a single-origin Nepali bean, roasted in small
            batches and prepared to order. Whether you prefer the clarity of a
            slow pour-over, the boldness of a ristretto, or something entirely
            your own — our baristas are here to craft it for you.
          </p>
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────── */}
      <div className="drinks-divider" role="separator" />

      {/* ── Category Filter ────────────────────────────────── */}
      <div className="drinks-filter-wrap">
        <div className="container">
          <nav
            className="drinks-filter-bar"
            aria-label="Filter by drink type"
            role="tablist"
          >
            {DRINKS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                id={`drinks-filter-${cat.id}`}
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`drinks-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Product Grid ───────────────────────────────────── */}
      <div className="drinks-grid-wrap">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="drinks-empty" aria-live="polite">
              <p>No drinks in this category yet. Check back soon.</p>
            </div>
          ) : (
            <div
              className="drinks-grid"
              role="tabpanel"
              aria-live="polite"
              aria-label={`${DRINKS_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? ''} drinks`}
            >
              {filtered.map((product) => (
                <DrinkProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
