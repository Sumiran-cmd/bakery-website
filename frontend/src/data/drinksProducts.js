/**
 * Coffee & Drinks — Menu Product Data
 *
 * To add a product: copy an entry, give it a unique `id`, set the correct
 * `category` (must match one of DRINKS_CATEGORIES id), update `price` (NPR),
 * and set `image` to the path under /images/drinks/ once photos are ready.
 *
 * Drink sizes: use the `sizes` array to list available size options if applicable.
 * Dietary labels: 'Vegan' | 'Dairy-Free' | 'Decaf Available' | 'Sugar-Free'
 */

export const DRINKS_CATEGORIES = [
  { id: 'all',          label: 'All' },
  { id: 'espresso',     label: 'Espresso' },
  { id: 'filter',       label: 'Filter Coffee' },
  { id: 'iced',         label: 'Iced Drinks' },
  { id: 'cold-brew',    label: 'Cold Brew' },
  { id: 'specialty',    label: 'Specialty Lattes' },
  { id: 'tea',          label: 'Tea & Tisanes' },
  { id: 'non-coffee',   label: 'Non-Coffee' },
];

export const DRINKS_PRODUCTS = [
  // ── Espresso ─────────────────────────────────────────────────
  {
    id: 'espresso',
    name: 'Espresso',
    subtitle: 'Single Shot · 30 ml',
    description:
      'A concentrated, syrupy shot pulled from our Himalayan single-origin blend. Bold, structured, and finished with a hazelnut-tinted crema.',
    price: 180,
    category: 'espresso',
    image: '/images/drinks/espresso.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'double-espresso',
    name: 'Double Espresso',
    subtitle: 'Doppio · 60 ml',
    description:
      'Two shots of our house espresso, pulled to order. Intense, clean, and deeply aromatic — for the committed coffee lover.',
    price: 250,
    category: 'espresso',
    image: '/images/drinks/double-espresso.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'americano',
    name: 'Americano',
    subtitle: 'Hot or Iced',
    description:
      'Espresso lengthened with hot water to reveal a more open, complex flavour profile. Clean and satisfying at any hour.',
    price: 220,
    category: 'espresso',
    image: '/images/drinks/americano.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    subtitle: 'Traditional · 180 ml',
    description:
      'Equal parts espresso, steamed milk, and velvety micro-foam. Dry enough for the purist, but gentle enough for everyday.',
    price: 280,
    category: 'espresso',
    image: '/images/drinks/cappuccino.jpg',
    dietary: [],
  },
  {
    id: 'flat-white',
    name: 'Flat White',
    subtitle: 'Micro-foam · 160 ml',
    description:
      'A ristretto-based flat white with a higher coffee-to-milk ratio. Silky, strong, and seamlessly balanced.',
    price: 300,
    category: 'espresso',
    image: '/images/drinks/flat-white.jpg',
    dietary: [],
  },
  {
    id: 'latte',
    name: 'Latte',
    subtitle: 'Steamed Milk · 240 ml',
    description:
      'Smooth, full-bodied espresso blended with expertly steamed milk and a whisper of micro-foam on top.',
    price: 300,
    category: 'espresso',
    image: '/images/drinks/latte.jpg',
    dietary: [],
  },
  {
    id: 'cortado',
    name: 'Cortado',
    subtitle: 'Equal Parts · 120 ml',
    description:
      'Espresso cut with an equal measure of warm milk to reduce acidity. Small in size, enormous in character.',
    price: 260,
    category: 'espresso',
    image: '/images/drinks/cortado.jpg',
    dietary: [],
  },
  {
    id: 'macchiato',
    name: 'Macchiato',
    subtitle: 'Espresso Marked · 90 ml',
    description:
      'A single shot of espresso "stained" with a spoonful of creamy micro-foam — precise, elegant, and unapologetically bold.',
    price: 230,
    category: 'espresso',
    image: '/images/drinks/macchiato.jpg',
    dietary: [],
  },

  // ── Filter Coffee ─────────────────────────────────────────────
  {
    id: 'pour-over',
    name: 'Pour Over',
    subtitle: 'Single Origin · V60',
    description:
      'A slow, meditative brew through a V60 dripper. Chosen from our rotating single-origin selection — ask the barista what\'s on today.',
    price: 350,
    category: 'filter',
    image: '/images/drinks/pour-over.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'batch-brew',
    name: 'Batch Brew',
    subtitle: 'Filter · Ready to Pour',
    description:
      'Brewed fresh every 45 minutes on our commercial filter. A reliable, clean cup that lets the beans speak without the wait.',
    price: 220,
    category: 'filter',
    image: '/images/drinks/batch-brew.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'french-press',
    name: 'French Press',
    subtitle: 'Full Immersion · 350 ml',
    description:
      'Ground coarse and steeped for four minutes in a Bodum press. Rich, full-bodied and comforting — best shared.',
    price: 300,
    category: 'filter',
    image: '/images/drinks/french-press.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'aeropress',
    name: 'AeroPress',
    subtitle: 'Smooth & Clean',
    description:
      'Brewed under gentle pressure through an AeroPress for a smooth, low-acidity cup with notable clarity and body.',
    price: 330,
    category: 'filter',
    image: '/images/drinks/aeropress.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },

  // ── Iced Drinks ───────────────────────────────────────────────
  {
    id: 'iced-latte',
    name: 'Iced Latte',
    subtitle: 'Over Ice · 300 ml',
    description:
      'Two shots of espresso poured over chilled milk and ice. Smooth, refreshing, and endlessly drinkable on a warm afternoon.',
    price: 330,
    category: 'iced',
    image: '/images/drinks/iced-latte.jpg',
    dietary: [],
  },
  {
    id: 'iced-americano',
    name: 'Iced Americano',
    subtitle: 'Black Over Ice · 300 ml',
    description:
      'Espresso shots chilled with ice and cold water. Crisp, bright, and a cleaner alternative to cold brew on a time crunch.',
    price: 260,
    category: 'iced',
    image: '/images/drinks/iced-americano.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'iced-cappuccino',
    name: 'Iced Cappuccino',
    subtitle: 'Foam-Topped · 300 ml',
    description:
      'Chilled espresso poured over milk and ice, crowned with a generous layer of cold foam. Cool and intensely satisfying.',
    price: 330,
    category: 'iced',
    image: '/images/drinks/iced-cappuccino.jpg',
    dietary: [],
  },

  // ── Cold Brew ─────────────────────────────────────────────────
  {
    id: 'cold-brew',
    name: 'Cold Brew',
    subtitle: '18-Hour Steep · 250 ml',
    description:
      'Coarse-ground Nepali beans steeped in cold filtered water for 18 hours. Smooth, low-acid, and naturally sweet with zero bitterness.',
    price: 380,
    category: 'cold-brew',
    image: '/images/drinks/cold-brew.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'cold-brew-tonic',
    name: 'Cold Brew Tonic',
    subtitle: 'Coffee & Tonic Water',
    description:
      'Our signature cold brew floated over Indian tonic water. Effervescent, bittersweet, and unexpectedly refined.',
    price: 420,
    category: 'cold-brew',
    image: '/images/drinks/cold-brew-tonic.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'cold-brew-milk',
    name: 'Cold Brew with Milk',
    subtitle: 'Creamy & Smooth',
    description:
      'Our 18-hour cold brew topped with a generous pour of cold whole milk. The gentlest introduction to cold coffee.',
    price: 400,
    category: 'cold-brew',
    image: '/images/drinks/cold-brew-milk.jpg',
    dietary: [],
  },

  // ── Specialty Lattes ──────────────────────────────────────────
  {
    id: 'himalayan-spice-latte',
    name: 'Himalayan Spice Latte',
    subtitle: 'Signature · Seasonal',
    description:
      'Our house espresso steamed with whole milk, infused with cardamom, cinnamon, and a hint of black pepper. Warm and distinctly Nepali.',
    price: 360,
    category: 'specialty',
    image: '/images/drinks/himalayan-spice-latte.jpg',
    dietary: [],
  },
  {
    id: 'brown-butter-latte',
    name: 'Brown Butter Latte',
    subtitle: 'Nutty & Silky',
    description:
      'Espresso blended with steamed milk and a subtle brown-butter syrup for a nutty, caramelised depth that lingers.',
    price: 380,
    category: 'specialty',
    image: '/images/drinks/brown-butter-latte.jpg',
    dietary: [],
  },
  {
    id: 'saffron-latte',
    name: 'Saffron Latte',
    subtitle: 'Floral & Golden',
    description:
      'A delicate latte brightened with a house-made saffron syrup. Floral, gently sweet, and unmistakably indulgent.',
    price: 400,
    category: 'specialty',
    image: '/images/drinks/saffron-latte.jpg',
    dietary: [],
  },
  {
    id: 'matcha-latte',
    name: 'Matcha Latte',
    subtitle: 'Ceremonial Grade · No Coffee',
    description:
      'Ceremonial-grade Japanese matcha whisked and steamed with oat or whole milk. Grassy, creamy, and beautifully calming.',
    price: 380,
    category: 'specialty',
    image: '/images/drinks/matcha-latte.jpg',
    dietary: ['Vegan'],
  },

  // ── Tea & Tisanes ─────────────────────────────────────────────
  {
    id: 'masala-chai',
    name: 'Masala Chai',
    subtitle: 'Spiced Milk Tea',
    description:
      'House-blended black tea simmered with whole spices and finished with full-cream milk. Rich, warming, and deeply familiar.',
    price: 220,
    category: 'tea',
    image: '/images/drinks/masala-chai.jpg',
    dietary: [],
  },
  {
    id: 'ilam-black-tea',
    name: 'Ilam Black Tea',
    subtitle: 'Single-Estate · Nepal',
    description:
      'A single-estate black tea sourced from the Ilam district of eastern Nepal. Crisp, malty, with a clean floral finish.',
    price: 200,
    category: 'tea',
    image: '/images/drinks/ilam-black-tea.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
  {
    id: 'chamomile-honey',
    name: 'Chamomile & Honey',
    subtitle: 'Calming Tisane',
    description:
      'Dried chamomile flowers steeped for five minutes, sweetened with raw wildflower honey and a sliver of fresh ginger.',
    price: 240,
    category: 'tea',
    image: '/images/drinks/chamomile-honey.jpg',
    dietary: ['Vegan'],
  },

  // ── Non-Coffee ────────────────────────────────────────────────
  {
    id: 'hot-chocolate',
    name: 'Hot Chocolate',
    subtitle: 'Dark · 70% Valrhona',
    description:
      'Melted Valrhona 70% dark chocolate whisked into steamed whole milk. Thick, bittersweet, and deeply satisfying.',
    price: 320,
    category: 'non-coffee',
    image: '/images/drinks/hot-chocolate.jpg',
    dietary: [],
  },
  {
    id: 'turmeric-latte',
    name: 'Turmeric Latte',
    subtitle: 'Golden Milk · Warming',
    description:
      'Steamed oat milk blended with turmeric, black pepper, cinnamon, and a touch of honey. Vibrant, anti-inflammatory, and mellow.',
    price: 300,
    category: 'non-coffee',
    image: '/images/drinks/turmeric-latte.jpg',
    dietary: ['Vegan'],
  },
  {
    id: 'fresh-lemonade',
    name: 'Fresh Lemonade',
    subtitle: 'Housemade · Seasonal',
    description:
      'Freshly squeezed lemon juice balanced with a light sugar syrup and sparkling water. Served over ice with a sprig of mint.',
    price: 260,
    category: 'non-coffee',
    image: '/images/drinks/fresh-lemonade.jpg',
    dietary: ['Vegan', 'Dairy-Free'],
  },
];
