import ImagePlaceholder from '../common/ImagePlaceholder';

/**
 * DrinkProductCard — displays one drink in the menu grid.
 *
 * Layout: image on the left, text on the right (desktop).
 * Stacks vertically on mobile (image on top).
 */

/** Label colour map for dietary tags */
const DIETARY_STYLES = {
  'Vegan':           { bg: '#E8F5E9', color: '#1B5E20', border: '#81C784' },
  'Dairy-Free':      { bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
  'Decaf Available': { bg: '#FFF8E1', color: '#F57F17', border: '#FFE082' },
  'Sugar-Free':      { bg: '#FBE9E7', color: '#BF360C', border: '#FFAB91' },
};

export default function DrinkProductCard({ product }) {
  const { name, subtitle, description, price, image, dietary = [] } = product;

  return (
    <article className="drink-card" aria-label={name}>
      {/* ── Image ── */}
      <div className="drink-card-img">
        <ImagePlaceholder
          src={image}
          alt={name}
          aspectRatio="1/1"
          label="Image coming soon"
          showIcon
        />
      </div>

      {/* ── Info ── */}
      <div className="drink-card-body">
        <div className="drink-card-header">
          <div className="drink-card-title-group">
            <h3 className="drink-card-name">{name}</h3>
            {subtitle && <p className="drink-card-subtitle">{subtitle}</p>}
          </div>
          <span
            className="drink-card-price"
            aria-label={`Price: Rs. ${price}`}
          >
            Rs.&nbsp;{price.toLocaleString()}
          </span>
        </div>

        <p className="drink-card-desc">{description}</p>

        {dietary.length > 0 && (
          <div
            className="drink-card-tags"
            role="list"
            aria-label="Dietary information"
          >
            {dietary.map((label) => {
              const s = DIETARY_STYLES[label] ?? {
                bg: '#F5F2ED',
                color: '#5E5449',
                border: '#D9D2C7',
              };
              return (
                <span
                  key={label}
                  role="listitem"
                  className="drink-card-tag"
                  style={{
                    '--tag-bg': s.bg,
                    '--tag-color': s.color,
                    '--tag-border': s.border,
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
