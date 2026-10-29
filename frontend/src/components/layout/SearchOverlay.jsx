import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../../services/api';
import ImagePlaceholder from '../common/ImagePlaceholder';
import './SearchOverlay.css';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const abortRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Escape key closes overlay
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Search on debounced query change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    productsApi.getAll({ search: debouncedQuery, per_page: 6 })
      .then(res => { if (!controller.signal.aborted) setResults(res.data.products || []); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleResultClick = (slug) => {
    navigate(`/products/${slug}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <div className="search-overlay-bg" onClick={onClose} aria-hidden="true" />
      <div className="search-overlay-panel">
        <form className="search-form" onSubmit={handleSubmit} role="search">
          <Search size={20} className="search-icon-left" aria-hidden="true" />
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            placeholder="Search coffees, accessories..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input"
            autoComplete="off"
            aria-label="Search"
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
          <button type="submit" className="search-submit" aria-label="Submit search">
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Results */}
        {query && (
          <div className="search-results">
            {loading && (
              <div className="search-loading">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="search-result-skeleton">
                    <div className="skeleton" style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 14, width: '60%' }} />
                      <div className="skeleton" style={{ height: 12, width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && results.length === 0 && debouncedQuery && (
              <div className="search-empty">
                <p>No products found for "<strong>{debouncedQuery}</strong>"</p>
              </div>
            )}
            {!loading && results.length > 0 && (
              <>
                <p className="search-results-count">{results.length} product{results.length !== 1 ? 's' : ''} found</p>
                <ul className="search-result-list">
                  {results.map(product => (
                    <li key={product.id}>
                      <button className="search-result-item" onClick={() => handleResultClick(product.slug)}>
                        <div className="search-result-img">
                          <ImagePlaceholder
                            src={product.primary_image}
                            alt={product.name}
                            aspectRatio="1/1"
                          />
                        </div>
                        <div className="search-result-info">
                          <span className="search-result-name">{product.name}</span>
                          <span className="search-result-cat">{product.category}</span>
                        </div>
                        <span className="search-result-price">
                          Rs. {product.base_price?.toLocaleString()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="search-view-all"
                  onClick={() => { navigate(`/shop?search=${encodeURIComponent(query)}`); onClose(); }}
                >
                  View all results
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
