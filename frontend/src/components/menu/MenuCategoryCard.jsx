import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Coffee, Croissant, Utensils } from 'lucide-react';
import { getCategoryFallback } from '../../data/imageRegistry';

/**
 * MenuCategoryCard — Premium category entry card for Bean Theory menu landing.
 * Handles high-resolution image rendering, fallback on error, and smooth hover interactions.
 */
export default function MenuCategoryCard({ category }) {
  const [currentSrc, setCurrentSrc] = useState(category.image);
  const [triedFallback, setTriedFallback] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [triedExtensions, setTriedExtensions] = useState(new Set());

  // Handle extension fallback (.jpg <-> .jpeg <-> .png <-> .webp)
  const handleImageError = () => {
    if (!currentSrc) {
      if (!triedFallback) {
        setTriedFallback(true);
        setCurrentSrc(getCategoryFallback(category.id));
        return;
      }
      setImageError(true);
      return;
    }

    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const lower = currentSrc.toLowerCase();
    const currentExt = extensions.find((ext) => lower.endsWith(ext));

    if (currentExt) {
      const nextExt = extensions.find(
        (ext) => ext !== currentExt && !triedExtensions.has(ext)
      );
      if (nextExt) {
        setTriedExtensions((prev) => new Set(prev).add(currentExt));
        setCurrentSrc(currentSrc.slice(0, -currentExt.length) + nextExt);
        return;
      }
    }

    if (!triedFallback) {
      setTriedFallback(true);
      const fb = getCategoryFallback(category.id);
      if (fb && fb !== currentSrc) {
        setCurrentSrc(fb);
        return;
      }
    }

    setImageError(true);
  };

  // Fallback icon based on category ID
  const renderFallbackIcon = () => {
    switch (category.id) {
      case 'bakes-desserts':
        return <Croissant size={38} strokeWidth={1.5} />;
      case 'coffee-drinks':
        return <Coffee size={38} strokeWidth={1.5} />;
      default:
        return <Utensils size={38} strokeWidth={1.5} />;
    }
  };

  return (
    <Link
      to={category.href}
      className="menu-category-card"
      aria-label={`${category.title} — ${category.subtitle}`}
    >
      {/* Card Image Area */}
      <div className="menu-card-image-wrap">
        {category.badge && (
          <span className="menu-card-badge">{category.badge}</span>
        )}

        {!imageError ? (
          <img
            src={currentSrc}
            alt={category.imageAlt || category.title}
            className="menu-card-image"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="menu-card-image-fallback" role="img" aria-label={category.title}>
            {renderFallbackIcon()}
            <span>{category.title}</span>
          </div>
        )}

        <div className="menu-card-image-overlay" aria-hidden="true" />
      </div>

      {/* Card Content Area */}
      <div className="menu-card-content">
        <span className="menu-card-subtitle">{category.subtitle}</span>
        <h3 className="menu-card-title">{category.title}</h3>
        <p className="menu-card-desc">{category.description}</p>

        {category.highlights && category.highlights.length > 0 && (
          <div className="menu-card-highlights" aria-label="Popular items">
            {category.highlights.map((item, index) => (
              <span key={index} className="menu-card-pill">
                {item}
              </span>
            ))}
          </div>
        )}

        {/* CTA exploration button */}
        <div className="menu-card-footer">
          <div className="menu-card-cta">
            <span>{category.ctaText}</span>
            <span className="menu-card-cta-arrow" aria-hidden="true">
              <ArrowRight size={17} strokeWidth={2.2} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
