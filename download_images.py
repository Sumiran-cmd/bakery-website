import os
import sys
import time
import urllib.request
import urllib.error

# User-Agent header for CDN requests
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
}

def download_image(url, target_path, min_bytes=5000):
    if os.path.exists(target_path) and os.path.getsize(target_path) > min_bytes:
        print(f"  [EXISTS] {target_path} ({os.path.getsize(target_path)} bytes)")
        return True

    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    # Add quality & resizing parameters if unsplash url
    if "unsplash.com" in url and "?" not in url:
        url += "?auto=format&fit=crop&w=800&q=80"
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    data = response.read()
                    if len(data) >= min_bytes:
                        with open(target_path, 'wb') as f:
                            f.write(data)
                        print(f"  [DOWNLOADED] {target_path} ({len(data)} bytes)")
                        return True
                    else:
                        print(f"  [WARN] Data too small ({len(data)} bytes) for {url}")
        except Exception as e:
            print(f"  [RETRY {attempt+1}/3] {target_path} -> {e}")
            time.sleep(1)

    print(f"  [FAILED] Could not download {target_path} from {url}")
    return False

# Mapping of target file path relative to frontend/public/ to image sources
IMAGE_SOURCES = {
    # ── Category Banners ──────────────────────────────────────────
    "images/categories/bakes-and-desserts.jpg": "https://images.unsplash.com/photo-1509440159596-0249088772ff",
    "images/categories/coffee-and-drinks.jpg": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    "images/categories/food-and-snacks.jpg": "https://images.unsplash.com/photo-1540420773420-3366772f4999",

    # ── Bakes & Desserts (16 items) ────────────────────────────────
    "images/bakes/butter-croissant.jpg": "https://images.unsplash.com/photo-1555507036-ab1f4038808a",
    "images/bakes/almond-croissant.jpg": "https://images.unsplash.com/photo-1623334044303-241021148842",
    "images/bakes/pain-au-chocolat.jpg": "https://images.unsplash.com/photo-1608198093002-ad4e005484ec",
    "images/bakes/cinnamon-roll.jpg": "https://images.unsplash.com/photo-1509365465985-25d11c17e812",
    "images/bakes/cheese-croissant.jpg": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73",
    "images/bakes/ham-cheese-croissant.jpg": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af",
    "images/bakes/chocolate-fudge-cake.jpg": "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
    "images/bakes/red-velvet-cake.jpg": "https://images.unsplash.com/photo-1586788680434-30d324b2d46f",
    "images/bakes/classic-cheesecake.jpg": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad",
    "images/bakes/chocolate-brownie.jpg": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
    "images/bakes/lemon-cake-slice.jpg": "https://images.unsplash.com/photo-1519869325930-281384150729",
    "images/bakes/choc-chip-cookie.jpg": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e",
    "images/bakes/double-choc-cookie.jpg": "https://images.unsplash.com/photo-1607958996333-41aef7caef4b",
    "images/bakes/glazed-donut.jpg": "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5",
    "images/bakes/chocolate-donut.jpg": "https://images.unsplash.com/photo-1551024709-8f23befc6f87",
    "images/bakes/spinach-cheese-puff.jpg": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7",

    # ── Coffee & Drinks (28 items) ─────────────────────────────────
    "images/drinks/espresso.jpg": "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04",
    "images/drinks/double-espresso.jpg": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    "images/drinks/americano.jpg": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    "images/drinks/cappuccino.jpg": "https://images.unsplash.com/photo-1572442388796-11668a67e53d",
    "images/drinks/flat-white.jpg": "https://images.unsplash.com/photo-1577968897966-3d4325b36b61",
    "images/drinks/latte.jpg": "https://images.unsplash.com/photo-1534778101976-62847782c213",
    "images/drinks/cortado.jpg": "https://images.unsplash.com/photo-1582293041079-7814c2f12063",
    "images/drinks/macchiato.jpg": "https://images.unsplash.com/photo-1485808191629-50ac43088c15",
    "images/drinks/pour-over.jpg": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38",
    "images/drinks/batch-brew.jpg": "https://images.unsplash.com/photo-1497636577773-f1231844b336",
    "images/drinks/french-press.jpg": "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
    "images/drinks/aeropress.jpg": "https://images.unsplash.com/photo-1511920170033-f8396924c348",
    "images/drinks/iced-latte.jpg": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5",
    "images/drinks/iced-americano.jpg": "https://images.unsplash.com/photo-1517701604599-bb29b565090c",
    "images/drinks/iced-cappuccino.jpg": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735",
    "images/drinks/cold-brew.jpg": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5",
    "images/drinks/cold-brew-tonic.jpg": "https://images.unsplash.com/photo-1517701604599-bb29b565090c",
    "images/drinks/cold-brew-milk.jpg": "https://images.unsplash.com/photo-1556881286-fc6915169721",
    "images/drinks/himalayan-spice-latte.jpg": "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d",
    "images/drinks/brown-butter-latte.jpg": "https://images.unsplash.com/photo-1541167760496-1628856ab772",
    "images/drinks/saffron-latte.jpg": "https://images.unsplash.com/photo-1576092768241-dec231879fc3",
    "images/drinks/matcha-latte.jpg": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a",
    "images/drinks/masala-chai.jpg": "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8",
    "images/drinks/ilam-black-tea.jpg": "https://images.unsplash.com/photo-1576092768241-dec231879fc3",
    "images/drinks/chamomile-honey.jpg": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12",
    "images/drinks/hot-chocolate.jpg": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed",
    "images/drinks/turmeric-latte.jpg": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5",
    "images/drinks/fresh-lemonade.jpg": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd",

    # ── Food & Snacks (27 items) ───────────────────────────────────
    "images/food/avocado-toast.jpg": "https://images.unsplash.com/photo-1525351484163-7529414344d8",
    "images/food/eggs-benedict.jpg": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7",
    "images/food/shakshuka.jpg": "https://images.unsplash.com/photo-1590412200988-a436970781fa",
    "images/food/granola-bowl.jpg": "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2",
    "images/food/full-breakfast.jpg": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666",
    "images/food/blt-sourdough.jpg": "https://images.unsplash.com/photo-1553909489-cd47e0907980",
    "images/food/chicken-pesto-wrap.jpg": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f",
    "images/food/smoked-salmon-bagel.jpg": "https://images.unsplash.com/photo-1509722747041-616f39b57569",
    "images/food/caprese-ciabatta.jpg": "https://images.unsplash.com/photo-1528736235302-52922df5c122",
    "images/food/cheese-toastie.jpg": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af",
    "images/food/ham-gruyere-melt.jpg": "https://images.unsplash.com/photo-1550547660-d9450f859349",
    "images/food/mushroom-truffle-melt.jpg": "https://images.unsplash.com/photo-1509722747041-616f39b57569",
    "images/food/garden-salad.jpg": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
    "images/food/caesar-salad.jpg": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
    "images/food/grain-bowl.jpg": "https://images.unsplash.com/photo-1540420773420-3366772f4999",
    "images/food/salmon-poke-bowl.jpg": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    "images/food/tomato-soup.jpg": "https://images.unsplash.com/photo-1547592166-23ac45744acd",
    "images/food/lentil-soup.jpg": "https://images.unsplash.com/photo-1547592180-85f173990554",
    "images/food/mushroom-bisque.jpg": "https://images.unsplash.com/photo-1547592166-23ac45744acd",
    "images/food/hummus-plate.jpg": "https://images.unsplash.com/photo-1577805947697-89e18249d767",
    "images/food/cheese-board.jpg": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
    "images/food/bruschetta.jpg": "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f",
    "images/food/spring-rolls.jpg": "https://images.unsplash.com/photo-1544025162-d76694265947",
    "images/food/charcuterie-plate.jpg": "https://images.unsplash.com/photo-1541529086526-db283c563270",
    "images/food/truffle-fries.jpg": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
    "images/food/sourdough-toast.jpg": "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04",
    "images/food/seasonal-fruit.jpg": "https://images.unsplash.com/photo-1619566636858-adf3ef46400b",

    # ── Shop Products (12 items) ───────────────────────────────────
    "images/products/ilam-gold-whole-bean.jpg": "https://images.unsplash.com/photo-1587734195503-904fca47e0e9",
    "images/products/kavre-dark-roast-whole-bean.jpg": "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe",
    "images/products/bean-theory-house-blend-ground.jpg": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e",
    "images/products/karma-house-blend-ground.jpg": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e",
    "images/products/mountain-mist-medium-grind.jpg": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    "images/products/bean-theory-espresso-roast.jpg": "https://images.unsplash.com/photo-1587734195503-904fca47e0e9",
    "images/products/karma-espresso-roast.jpg": "https://images.unsplash.com/photo-1587734195503-904fca47e0e9",
    "images/products/double-shot-dark-espresso.jpg": "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe",
    "images/products/ilam-light-roast-filter.jpg": "https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6",
    "images/products/solukhumbu-honey-process.jpg": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    "images/products/kavre-natural-process.jpg": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e",
    "images/products/pour-over-dripper-kit.jpg": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38",
    "images/products/bean-theory-ceramic-mug.jpg": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    "images/products/karma-ceramic-mug.jpg": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    "images/products/french-press-600ml.jpg": "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
}

def main():
    base_dir = os.path.abspath("frontend/public")
    print(f"Starting download to {base_dir}")
    success_count = 0
    fail_count = 0
    
    for rel_path, url in IMAGE_SOURCES.items():
        target = os.path.join(base_dir, rel_path.replace("/", os.sep))
        ok = download_image(url, target)
        if ok:
            success_count += 1
        else:
            fail_count += 1
            
    print(f"\nDone! Success: {success_count}, Failed: {fail_count}")

if __name__ == "__main__":
    main()
