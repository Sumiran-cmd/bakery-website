import MenuCategoryCard from './MenuCategoryCard';

/**
 * MenuCategoryGrid — Responsive 3-card grid container for Menu Landing Page.
 */
export default function MenuCategoryGrid({ categories = [] }) {
  return (
    <section className="menu-category-container" aria-label="Menu Categories">
      <div className="menu-category-grid">
        {categories.map((category) => (
          <MenuCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
