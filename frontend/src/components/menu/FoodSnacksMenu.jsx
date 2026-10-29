import { useState, useMemo } from 'react';
import { FOOD_CATEGORIES, FOOD_PRODUCTS } from '../../data/foodProducts';
import FoodSnackCard from './FoodSnackCard';
import './FoodSnacksMenu.css';

/**
 * FoodSnacksMenu — the complete Food & Snacks menu section.
 *
 * Includes:
 *  - Section introduction (heading + description)
 *  - Horizontally-scrollable category filter bar
 *  - Responsive two-column product grid that filters on category click
 */
export default function FoodSnacksMenu() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return FOOD_PRODUCTS;
    return FOOD_PRODUCTS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <section className="food-section" aria-labelledby="food-heading">
      {/* ── Section Introduction ────────────────────────────── */}
      <div className="food-intro">
        <div className="container">
          <p className="food-eyebrow">From Our Kitchen</p>
          <h1 id="food-heading" className="food-title">
            Food &amp; Snacks
          </h1>
          <p className="food-description">
            Simple, honest food made with seasonal ingredients and a great deal
            of care. Whether you are fuelling your morning with a full
            breakfast, settling in for a long work session, or grazing through
            an afternoon — our kitchen keeps pace with you.
          </p>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div className="food-divider" role="separator" />

      {/* ── Category Filter ─────────────────────────────────── */}
      <div className="food-filter-wrap">
        <div className="container">
          <nav
            className="food-filter-bar"
            aria-label="Filter by food type"
            role="tablist"
          >
            {FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                id={`food-filter-${cat.id}`}
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`food-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Product Grid ─────────────────────────────────────── */}
      <div className="food-grid-wrap">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="food-empty" aria-live="polite">
              <p>Nothing in this category yet — check back soon.</p>
            </div>
          ) : (
            <div
              className="food-grid"
              role="tabpanel"
              aria-live="polite"
              aria-label={`${FOOD_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? ''} items`}
            >
              {filtered.map((product) => (
                <FoodSnackCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
