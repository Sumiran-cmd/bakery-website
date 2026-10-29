import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import ImagePlaceholder from '../common/ImagePlaceholder';
import './ProductCard.css';

/**
 * ProductCard — the primary product display component.
 * Matches Bean Theory's product grid layout: image on top, info below.
 */
export default function ProductCard({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.find(v => v.in_stock) || product.variants?.[0]
  );
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();

  if (!product) return null;

  const hasMultipleVariants = product.variants?.length > 1;
  const isOnSale = selectedVariant?.compare_at_price > selectedVariant?.price;
  const inStock = selectedVariant?.in_stock;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!selectedVariant || adding || !inStock) return;
    setAdding(true);
    await addToCart(product.id, selectedVariant.id, 1);
    setAdding(false);
  };

  return (
    <article className="product-card" aria-label={product.name}>
      {/* Image */}
      <Link
        to={`/products/${product.slug}`}
        className="product-card-img-link"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="product-card-img-wrap">
          <ImagePlaceholder
            src={product.primary_image}
            alt={product.name}
            aspectRatio="1/1"
          />
          {/* Badges */}
          <div className="product-card-badges">
            {product.is_new && <span className="badge badge-new">New</span>}
            {product.is_best_seller && <span className="badge badge-best">Best Seller</span>}
            {isOnSale && <span className="badge badge-sale">Sale</span>}
          </div>
          {/* Quick add overlay */}
          <div className="product-card-overlay">
            <button
              className="quick-add-btn"
              onClick={handleAddToCart}
              disabled={adding || !inStock}
              aria-label={`Quick add ${product.name} to cart`}
            >
              <ShoppingBag size={16} />
              {adding ? 'Adding...' : inStock ? 'Quick Add' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="product-card-info">
        {product.category && (
          <Link
            to={product.category_slug ? `/shop?category=${product.category_slug}` : '/shop'}
            className="product-card-category"
          >
            {product.category}
          </Link>
        )}

        <Link to={`/products/${product.slug}`} className="product-card-name-link">
          <h3 className="product-card-name">{product.name}</h3>
        </Link>

        {product.flavor_notes && (
          <p className="product-card-notes">{product.flavor_notes}</p>
        )}

        {/* Variant selector (if multiple) */}
        {hasMultipleVariants && (
          <div className="product-card-variants" role="group" aria-label="Select size">
            {product.variants.map(variant => (
              <button
                key={variant.id}
                className={`variant-chip ${selectedVariant?.id === variant.id ? 'active' : ''} ${!variant.in_stock ? 'out-of-stock' : ''}`}
                onClick={(e) => { e.preventDefault(); setSelectedVariant(variant); }}
                aria-pressed={selectedVariant?.id === variant.id}
                aria-label={`${variant.name}${!variant.in_stock ? ' — out of stock' : ''}`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="product-card-price-row">
          <div className="product-card-prices">
            <span className="price-current">
              Rs. {selectedVariant?.price?.toLocaleString() ?? product.base_price?.toLocaleString()}
            </span>
            {isOnSale && (
              <span className="price-compare">
                Rs. {selectedVariant.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>
          {!inStock && (
            <span className="stock-out">Out of stock</span>
          )}
        </div>

        {/* Add to cart */}
        <button
          id={`add-to-cart-${product.id}`}
          className={`product-card-cta ${!inStock ? 'disabled' : ''}`}
          onClick={handleAddToCart}
          disabled={adding || !inStock}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingBag size={15} />
          {adding ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </article>
  );
}

/**
 * ProductCardSkeleton — loading placeholder matching card dimensions
 */
export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card-skeleton" aria-busy="true" aria-label="Loading product">
      <div className="product-card-img-wrap">
        <div className="skeleton" style={{ paddingBottom: '100%', width: '100%' }} />
      </div>
      <div className="product-card-info">
        <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 36, width: '100%' }} />
      </div>
    </div>
  );
}
