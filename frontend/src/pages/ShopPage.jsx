import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, X, Search, Package } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/products/ProductCard';
import { productsApi } from '../services/api';
import './ShopPage.css';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Featured' },
  { value: 'newest',     label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc',   label: 'Name: A–Z' },
  { value: 'name_desc',  label: 'Name: Z–A' },
];

const DEFAULT_CATEGORIES = [
  { name: 'Whole Bean', slug: 'whole-bean' },
  { name: 'Ground Coffee', slug: 'ground-coffee' },
  { name: 'Espresso', slug: 'espresso' },
  { name: 'Filter Coffee', slug: 'filter-coffee' },
  { name: 'Single Origin', slug: 'single-origin' },
  { name: 'Accessories', slug: 'accessories' },
];

const PER_PAGE = 12;

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Controlled state from URL
  const activeCategory = searchParams.get('category') || 'all';
  const activeSort    = searchParams.get('sort') || 'default';
  const activePage    = parseInt(searchParams.get('page') || '1', 10);
  const activeSearch  = searchParams.get('search') || '';

  const updateParam = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'all' || value === 'default' || value === '1') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      if (key !== 'page') next.delete('page'); // Reset page on filter change
      return next;
    });
  }, [setSearchParams]);

  // Fetch categories once
  useEffect(() => {
    productsApi.getCategories()
      .then(res => {
        if (res.data?.categories?.length) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch products when params change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const params = {
      page: activePage,
      per_page: PER_PAGE,
      ...(activeCategory !== 'all' && { category: activeCategory }),
      ...(activeSort !== 'default' && { sort: activeSort }),
      ...(activeSearch && { search: activeSearch }),
    };

    productsApi.getAll(params)
      .then(res => {
        if (!cancelled) {
          const items = res.data.products || [];
          setProducts(items);
          setPagination(res.data.pagination);
          setError(null);

          // If requested page had no items but catalogue has items, auto-reset page to 1
          if (items.length === 0 && res.data.pagination?.total > 0 && activePage > 1) {
            updateParam('page', '1');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProducts([]);
          setError(err);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCategory, activeSort, activePage, activeSearch, retry, updateParam]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeSortLabel = SORT_OPTIONS.find(o => o.value === activeSort)?.label || 'Featured';

  const hasActiveFilters = activeCategory !== 'all' || activeSearch;
  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="shop-page">
      {/* Page Hero */}
      <div className="shop-hero">
        <div className="container">
          <div className="shop-hero-content">
            <p className="shop-hero-eyebrow">Premium Nepali Coffee</p>
            <h1 className="shop-hero-title">Shop All</h1>
            <p className="shop-hero-sub">
              Transparently sourced from small cooperatives and farming families across Nepal
            </p>
          </div>
        </div>
      </div>

      <div className="container shop-container">
        {/* Category Pills */}
        <div className="category-pills-wrap">
          <div className="category-pills" role="tablist" aria-label="Filter by category">
            <button
              role="tab"
              aria-selected={activeCategory === 'all'}
              className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => updateParam('category', 'all')}
            >
              All Products
            </button>
            {categories.map(cat => (
              <button
                key={cat.slug}
                role="tab"
                aria-selected={activeCategory === cat.slug}
                className={`category-pill ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => updateParam('category', cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="shop-toolbar">
          <div className="shop-toolbar-left">
            {/* Active filter pills */}
            {activeSearch && (
              <div className="active-filter-pill">
                <Search size={12} />
                {activeSearch}
                <button
                  onClick={() => updateParam('search', '')}
                  aria-label="Remove search filter"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {activeCategory !== 'all' && (
              <div className="active-filter-pill">
                {categories.find(c => c.slug === activeCategory)?.name || activeCategory}
                <button onClick={() => updateParam('category', 'all')} aria-label="Remove category filter">
                  <X size={12} />
                </button>
              </div>
            )}
            {hasActiveFilters && (
              <button className="clear-all-btn" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>

          <div className="shop-toolbar-right">
            {pagination && (
              <span className="product-count">
                {pagination.total} product{pagination.total !== 1 ? 's' : ''}
              </span>
            )}
            {/* Sort dropdown */}
            <div className="sort-dropdown-wrap" ref={sortRef}>
              <button
                className="sort-dropdown-btn"
                onClick={() => setSortOpen(p => !p)}
                aria-expanded={sortOpen}
                aria-haspopup="listbox"
              >
                Sort: {activeSortLabel}
                <ChevronDown size={14} className={sortOpen ? 'rotated' : ''} />
              </button>
              {sortOpen && (
                <ul className="sort-dropdown-menu" role="listbox" aria-label="Sort options">
                  {SORT_OPTIONS.map(opt => (
                    <li key={opt.value} role="option" aria-selected={activeSort === opt.value}>
                      <button
                        className={`sort-option ${activeSort === opt.value ? 'active' : ''}`}
                        onClick={() => { updateParam('sort', opt.value); setSortOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="shop-grid-section">
          {loading ? (
            <div className="product-grid" aria-busy="true">
              {[...Array(PER_PAGE)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="shop-empty">
              <div className="shop-empty-icon">
                <Package size={56} strokeWidth={1.2} />
              </div>
              <h2>Unable to load products</h2>
              <p>There was a connection issue loading the coffee catalog. Please try again.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setRetry(r => r + 1)}>
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="shop-empty">
              <div className="shop-empty-icon">
                <Package size={56} strokeWidth={1.2} />
              </div>
              <h2>No products found</h2>
              <p>
                {activeSearch
                  ? `No results for "${activeSearch}". Try a different search.`
                  : 'No products match your current filters.'}
              </p>
              <button className="btn btn-primary btn-sm" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination && pagination.pages > 1 && (
          <Pagination
            pagination={pagination}
            onPageChange={(page) => updateParam('page', String(page))}
          />
        )}
      </div>
    </div>
  );
}

function Pagination({ pagination, onPageChange }) {
  const { page, pages } = pagination;
  const getPages = () => {
    const arr = [];
    for (let i = 1; i <= pages; i++) {
      if (
        i === 1 || i === pages ||
        (i >= page - 2 && i <= page + 2)
      ) {
        arr.push(i);
      } else if (arr[arr.length - 1] !== '...') {
        arr.push('...');
      }
    }
    return arr;
  };

  return (
    <nav className="pagination" aria-label="Product page navigation">
      <button
        className="page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={!pagination.has_prev}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      <div className="page-numbers">
        {getPages().map((p, i) => (
          p === '...'
            ? <span key={`dot-${i}`} className="page-dots">...</span>
            : (
              <button
                key={p}
                className={`page-num ${p === page ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
        ))}
      </div>
      <button
        className="page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={!pagination.has_next}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
