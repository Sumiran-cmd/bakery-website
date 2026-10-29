import { useState, useEffect } from 'react';
import { Coffee } from 'lucide-react';
import { getCategoryFallback } from '../../data/imageRegistry';
import './ImagePlaceholder.css';

/**
 * Universal image placeholder that maintains aspect ratio
 * and provides a graceful, multi-tier fallback if real images are missing.
 *
 * Tier 1: Original image path
 * Tier 2: Automatic extension fallback (.jpg <-> .jpeg <-> .png <-> .webp)
 * Tier 3: Category-specific high-resolution photographic fallback
 * Tier 4: Stylized brand placeholder with icon
 */
export default function ImagePlaceholder({
  src,
  alt = '',
  aspectRatio = '1/1',
  label,
  className = '',
  style = {},
  rounded = false,
  showIcon = true,
  objectFit = 'cover',
  fallbackSrc,
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedFallback, setTriedFallback] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [triedExtensions, setTriedExtensions] = useState(new Set());

  useEffect(() => {
    setCurrentSrc(src);
    setTriedFallback(false);
    setImgError(false);
    setImgLoaded(false);
    setTriedExtensions(new Set());
  }, [src]);

  const handleImgError = () => {
    if (!currentSrc) {
      triggerFallback();
      return;
    }

    // Try alternate common image extensions (.jpg <-> .jpeg <-> .png <-> .webp)
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

    triggerFallback();
  };

  const triggerFallback = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      const categoryFallback = fallbackSrc || getCategoryFallback(src || alt || label);
      if (categoryFallback && categoryFallback !== currentSrc) {
        setCurrentSrc(categoryFallback);
        return;
      }
    }
    setImgError(true);
  };

  const showPlaceholder = !currentSrc || imgError;

  return (
    <div
      className={`img-placeholder-root ${className}`}
      style={{ '--aspect-ratio': aspectRatio, ...style }}
      role={showPlaceholder ? 'img' : undefined}
      aria-label={showPlaceholder ? alt : undefined}
    >
      <div className={`img-placeholder-inner ${rounded ? 'rounded' : ''}`}>
        {!showPlaceholder && (
          <img
            src={currentSrc}
            alt={alt}
            onError={handleImgError}
            onLoad={() => setImgLoaded(true)}
            className={`img-placeholder-img ${imgLoaded ? 'loaded' : ''}`}
            style={{ objectFit }}
          />
        )}
        {showPlaceholder && (
          <div className="img-placeholder-fallback">
            {showIcon && (
              <div className="img-placeholder-icon">
                <Coffee size={28} strokeWidth={1.5} />
              </div>
            )}
            {label && <span className="img-placeholder-label">{label}</span>}
          </div>
        )}
        {!showPlaceholder && !imgLoaded && (
          <div className="img-placeholder-loading skeleton" />
        )}
      </div>
    </div>
  );
}
