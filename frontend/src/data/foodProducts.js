/**
 * Food & Snacks — Menu Product Data
 *
 * To add a product: copy an entry, give it a unique `id`, set the correct
 * `category` (must match one of FOOD_CATEGORIES id), update `price` (NPR),
 * and set `image` to the path under /images/food/ once photos are ready.
 *
 * Dietary labels: 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Contains Nuts' | 'Spicy'
 */

export const FOOD_CATEGORIES = [
  { id: 'all',          label: 'All' },
  { id: 'breakfast',    label: 'Eggs & Breakfast' },
  { id: 'sandwiches',   label: 'Sandwiches & Wraps' },
  { id: 'toasties',     label: 'Toasties & Melts' },
  { id: 'salads',       label: 'Salads & Bowls' },
  { id: 'soups',        label: 'Soups' },
  { id: 'light-bites',  label: 'Light Bites' },
  { id: 'sides',        label: 'Sides' },
];

export const FOOD_PRODUCTS = [
  // ── Eggs & Breakfast ─────────────────────────────────────────
  {
    id: 'avocado-toast',
    name: 'Avocado Toast',
    subtitle: 'Sourdough · Poached Egg',
    description:
      'Thick-cut toasted sourdough spread with smashed avocado and finished with a perfectly poached egg, chilli flakes, and micro herbs.',
    price: 450,
    category: 'breakfast',
    image: '/images/food/avocado-toast.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'eggs-benedict',
    name: 'Eggs Benedict',
    subtitle: 'Hollandaise · Brioche',
    description:
      'Two poached eggs resting on toasted brioche halves with smoked ham, finished with a silky house-made hollandaise sauce.',
    price: 550,
    category: 'breakfast',
    image: '/images/food/eggs-benedict.jpg',
    dietary: [],
  },
  {
    id: 'shakshuka',
    name: 'Shakshuka',
    subtitle: 'Baked Eggs · Tomato & Pepper',
    description:
      'Eggs baked in a spiced tomato, red pepper, and onion sauce, served in a cast-iron skillet with warm sourdough soldiers.',
    price: 480,
    category: 'breakfast',
    image: '/images/food/shakshuka.jpg',
    dietary: ['Vegetarian', 'Spicy'],
  },
  {
    id: 'granola-bowl',
    name: 'Granola Bowl',
    subtitle: 'House-Made · Seasonal Fruit',
    description:
      'Slow-baked oat and nut granola over creamy Greek yoghurt with seasonal fruit compote and a drizzle of raw honey.',
    price: 380,
    category: 'breakfast',
    image: '/images/food/granola-bowl.jpg',
    dietary: ['Vegetarian', 'Contains Nuts'],
  },
  {
    id: 'full-breakfast',
    name: 'Full Café Breakfast',
    subtitle: 'Eggs · Toast · Sides',
    description:
      'Two eggs your way — scrambled, fried, or poached — with sourdough toast, roasted tomatoes, sautéed mushrooms, and turkey sausage.',
    price: 650,
    category: 'breakfast',
    image: '/images/food/full-breakfast.jpg',
    dietary: [],
  },

  // ── Sandwiches & Wraps ────────────────────────────────────────
  {
    id: 'blt-sourdough',
    name: 'BLT Sourdough',
    subtitle: 'Bacon · Lettuce · Tomato',
    description:
      'Crispy smoked bacon, ripe heirloom tomatoes, and butter lettuce layered on thick-cut toasted sourdough with house-made aioli.',
    price: 520,
    category: 'sandwiches',
    image: '/images/food/blt-sourdough.jpg',
    dietary: [],
  },
  {
    id: 'chicken-pesto-wrap',
    name: 'Chicken Pesto Wrap',
    subtitle: 'Grilled Chicken · Basil Pesto',
    description:
      'Warm flour tortilla wrapped around sliced grilled chicken breast, house basil pesto, sun-dried tomatoes, rocket, and parmesan shavings.',
    price: 490,
    category: 'sandwiches',
    image: '/images/food/chicken-pesto-wrap.jpg',
    dietary: [],
  },
  {
    id: 'smoked-salmon-bagel',
    name: 'Smoked Salmon Bagel',
    subtitle: 'Cream Cheese · Capers',
    description:
      'Toasted sesame bagel loaded with cream cheese, premium smoked salmon, thinly sliced red onion, capers, and fresh dill.',
    price: 580,
    category: 'sandwiches',
    image: '/images/food/smoked-salmon-bagel.jpg',
    dietary: [],
  },
  {
    id: 'caprese-ciabatta',
    name: 'Caprese Ciabatta',
    subtitle: 'Fresh Mozzarella · Basil',
    description:
      'Toasted ciabatta with thick-sliced buffalo mozzarella, ripe vine tomatoes, fresh basil, and a balsamic glaze reduction.',
    price: 460,
    category: 'sandwiches',
    image: '/images/food/caprese-ciabatta.jpg',
    dietary: ['Vegetarian'],
  },

  // ── Toasties & Melts ──────────────────────────────────────────
  {
    id: 'classic-cheese-toastie',
    name: 'Classic Cheese Toastie',
    subtitle: 'Three-Cheese Melt',
    description:
      'Sourdough pressed and grilled with a blend of aged cheddar, Gruyère, and Emmental until perfectly golden and molten within.',
    price: 380,
    category: 'toasties',
    image: '/images/food/cheese-toastie.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'ham-gruyere-melt',
    name: 'Ham & Gruyère Melt',
    subtitle: 'Croque Monsieur Style',
    description:
      'Toasted brioche layered with Black Forest ham and melted Gruyère, finished with a thin béchamel crust and Dijon mustard.',
    price: 450,
    category: 'toasties',
    image: '/images/food/ham-gruyere-melt.jpg',
    dietary: [],
  },
  {
    id: 'mushroom-truffle-melt',
    name: 'Mushroom & Truffle Melt',
    subtitle: 'Garlic · Thyme · Gruyère',
    description:
      'Wild and cultivated mushrooms sautéed in garlic and thyme, piled on sourdough with melted Gruyère and a truffle oil finish.',
    price: 500,
    category: 'toasties',
    image: '/images/food/mushroom-truffle-melt.jpg',
    dietary: ['Vegetarian'],
  },

  // ── Salads & Bowls ────────────────────────────────────────────
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    subtitle: 'Mixed Leaves · House Vinaigrette',
    description:
      'A daily rotation of seasonal mixed leaves, cucumber ribbons, shaved radish, and toasted seeds with a light sherry vinaigrette.',
    price: 340,
    category: 'salads',
    image: '/images/food/garden-salad.jpg',
    dietary: ['Vegan', 'Gluten-Free'],
  },
  {
    id: 'caesar-salad',
    name: 'Caesar Salad',
    subtitle: 'Grilled Chicken · Parmesan',
    description:
      'Crisp romaine leaves tossed in house Caesar dressing with sourdough croutons, parmesan shavings, and sliced grilled chicken breast.',
    price: 480,
    category: 'salads',
    image: '/images/food/caesar-salad.jpg',
    dietary: [],
  },
  {
    id: 'grain-bowl',
    name: 'Roasted Vegetable Grain Bowl',
    subtitle: 'Quinoa · Feta · Tahini',
    description:
      'Warm quinoa and farro topped with seasonal roasted vegetables, crumbled feta, toasted chickpeas, and a lemon-tahini dressing.',
    price: 520,
    category: 'salads',
    image: '/images/food/grain-bowl.jpg',
    dietary: ['Vegetarian', 'Gluten-Free'],
  },
  {
    id: 'salmon-poke-bowl',
    name: 'Salmon Poke Bowl',
    subtitle: 'Sushi Rice · Edamame · Avocado',
    description:
      'Marinated fresh salmon over seasoned sushi rice with avocado, edamame, pickled cucumber, sesame, and a house ponzu drizzle.',
    price: 620,
    category: 'salads',
    image: '/images/food/salmon-poke-bowl.jpg',
    dietary: ['Gluten-Free'],
  },

  // ── Soups ─────────────────────────────────────────────────────
  {
    id: 'tomato-basil-soup',
    name: 'Roasted Tomato & Basil Soup',
    subtitle: 'Slow-Roasted · Cream Finished',
    description:
      'Vine tomatoes roasted until deeply caramelised and blended with cream, fresh basil, and a pinch of smoked paprika. Served with sourdough.',
    price: 380,
    category: 'soups',
    image: '/images/food/tomato-soup.jpg',
    dietary: ['Vegetarian', 'Gluten-Free'],
  },
  {
    id: 'lentil-soup',
    name: 'Himalayan Lentil Soup',
    subtitle: 'Spiced · Coconut & Lime',
    description:
      'Red lentils simmered with Himalayan spices, coconut milk, and a finishing squeeze of lime. Hearty, warming, and entirely plant-based.',
    price: 350,
    category: 'soups',
    image: '/images/food/lentil-soup.jpg',
    dietary: ['Vegan', 'Gluten-Free', 'Spicy'],
  },
  {
    id: 'mushroom-bisque',
    name: 'Wild Mushroom Bisque',
    subtitle: 'Truffle Cream · Crispy Shallots',
    description:
      'A silky blend of wild and cultivated mushrooms enriched with cream and finished with truffle oil and crispy fried shallots.',
    price: 420,
    category: 'soups',
    image: '/images/food/mushroom-bisque.jpg',
    dietary: ['Vegetarian', 'Gluten-Free'],
  },

  // ── Light Bites ───────────────────────────────────────────────
  {
    id: 'hummus-plate',
    name: 'Hummus & Crudités',
    subtitle: 'House-Made · Warm Flatbread',
    description:
      'House-blended chickpea hummus drizzled with extra-virgin olive oil and dukkah, served with seasonal vegetable crudités and warm flatbread.',
    price: 360,
    category: 'light-bites',
    image: '/images/food/hummus-plate.jpg',
    dietary: ['Vegan', 'Contains Nuts'],
  },
  {
    id: 'cheese-board',
    name: 'Artisan Cheese Board',
    subtitle: 'Three Cheeses · Seasonal Accompaniments',
    description:
      'A rotating selection of three artisan cheeses paired with seasonal chutney, honey, grapes, and house-baked crackers.',
    price: 680,
    category: 'light-bites',
    image: '/images/food/cheese-board.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'bruschetta',
    name: 'Bruschetta',
    subtitle: 'Two Pieces · Seasonal Topping',
    description:
      'Thick-cut sourdough charred on the grill and rubbed with garlic, topped with heirloom tomato, basil, and aged balsamic reduction.',
    price: 320,
    category: 'light-bites',
    image: '/images/food/bruschetta.jpg',
    dietary: ['Vegan'],
  },
  {
    id: 'spring-rolls',
    name: 'Vegetable Spring Rolls',
    subtitle: 'Crispy · Sweet Chilli Dip',
    description:
      'Four golden-fried spring rolls filled with cabbage, carrot, glass noodles, and fresh herbs — served with a house sweet chilli sauce.',
    price: 340,
    category: 'light-bites',
    image: '/images/food/spring-rolls.jpg',
    dietary: ['Vegan', 'Spicy'],
  },
  {
    id: 'charcuterie-snack',
    name: 'Charcuterie Snack Plate',
    subtitle: 'Cured Meats · Pickles · Mustard',
    description:
      'A hand-picked selection of cured meats, cornichons, whole-grain mustard, and toasted baguette slices — perfect alongside a coffee.',
    price: 580,
    category: 'light-bites',
    image: '/images/food/charcuterie-plate.jpg',
    dietary: [],
  },

  // ── Sides ─────────────────────────────────────────────────────
  {
    id: 'truffle-fries',
    name: 'Truffle Fries',
    subtitle: 'Parmesan · Fresh Herbs',
    description:
      'Thin-cut fries tossed with truffle oil, finely grated parmesan, and fresh parsley. Crispy, aromatic, and deeply addictive.',
    price: 320,
    category: 'sides',
    image: '/images/food/truffle-fries.jpg',
    dietary: ['Vegetarian', 'Gluten-Free'],
  },
  {
    id: 'sourdough-slice',
    name: 'Sourdough Toast',
    subtitle: 'Two Slices · Cultured Butter',
    description:
      'Two thick slices of our house sourdough, toasted golden and served with a generous pat of cultured butter and artisan jam.',
    price: 180,
    category: 'sides',
    image: '/images/food/sourdough-toast.jpg',
    dietary: ['Vegetarian'],
  },
  {
    id: 'seasonal-fruit',
    name: 'Seasonal Fruit Plate',
    subtitle: 'Fresh · Mint Yoghurt Dip',
    description:
      'A daily selection of the freshest seasonal fruit, sliced and fanned, served with a lightly sweetened mint yoghurt dip on the side.',
    price: 280,
    category: 'sides',
    image: '/images/food/seasonal-fruit.jpg',
    dietary: ['Vegetarian', 'Gluten-Free'],
  },
];
