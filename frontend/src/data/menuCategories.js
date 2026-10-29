/**
 * Menu Categories configuration for Bean Theory
 * Used by MenuLandingPage to render the 3 primary interactive category cards.
 */

export const MENU_CATEGORIES = [
  {
    id: 'bakes-desserts',
    title: 'Bakes & Desserts',
    subtitle: 'Freshly baked. Beautifully crafted.',
    description: 'Discover buttery croissants, delicate pastries, rich brownies, handcrafted cakes, and irresistible sweet treats.',
    ctaText: 'Explore Bakes & Desserts',
    href: '/menu/bakes',
    altHref: '/menu/bakes-desserts',
    image: '/images/categories/bakes-and-desserts.jpg',
    imageAlt: 'Artisanal baked goods and handcrafted desserts at Bean Theory',
    badge: 'Fresh Daily',
    highlights: ['Almond Croissants', 'Pistachio Basque Cheesecake', 'Artisan Sourdough', 'Fudge Brownies'],
  },
  {
    id: 'coffee-drinks',
    title: 'Coffee & Drinks',
    subtitle: 'Your perfect cup awaits.',
    description: 'Explore specialty coffee, espresso favorites, refreshing iced drinks, cold brew, and comforting café classics.',
    ctaText: 'Explore Coffee & Drinks',
    href: '/menu/drinks',
    altHref: '/menu/coffee-drinks',
    image: '/images/categories/coffee-and-drinks.jpg',
    imageAlt: 'Specialty coffee and crafted beverages at Bean Theory',
    badge: 'Himalayan Beans',
    highlights: ['Single-Origin Espresso', 'Velvet Flat White', '18h Cold Brew', 'Ceremonial Matcha'],
  },
  {
    id: 'food-snacks',
    title: 'Food & Snacks',
    subtitle: 'A little something delicious.',
    description: 'Enjoy satisfying sandwiches, savory pastries, light bites, and delicious snacks to pair with your favorite drink.',
    ctaText: 'Explore Food & Snacks',
    href: '/menu/food',
    altHref: '/menu/food-snacks',
    image: '/images/categories/food-and-snacks.jpg',
    imageAlt: 'Gourmet sandwiches and savory light bites at Bean Theory',
    badge: 'Kitchen Crafted',
    highlights: ['Truffle Mushroom Toast', 'Smoked Chicken Panini', 'Avocado Sourdough', 'Crispy Polenta Bites'],
  },
];

export default MENU_CATEGORIES;
