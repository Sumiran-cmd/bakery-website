import MenuProductImage from './MenuProductImage';

/** Label colour map for dietary tags */
const DIETARY_STYLES = {
  Vegetarian:   { bg: '#EDF7ED', color: '#2E7D32', border: '#A5D6A7' },
  Eggless:      { bg: '#FFF8E1', color: '#F57F17', border: '#FFE082' },
  Vegan:        { bg: '#E8F5E9', color: '#1B5E20', border: '#81C784' },
  'Gluten-Free':{ bg: '#FBE9E7', color: '#BF360C', border: '#FFAB91' },
};

/**
 * MenuProductCard — displays one bakery product in the menu grid.
 *
 * Layout: image on the left, text on the right (desktop).
 * Stacks vertically on mobile.
 */
export default function MenuProductCard({ product }) {
  const { name, subtitle, description, price, image, dietary = [] } = product;

  return (
    <article className="bakes-card" aria-label={name}>
      {/* ── Image ── */}
      <div className="bakes-card-img">
        <MenuProductImage src={image} alt={name} />
      </div>

      {/* ── Info ── */}
      <div className="bakes-card-body">
        <div className="bakes-card-header">
          <div className="bakes-card-title-group">
            <h3 className="bakes-card-name">{name}</h3>
            {subtitle && <p className="bakes-card-subtitle">{subtitle}</p>}
          </div>
          <span className="bakes-card-price" aria-label={`Price: Rs. ${price}`}>
            Rs.&nbsp;{price.toLocaleString()}
          </span>
        </div>

        <p className="bakes-card-desc">{description}</p>

        {dietary.length > 0 && (
          <div className="bakes-card-tags" role="list" aria-label="Dietary information">
            {dietary.map((label) => {
              const s = DIETARY_STYLES[label] ?? { bg: '#F5F2ED', color: '#5E5449', border: '#D9D2C7' };
              return (
                <span
                  key={label}
                  role="listitem"
                  className="bakes-card-tag"
                  style={{ '--tag-bg': s.bg, '--tag-color': s.color, '--tag-border': s.border }}
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
