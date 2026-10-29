import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import { productsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import ImagePlaceholder from '../components/common/ImagePlaceholder';
import ProductCard from '../components/products/ProductCard';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const { addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedImage(null);
    productsApi.getBySlug(slug)
      .then(res => {
        const p = res.data.product;
        setProduct(p);
        setSelectedVariant(p.variants?.find(v => v.in_stock) || p.variants?.[0]);
      })
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedVariant || adding) return;
    setAdding(true);
    await addToCart(product.id, selectedVariant.id, quantity);
    setAdding(false);
  };

  if (loading) return <ProductDetailSkeleton />;
  if (error || !product) return (
    <div className="product-error">
      <h2>Product not found</h2>
      <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
    </div>
  );

  const isOnSale = selectedVariant?.compare_at_price > selectedVariant?.price;
  const inStock = selectedVariant?.in_stock;

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/shop?category=${product.category_slug}`}>{product.category}</Link>
              <span>/</span>
            </>
          )}
          <span aria-current="page">{product.name}</span>
        </nav>

        {/* Main product layout */}
        <div className="product-layout">
          {/* Images */}
          <div className="product-images">
            <div className="product-main-img">
              <ImagePlaceholder
                src={selectedImage || product.primary_image}
                alt={product.name}
                aspectRatio="1/1"
              />
              {/* Badges */}
              <div className="product-detail-badges">
                {product.is_new && <span className="badge badge-new">New</span>}
                {product.is_best_seller && <span className="badge badge-best">Best Seller</span>}
                {isOnSale && <span className="badge badge-sale">Sale</span>}
              </div>
            </div>
            {product.images?.length > 1 && (
              <div className="product-thumbnails">
                {product.images.map(img => (
                  <button
                    key={img.id}
                    type="button"
                    className={`product-thumb ${((selectedImage || product.primary_image) === img.url) ? 'active' : ''}`}
                    onClick={() => setSelectedImage(img.url)}
                    aria-label={`View ${img.alt_text || product.name}`}
                    style={{ background: 'none', border: ((selectedImage || product.primary_image) === img.url) ? '2px solid #D4A373' : '1px solid #E6DCCD', padding: 0, cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}
                  >
                    <ImagePlaceholder src={img.url} alt={img.alt_text || product.name} aspectRatio="1/1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            {product.category && (
              <Link to={`/shop?category=${product.category_slug}`} className="product-detail-cat">
                {product.category}
              </Link>
            )}
            <h1 className="product-detail-name">{product.name}</h1>

            {product.flavor_notes && (
              <p className="product-detail-notes">
                <strong>Tasting Notes:</strong> {product.flavor_notes}
              </p>
            )}

            {/* Price */}
            <div className="product-detail-price-wrap">
              <span className="product-detail-price">
                Rs. {selectedVariant?.price?.toLocaleString() ?? product.base_price?.toLocaleString()}
              </span>
              {isOnSale && (
                <span className="product-detail-compare">
                  Rs. {selectedVariant.compare_at_price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Quick details */}
            {(product.origin || product.roast_level || product.process) && (
              <div className="product-quick-details">
                {product.origin && (
                  <div className="detail-chip">
                    <span className="detail-label">Origin</span>
                    <span className="detail-value">{product.origin}</span>
                  </div>
                )}
                {product.roast_level && (
                  <div className="detail-chip">
                    <span className="detail-label">Roast</span>
                    <span className="detail-value">{product.roast_level}</span>
                  </div>
                )}
                {product.process && (
                  <div className="detail-chip">
                    <span className="detail-label">Process</span>
                    <span className="detail-value">{product.process}</span>
                  </div>
                )}
              </div>
            )}

            {/* Variant selector */}
            {product.variants?.length > 0 && (
              <div className="product-variant-section">
                <p className="variant-label">
                  Size: <strong>{selectedVariant?.name}</strong>
                </p>
                <div className="variant-chips" role="group" aria-label="Select size">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      className={`variant-chip-lg ${selectedVariant?.id === v.id ? 'active' : ''} ${!v.in_stock ? 'out-of-stock' : ''}`}
                      onClick={() => setSelectedVariant(v)}
                      aria-pressed={selectedVariant?.id === v.id}
                    >
                      {v.name}
                      {!v.in_stock && <span className="chip-oos"> (OOS)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="product-quantity-section">
              <p className="variant-label">Quantity</p>
              <div className="quantity-control">
                <button
                  className="qty-btn-lg"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="qty-display" aria-label={`Quantity: ${quantity}`}>{quantity}</span>
                <button
                  className="qty-btn-lg"
                  onClick={() => setQuantity(q => Math.min(q + 1, selectedVariant?.stock_quantity || 10))}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            {!inStock ? (
              <button className="btn btn-ghost product-cta-btn" disabled>
                Out of Stock
              </button>
            ) : (
              <button
                id={`add-to-cart-detail-${product.id}`}
                className="btn btn-primary product-cta-btn"
                onClick={handleAddToCart}
                disabled={adding}
              >
                <ShoppingBag size={18} />
                {adding ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
            )}

            <p className="product-shipping-note">
              ✓ Free shipping on orders over Rs. 2,000&nbsp;&nbsp;
              ✓ Roasted to order within 48 hrs
            </p>

            {/* Short description */}
            {product.short_description && (
              <p className="product-short-desc">{product.short_description}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="product-tabs">
          <div className="tabs-nav" role="tablist">
            {['description', 'details'].map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'description' ? 'Description' : 'Product Details'}
              </button>
            ))}
          </div>
          <div className="tab-content" role="tabpanel">
            {activeTab === 'description' && (
              <div className="tab-description">
                <p>{product.description || product.short_description}</p>
              </div>
            )}
            {activeTab === 'details' && (
              <div className="tab-details">
                <table className="details-table">
                  <tbody>
                    {product.origin && <tr><td>Origin</td><td>{product.origin}</td></tr>}
                    {product.roast_level && <tr><td>Roast Level</td><td>{product.roast_level}</td></tr>}
                    {product.process && <tr><td>Process</td><td>{product.process}</td></tr>}
                    {product.flavor_notes && <tr><td>Flavor Notes</td><td>{product.flavor_notes}</td></tr>}
                    {product.category && <tr><td>Category</td><td>{product.category}</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {product.related_products?.length > 0 && (
          <section className="related-products" aria-label="Related products">
            <h2 className="section-title" style={{ marginBottom: '2rem' }}>You May Also Like</h2>
            <div className="related-grid">
              {product.related_products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-layout">
          <div className="product-images">
            <div className="skeleton" style={{ paddingBottom: '100%', width: '100%', borderRadius: 12 }} />
          </div>
          <div className="product-info" style={{ gap: 16 }}>
            <div className="skeleton" style={{ height: 14, width: '30%' }} />
            <div className="skeleton" style={{ height: 40, width: '85%' }} />
            <div className="skeleton" style={{ height: 14, width: '60%' }} />
            <div className="skeleton" style={{ height: 36, width: '40%', marginTop: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 36, width: 70 }} />
              ))}
            </div>
            <div className="skeleton" style={{ height: 52, width: '100%', marginTop: 16, borderRadius: 99 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
