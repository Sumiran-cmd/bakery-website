import ImagePlaceholder from './ImagePlaceholder';

/**
 * ProductImage — standardized 1:1 product image with optional hover zoom.
 * Pass `src` to display a real image; omit to show placeholder.
 * Pass `imageKey` for future asset mapping.
 */
export default function ProductImage({ src, alt, _imageKey, hover = false, className = '' }) {
  return (
    <div className={`product-image-wrap ${hover ? 'hover-zoom' : ''} ${className}`}>
      <ImagePlaceholder
        src={src}
        alt={alt}
        aspectRatio="1/1"
        objectFit="cover"
      />
    </div>
  );
}
