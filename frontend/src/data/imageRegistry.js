/**
 * Centralized Image Registry & Fallback Management System
 * 
 * Provides:
 * - High-resolution category banners and photography mappings
 * - Category-specific fallbacks to prevent broken image displays
 * - Product image resolver for catalog and menu items
 */

export const CATEGORY_FALLBACKS = {
  bakes: '/images/placeholders/bakes-desserts-placeholder.jpg',
  pastries: '/images/placeholders/bakes-desserts-placeholder.jpg',
  croissants: '/images/placeholders/bakes-desserts-placeholder.jpg',
  cakes: '/images/placeholders/bakes-desserts-placeholder.jpg',
  desserts: '/images/placeholders/bakes-desserts-placeholder.jpg',
  drinks: '/images/placeholders/drink-placeholder.jpg',
  coffee: '/images/placeholders/coffee-drinks-placeholder.jpg',
  espresso: '/images/placeholders/drink-placeholder.jpg',
  tea: '/images/placeholders/drink-placeholder.jpg',
  food: '/images/placeholders/food-placeholder.jpg',
  breakfast: '/images/placeholders/food-placeholder.jpg',
  sandwiches: '/images/placeholders/food-placeholder.jpg',
  snacks: '/images/placeholders/food-snacks-placeholder.jpg',
  products: '/images/placeholders/product-placeholder.jpg',
  default: '/images/placeholders/product-placeholder.jpg',
};

/**
 * Resolve an appropriate fallback image based on a URL path or category key
 */
export function getCategoryFallback(pathOrCategory = '') {
  if (!pathOrCategory) return CATEGORY_FALLBACKS.default;
  const lower = String(pathOrCategory).toLowerCase();

  if (lower.includes('bake') || lower.includes('pastr') || lower.includes('croissant') || lower.includes('cake') || lower.includes('dessert') || lower.includes('cookie') || lower.includes('donut')) {
    return CATEGORY_FALLBACKS.bakes;
  }
  if (lower.includes('drink') || lower.includes('coffee') || lower.includes('espresso') || lower.includes('tea') || lower.includes('latte') || lower.includes('brew')) {
    return CATEGORY_FALLBACKS.drinks;
  }
  if (lower.includes('food') || lower.includes('snack') || lower.includes('toast') || lower.includes('salad') || lower.includes('sandwich') || lower.includes('wrap')) {
    return CATEGORY_FALLBACKS.food;
  }
  if (lower.includes('product') || lower.includes('whole-bean') || lower.includes('ground') || lower.includes('roast')) {
    return CATEGORY_FALLBACKS.products;
  }

  return CATEGORY_FALLBACKS.default;
}

export default {
  CATEGORY_FALLBACKS,
  getCategoryFallback,
};
