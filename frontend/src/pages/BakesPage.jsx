import BakesDessertsMenu from '../components/menu/BakesDessertsMenu';

/**
 * BakesPage — the full Bakes & Desserts menu page.
 * Served at /menu/bakes (already linked in the site Header nav).
 *
 * This page is intentionally minimal: the menu section component handles
 * all content, layout, and filtering. Add additional page-level sections
 * (e.g. an allergen note or a "custom orders" banner) here as needed.
 */
export default function BakesPage() {
  return (
    <>
      {/* Primary meta is handled by index.html; add a react-helmet or
          similar head-management library here if the project uses one. */}
      <BakesDessertsMenu />
    </>
  );
}
