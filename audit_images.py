import os
import re

public_dir = os.path.abspath('frontend/public')

def check_file(rel_path):
    clean = rel_path.lstrip('/')
    full = os.path.join(public_dir, clean.replace('/', os.sep))
    if not os.path.exists(full):
        return False, f"MISSING: {clean}"
    sz = os.path.getsize(full)
    if sz < 1000:
        return False, f"EMPTY/TOO SMALL ({sz}b): {clean}"
    return True, f"OK ({sz}b): {clean}"

print("=== AUDIT BEGIN ===")

# 1. Bakery
with open('frontend/src/data/bakeryProducts.js', 'r', encoding='utf-8') as f:
    text = f.read()
bakes = re.findall(r"image:\s*'([^']+)'", text)
print(f"Checking {len(bakes)} bakery items:")
bakes_ok = True
for img in bakes:
    ok, msg = check_file(img)
    if not ok:
        print("  FAIL:", msg)
        bakes_ok = False
print(f"Bakery all ok: {bakes_ok}")

# 2. Drinks
with open('frontend/src/data/drinksProducts.js', 'r', encoding='utf-8') as f:
    text = f.read()
drinks = re.findall(r"image:\s*'([^']+)'", text)
print(f"\nChecking {len(drinks)} drink items:")
drinks_ok = True
for img in drinks:
    ok, msg = check_file(img)
    if not ok:
        print("  FAIL:", msg)
        drinks_ok = False
print(f"Drinks all ok: {drinks_ok}")

# 3. Food
with open('frontend/src/data/foodProducts.js', 'r', encoding='utf-8') as f:
    text = f.read()
foods = re.findall(r"image:\s*'([^']+)'", text)
print(f"\nChecking {len(foods)} food items:")
foods_ok = True
for img in foods:
    ok, msg = check_file(img)
    if not ok:
        print("  FAIL:", msg)
        foods_ok = False
print(f"Food all ok: {foods_ok}")

# 4. Menu categories
with open('frontend/src/data/menuCategories.js', 'r', encoding='utf-8') as f:
    text = f.read()
cats = re.findall(r"image:\s*'([^']+)'", text)
print(f"\nChecking {len(cats)} menu categories:")
cats_ok = True
for img in cats:
    ok, msg = check_file(img)
    if not ok:
        print("  FAIL:", msg)
        cats_ok = False
print(f"Menu categories all ok: {cats_ok}")

# 5. HomePage images
home_imgs = [
    '/images/hero1.jpg',
    '/images/hero2.jpg',
    '/images/hero3.jpg',
    '/images/farmer.jpg',
    '/images/coffee-bag.jpg',
    '/images/categories/whole-bean.jpg',
    '/images/categories/ground-coffee.jpg',
    '/images/categories/single-origin.jpg',
    '/images/categories/accessories.jpg',
    '/images/brewing/pour-over.jpg',
    '/images/brewing/french-press.jpg',
    '/images/brewing/espresso.jpg',
    '/images/brewing/cold-brew.jpg',
]
print(f"\nChecking {len(home_imgs)} home page images:")
home_ok = True
for img in home_imgs:
    ok, msg = check_file(img)
    if not ok:
        print("  FAIL:", msg)
        home_ok = False
print(f"HomePage all ok: {home_ok}")

# 6. Fallback images
fallbacks = [
    '/images/placeholders/bakes-desserts-placeholder.jpg',
    '/images/placeholders/coffee-drinks-placeholder.jpg',
    '/images/placeholders/drink-placeholder.jpg',
    '/images/placeholders/food-placeholder.jpg',
    '/images/placeholders/food-snacks-placeholder.jpg',
    '/images/placeholders/product-placeholder.jpg',
]
print(f"\nChecking {len(fallbacks)} placeholder fallbacks:")
fb_ok = True
for img in fallbacks:
    ok, msg = check_file(img)
    if not ok:
        print("  FAIL:", msg)
        fb_ok = False
print(f"Fallbacks all ok: {fb_ok}")

# 7. Catalog products
shop_imgs = [
    '/images/products/ilam-gold-whole-bean.jpg',
    '/images/products/kavre-dark-roast-whole-bean.jpg',
    '/images/products/bean-theory-house-blend-ground.jpg',
    '/images/products/mountain-mist-medium-grind.jpg',
    '/images/products/bean-theory-espresso-roast.jpg',
    '/images/products/double-shot-dark-espresso.jpg',
    '/images/products/ilam-light-roast-filter.jpg',
    '/images/products/solukhumbu-honey-process.jpg',
    '/images/products/kavre-natural-process.jpg',
    '/images/products/pour-over-dripper-kit.jpg',
    '/images/products/bean-theory-ceramic-mug.jpg',
    '/images/products/french-press-600ml.jpg',
]
print(f"\nChecking {len(shop_imgs)} shop catalog products:")
shop_ok = True
for img in shop_imgs:
    ok, msg = check_file(img)
    if not ok:
        print("  FAIL:", msg)
        shop_ok = False
print(f"Shop products all ok: {shop_ok}")

total_count = len(bakes) + len(drinks) + len(foods) + len(cats) + len(home_imgs) + len(fallbacks) + len(shop_imgs)
all_passed = bakes_ok and drinks_ok and foods_ok and cats_ok and home_ok and fb_ok and shop_ok

print(f"\n==========================================")
print(f"TOTAL AUDITED IMAGES: {total_count}")
print(f"OVERALL STATUS: {'ALL PASSED 100%' if all_passed else 'SOME FAILED'}")
print(f"==========================================")
