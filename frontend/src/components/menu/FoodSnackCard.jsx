import ImagePlaceholder from '../common/ImagePlaceholder';

/**
 * FoodSnackCard — displays one food item in the menu grid.
 *
 * Layout: image on the left, text on the right (desktop).
 * Stacks vertically on mobile (image on top).
 */

/** Dietary tag colour map */
const DIETARY_STYLES = {
  'Vegetarian':   { bg: '#EDF7ED', color: '#2E7D32', border: '#A5D6A7' },
  'Vegan':        { bg: '#E8F5E9', color: '#1B5E20', border: '#81C784' },
  'Gluten-Free':  { bg: '#FBE9E7', color: '#BF360C', border: '#FFAB91' },
  'Contains Nuts':{ bg: '#FFF8E1', color: '#F57F17', border: '#FFE082' },
  'Spicy':        { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
};

export default function FoodSnackCard({ product }) {
  const { name, subtitle, description, price, image, dietary = [] } = product;

  return (
    <article className="food-card" aria-label={name}>
      {/* ── Image ── */}
      <div className="food-card-img">
        <ImagePlaceholder
          src={image}
          alt={name}
          aspectRatio="1/1"
          label="Image coming soon"
          showIcon
        />
      </div>

      {/* ── Info ── */}
      <div className="food-card-body">
        <div className="food-card-header">
          <div className="food-card-title-group">
            <h3 className="food-card-name">{name}</h3>
            {subtitle && <p className="food-card-subtitle">{subtitle}</p>}
          </div>
          <span
            className="food-card-price"
            aria-label={`Price: Rs. ${price}`}
          >
            Rs.&nbsp;{price.toLocaleString()}
          </span>
        </div>

        <p className="food-card-desc">{description}</p>

        {dietary.length > 0 && (
          <div
            className="food-card-tags"
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
                  className="food-card-tag"
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
