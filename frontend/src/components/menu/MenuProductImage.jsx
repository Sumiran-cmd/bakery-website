import ImagePlaceholder from '../common/ImagePlaceholder';

/**
 * MenuProductImage — wrapper around the site-wide ImagePlaceholder
 * specifically tuned for bakery menu cards.
 *
 * Usage:
 *   <MenuProductImage src={product.image} alt={product.name} />
 *
 * Replace `src` with the actual image path when your photos are ready.
 * The component automatically shows the branded bakery placeholder while
 * images are loading or if a path is not yet provided.
 */
export default function MenuProductImage({ src, alt = '' }) {
  return (
    <ImagePlaceholder
      src={src}
      alt={alt}
      aspectRatio="1/1"
      label="Image coming soon"
      showIcon
      className="menu-product-image"
    />
  );
}
