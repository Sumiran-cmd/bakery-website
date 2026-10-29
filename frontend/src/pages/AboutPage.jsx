import { Link } from 'react-router-dom';
import { Coffee, Mountain, Heart, Award, ArrowRight, ShieldCheck, Sun } from 'lucide-react';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container about-hero-container">
          <span className="hero-eyebrow">The Bean Theory Story</span>
          <h1 className="hero-title">From Himalayan Terraces to Your Morning Cup</h1>
          <p className="hero-subtitle">
            Pioneering single-origin specialty coffee cultivation in Nepal since 2011. Bridging indigenous mountain farming families directly with conscious coffee lovers.
          </p>
        </div>
      </section>

      {/* Origin Story Grid */}
      <section className="about-section story-section">
        <div className="container">
          <div className="story-grid">
            <div className="story-content">
              <span className="section-label">Our Philosophy</span>
              <h2>Theory in Every Bean</h2>
              <p>
                At Bean Theory, we believe that coffee is more than just a morning routine—it is a closed loop of shared prosperity. When we empower smallholder farmers in Ilam, Kavre, and Nuwakot with fair-trade pre-financing and eco-sustainable techniques, they produce an extraordinary harvest.
              </p>
              <p>
                Our roastery in Patan, Nepal roast only 100% shade-grown Arabica harvested at high elevations between 1,200m and 1,800m. The cool Himalayan mist slows down cherry maturation, producing dense beans packed with floral complexity, crisp citrus acidity, and rich caramel sweetness.
              </p>
              <div className="farmer-quote">
                <blockquote>
                  "Bean Theory isn’t just our name—it’s our standard. Direct-trade, zero intermediaries, and full pride in Nepali craftsmanship."
                </blockquote>
              </div>
            </div>

            <div className="story-stats-card card">
              <div className="stat-block">
                <Mountain className="stat-icon" size={32} />
                <span className="stat-num">1,800m</span>
                <span className="stat-desc">Peak Himalayan Elevation</span>
              </div>
              <div className="stat-block">
                <Heart className="stat-icon" size={32} />
                <span className="stat-num">120+</span>
                <span className="stat-desc">Smallholder Farming Families</span>
              </div>
              <div className="stat-block">
                <Sun className="stat-icon" size={32} />
                <span className="stat-num">100%</span>
                <span className="stat-desc">Sun-Dried on Raised African Beds</span>
              </div>
              <div className="stat-block">
                <Award className="stat-icon" size={32} />
                <span className="stat-num">SCA 86+</span>
                <span className="stat-desc">Certified Specialty Cup Score</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainable Practices */}
      <section className="about-section values-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-label">Sustainable Sourcing</span>
            <h2>Our Ethical Commitments</h2>
            <p className="section-desc">Every purchase directly fuels high-altitude organic farming communities.</p>
          </div>

          <div className="values-grid">
            <div className="value-card card">
              <div className="val-icon-box">
                <Coffee size={24} />
              </div>
              <h3>Micro-Batch Roasting</h3>
              <p>
                We roast in small, artisanal batches to highlight the individual terroir of each mountain micro-region, preserving volatile aroma compounds.
              </p>
            </div>

            <div className="value-card card">
              <div className="val-icon-box">
                <ShieldCheck size={24} />
              </div>
              <h3>Fair Price Guarantee</h3>
              <p>
                We pay 40% above fair-trade market rates to our farming cooperatives, ensuring sustainable livelihoods and community reinvestment.
              </p>
            </div>

            <div className="value-card card">
              <div className="val-icon-box">
                <Heart size={24} />
              </div>
              <h3>Women-Led Collectives</h3>
              <p>
                Over 70% of our coffee hand-sorting and natural cherry processing is led and owned by women farming collectives in Eastern Nepal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roastery Invitation CTA */}
      <section className="roastery-cta">
        <div className="container cta-container">
          <div className="cta-box card">
            <h2>Taste the Himalayan Terroir</h2>
            <p>Order fresh whole beans or custom-ground roasts, shipped freshly roasted across Nepal.</p>
            <div className="cta-buttons">
              <Link to="/shop" className="btn btn-primary">
                Shop Specialty Coffees <ArrowRight size={16} />
              </Link>
              <Link to="/shop?category=whole-bean" className="btn btn-outline">
                Browse Whole Bean
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
