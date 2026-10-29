/**
 * Bakes & Desserts — Menu Product Data
 *
 * To add a product: copy an entry, give it a unique `id`, set the correct
 * `category` (must match one of BAKERY_CATEGORIES), update `price` (NPR),
 * and set `image` to the path under /images/bakes/ once you have the photo.
 *
 * Dietary labels: 'Vegetarian' | 'Eggless' | 'Vegan' | 'Gluten-Free'
 */

export const BAKERY_CATEGORIES = [
  { id: 'all',             label: 'All' },
  { id: 'pastries',        label: 'Pastries' },
  { id: 'croissants',      label: 'Croissants' },
  { id: 'cakes',           label: 'Cakes' },
  { id: 'brownies-slices', label: 'Brownies & Slices' },
  { id: 'cookies',         label: 'Cookies' },
  { id: 'donuts',          label: 'Donuts' },
  { id: 'savoury-bakes',   label: 'Savoury Bakes' },
];

export const BAKERY_PRODUCTS = [
  // ── Pastries ─────────────────────────────────────────────
  {
    id: 'butter-croissant',
    name: 'Butter Croissant',
    subtitle: 'Classic French Pastry',
    description:
      'Flaky, golden layers of hand-laminated dough with rich European butter. Crisp outside, soft and airy within.',
    price: 180,
    category: 'pastries',
    image: '/images/bakes/butter-croissant.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'almond-croissant',
    name: 'Almond Croissant',
    subtitle: 'Filled & Double-Baked',
    description:
      'A day-old croissant soaked in orange syrup, filled with house-made almond frangipane, and finished with toasted flaked almonds.',
    price: 250,
    category: 'pastries',
    image: '/images/bakes/almond-croissant.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'pain-au-chocolat',
    name: 'Pain au Chocolat',
    subtitle: 'Dark Chocolate Pastry',
    description:
      'Two batons of Valrhona dark chocolate folded into buttery puff pastry and baked to a deep golden finish.',
    price: 220,
    category: 'pastries',
    image: '/images/bakes/pain-au-chocolat.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'cinnamon-roll',
    name: 'Cinnamon Roll',
    subtitle: 'Spiced & Glazed',
    description:
      'Soft, pillowy dough swirled with Ceylon cinnamon and brown sugar, finished with a warm cream-cheese glaze.',
    price: 200,
    category: 'pastries',
    image: '/images/bakes/cinnamon-roll.jpg',
    dietary: ['Vegetarian'],
  },

  // ── Croissants ───────────────────────────────────────────
  {
    id: 'cheese-croissant',
    name: 'Cheese Croissant',
    subtitle: 'Savoury Baked',
    description:
      'Buttery croissant dough layered with aged Gouda and a touch of Dijon, baked until bronzed and melted.',
    price: 240,
    category: 'croissants',
    image: '/images/bakes/cheese-croissant.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'ham-cheese-croissant',
    name: 'Ham & Cheese Croissant',
    subtitle: 'Savoury Classic',
    description:
      'Thinly sliced smoked ham and melted Swiss cheese nestled inside a perfectly laminated butter croissant.',
    price: 280,
    category: 'croissants',
    image: '/images/bakes/ham-cheese-croissant.jpg',
    dietary: [],
  },

  // ── Cakes ────────────────────────────────────────────────
  {
    id: 'chocolate-fudge-cake',
    name: 'Chocolate Fudge Cake',
    subtitle: 'Rich Layer Cake · Slice',
    description:
      'Three layers of dense, moist chocolate sponge sandwiched with velvety fudge ganache and finished in dark chocolate buttercream.',
    price: 350,
    category: 'cakes',
    image: '/images/bakes/chocolate-fudge-cake.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'red-velvet-cake',
    name: 'Red Velvet Cake',
    subtitle: 'Cream Cheese Frosted · Slice',
    description:
      'Tender, faintly cocoa-flavoured sponge with a vibrant crimson crumb, layered and crowned with a tangy cream-cheese frosting.',
    price: 380,
    category: 'cakes',
    image: '/images/bakes/red-velvet-cake.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'classic-cheesecake',
    name: 'Classic Cheesecake',
    subtitle: 'New York Style · Slice',
    description:
      'Dense and impossibly creamy baked cheesecake on a buttery digestive biscuit base, served with a fresh berry compote.',
    price: 400,
    category: 'cakes',
    image: '/images/bakes/classic-cheesecake.jpg',
    dietary: ['Vegetarian'],
  },

  // ── Brownies & Slices ────────────────────────────────────
  {
    id: 'fudgy-chocolate-brownie',
    name: 'Fudgy Chocolate Brownie',
    subtitle: 'Dark Chocolate · Square',
    description:
      'Ultra-dense, crinkle-topped brownie made with 70% Valrhona chocolate — deeply fudgy with a paper-thin crust.',
    price: 180,
    category: 'brownies-slices',
    image: '/images/bakes/chocolate-brownie.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'lemon-cake-slice',
    name: 'Lemon Cake Slice',
    subtitle: 'Zesty & Glazed',
    description:
      'Light almond and lemon sponge soaked in a tart citrus syrup and finished with a glossy lemon drizzle glaze.',
    price: 200,
    category: 'brownies-slices',
    image: '/images/bakes/lemon-cake-slice.jpg',
    dietary: ['Vegetarian'],
  },

  // ── Cookies ──────────────────────────────────────────────
  {
    id: 'chocolate-chip-cookie',
    name: 'Chocolate Chip Cookie',
    subtitle: 'Sea Salt Finished',
    description:
      'Brown-butter dough packed with dark and milk chocolate chips, finished with a pinch of flaky Maldon sea salt.',
    price: 120,
    category: 'cookies',
    image: '/images/bakes/choc-chip-cookie.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'double-chocolate-cookie',
    name: 'Double Chocolate Cookie',
    subtitle: 'Extra Fudgy',
    description:
      'A deep cocoa dough studded with white and dark chocolate chunks, baked until just set for a molten-centred finish.',
    price: 150,
    category: 'cookies',
    image: '/images/bakes/double-choc-cookie.jpg',
    dietary: ['Vegetarian'],
  },

  // ── Donuts ───────────────────────────────────────────────
  {
    id: 'classic-glazed-donut',
    name: 'Classic Glazed Donut',
    subtitle: 'Yeast-Raised',
    description:
      'Light, pillowy yeast-raised ring donut dipped in a sheer vanilla glaze while still warm from the fryer.',
    price: 130,
    category: 'donuts',
    image: '/images/bakes/glazed-donut.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'chocolate-donut',
    name: 'Chocolate Donut',
    subtitle: 'Dark Chocolate Glaze',
    description:
      'Soft brioche-style donut dipped in a glossy dark chocolate ganache and topped with cocoa nibs.',
    price: 160,
    category: 'donuts',
    image: '/images/bakes/chocolate-donut.jpg',
    dietary: ['Vegetarian'],
  },

  // ── Savoury Bakes ────────────────────────────────────────
  {
    id: 'spinach-cheese-puff',
    name: 'Spinach & Cheese Puff',
    subtitle: 'Warm Savoury Pastry',
    description:
      'Buttery puff pastry filled with wilted spinach, ricotta, and a hint of nutmeg — baked until golden and flaky.',
    price: 200,
    category: 'savoury-bakes',
    image: '/images/bakes/spinach-cheese-puff.jpg',
    dietary: ['Vegetarian', 'Eggless'],
  },
];
