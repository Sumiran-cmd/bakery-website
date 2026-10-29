import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImagePlaceholder from '../components/common/ImagePlaceholder';
import './HomePage.css';

const HERO_SLIDES = [
  {
    id: 1,
    image: '/images/hero1.jpg',
    eyebrow: 'Artisanal Nepali Coffee',
    title: (
      <>
        NOT SIMPLY BREWED,<br />BUT BEAUTIFULLY<br />CRAFTED.
      </>
    ),
    subtitle: 'From the heart of the Himalayas to your cup, discover coffee shaped by nature and perfected by craft.',
    btnPrimary: { text: 'Shop Now', link: '/shop' },
    btnSecondary: { text: 'Our Story', link: '/our-story' },
  },
  {
    id: 2,
    image: '/images/hero2.jpg',
    eyebrow: 'Freshly Roasted Weekly',
    title: (
      <>
        ROASTED IN SMALL<br />BATCHES, CRAFTED<br />FOR PURE TASTE.
      </>
    ),
    subtitle: 'Thoughtfully sourced. Beautifully roasted. Made for those who appreciate the extraordinary.',
    btnPrimary: { text: 'Explore Beans', link: '/shop?category=whole-bean' },
    btnSecondary: { text: 'Brew Guides', link: '/shop?category=accessories' },
  },
  {
    id: 3,
    image: '/images/hero3.jpg',
    eyebrow: 'Direct Trade Sourcing',
    title: (
      <>
        EMPOWERING NEPAL’S<br />MOUNTAIN FARMERS<br />WITH EVERY HARVEST.
      </>
    ),
    subtitle: 'Celebrating Nepal\'s coffee-growing heritage through exceptional beans and a passion for every brew.',
    btnPrimary: { text: 'Our Coffee Story', link: '/our-story' },
    btnSecondary: { text: 'Shop All Coffee', link: '/shop' },
  },
];

const STORY_CARDS = [
  {
    title: 'Single-Origin Sourcing',
    desc: 'Every bean is traceable to a specific farm or cooperative in Nepal. We work directly with farmers in Ilam, Kavre, and Solukhumbu.',
    icon: '🌱',
  },
  {
    title: 'Specialty Grade Coffee',
    desc: 'All our coffees score above 80 on the SCA scale. We roast in small batches weekly to ensure peak freshness.',
    icon: '☕',
  },
  {
    title: 'Transparent Pricing',
    desc: 'We pay farmers above Fair Trade premiums and publish our full supply chain. When farmers thrive, coffee gets better.',
    icon: '🤝',
  },
];

const FEATURED_CATEGORIES = [
  { name: 'Whole Bean', slug: 'whole-bean', tagline: 'For the discerning home brewer', image: '/images/categories/whole-bean.jpg' },
  { name: 'Ground Coffee', slug: 'ground-coffee', tagline: 'Ready when you are', image: '/images/categories/ground-coffee.jpg' },
  { name: 'Single Origin', slug: 'single-origin', tagline: 'Taste Nepal\'s terroir', image: '/images/categories/single-origin.jpg' },
  { name: 'Accessories', slug: 'accessories', tagline: 'Brew it right', image: '/images/categories/accessories.jpg' },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);

  // Preload all hero images so there is never a blank or loading flash
  useEffect(() => {
    HERO_SLIDES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  // Automatically swap hero images in a continuous loop: hero1 -> hero2 -> hero3 -> hero1...
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        setPrevSlide(prev);
        return (prev + 1) % HERO_SLIDES.length;
      });
    }, 5500);
    return () => clearInterval(interval);
  }, [currentSlide]);

  const goToSlide = (idx) => {
    if (idx === currentSlide) return;
    setPrevSlide(currentSlide);
    setCurrentSlide(idx);
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="home-page">
      {/* Hero Carousel */}
      <section
        className="home-hero"
        aria-labelledby="hero-heading"
      >
        {/* Dynamic Image Layers with Seamless Cross-Fade */}
        <div className="home-hero-bg">
          {HERO_SLIDES.map((s, idx) => {
            const isActive = idx === currentSlide;
            const isPrevious = idx === prevSlide;
            return (
              <div
                key={s.id}
                className={`hero-slide-layer slide-${idx + 1} ${isActive ? 'active' : ''} ${isPrevious ? 'previous' : ''}`}
                aria-hidden={!isActive}
              >
                <div className="hero-slide-img-wrapper">
                  <img
                    src={s.image}
                    alt=""
                    className="hero-slide-img"
                    loading="eager"
                    decoding="async"
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="home-hero-overlay" />

        {/* Content */}
        <div className="container home-hero-content">
          <div className="hero-text" key={currentSlide}>
            <span className="hero-eyebrow">{slide.eyebrow}</span>
            <h1 id="hero-heading" className="hero-title">
              {slide.title}
            </h1>
            <p className="hero-subtitle">{slide.subtitle}</p>
            <div className="hero-actions">
              <Link to={slide.btnPrimary.link} className="btn btn-primary btn-lg" id="hero-shop-btn">
                {slide.btnPrimary.text}
              </Link>
              <Link
                to={slide.btnSecondary.link}
                className="btn btn-ghost btn-lg"
                id="hero-story-btn"
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              >
                {slide.btnSecondary.text}
              </Link>
            </div>

            {/* Slide Navigation Indicators */}
            <div className="hero-indicators" role="tablist" aria-label="Hero slides">
              {HERO_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentSlide}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="home-categories" aria-label="Shop by category">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
          </div>
          <div className="category-grid">
            {FEATURED_CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className="category-card"
                aria-label={`Shop ${cat.name}`}
              >
                <div className="category-card-img">
                  <ImagePlaceholder
                    src={cat.image}
                    aspectRatio="4/5"
                    label={cat.name}
                    showIcon={true}
                  />
                </div>
                <div className="category-card-info">
                  <h3>{cat.name}</h3>
                  <p>{cat.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="home-story" aria-label="Our story">
        <div className="container">
          <div className="story-grid">
            <div className="story-img">
              <ImagePlaceholder
                src="/images/farmer.jpg"
                aspectRatio="3/4"
                label="Coffee Farmer"
                showIcon={true}
                rounded
              />
            </div>
            <div className="story-content">
              <p className="section-eyebrow">Our Philosophy</p>
              <h2 className="section-title">
                Rooted in<br />Nepal's Mountains
              </h2>
              <p className="story-body">
                We offer a wide selection of unique Arabica coffee varieties, transparently
                sourced from small cooperatives and independent farming families in Ilam,
                Kavre, and Solukhumbu districts of Nepal.
              </p>
              <p className="story-body">
                Our roasters are obsessive about freshness. Every order ships within 48
                hours of roasting—so you're getting coffee at its absolute peak.
              </p>
              <Link to="/our-story" className="btn btn-secondary" id="home-story-link">
                Read Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="home-values" aria-label="Our values">
        <div className="container">
          <div className="values-grid">
            {STORY_CARDS.map(card => (
              <div key={card.title} className="value-card">
                <div className="value-icon" aria-hidden="true">{card.icon}</div>
                <h3 className="value-title">{card.title}</h3>
                <p className="value-desc">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop CTA Banner */}
      <section className="home-cta-banner" aria-label="Shop now">
        <div className="container">
          <div className="cta-banner-inner">
            <div className="cta-banner-img">
              <ImagePlaceholder
                src="/images/coffee-bag.jpg"
                aspectRatio="1/1"
                label="Coffee Bag"
              />
            </div>
            <div className="cta-banner-content">
              <p className="section-eyebrow">Find exclusive for you at Bean Theory</p>
              <h2>Premium coffee<br />delivered to your door</h2>
              <p>
                Free shipping on orders over Rs. 2,000. Same-week delivery across Kathmandu valley.
              </p>
              <Link to="/shop" className="btn btn-primary" id="cta-shop-now-btn">
                Shop All Coffee
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brewing Guide teaser */}
      <section className="home-brewing" aria-label="Brewing guides">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Brew Better Coffee</h2>
            <p className="section-sub">Simple guides to help you get the most from your beans</p>
          </div>
          <div className="brewing-grid">
            {['Pour Over', 'French Press', 'Espresso', 'Cold Brew'].map((method) => (
              <div key={method} className="brewing-card">
                <div className="brewing-card-img">
                  <ImagePlaceholder
                    src={`/images/brewing/${method.toLowerCase().replace(' ', '-')}.jpg`}
                    aspectRatio="16/9"
                    label={method}
                  />
                </div>
                <div className="brewing-card-info">
                  <h3>{method}</h3>
                  <Link to="/blog" className="brewing-link">Learn More →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
