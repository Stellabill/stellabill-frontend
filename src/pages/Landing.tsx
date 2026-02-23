import LandingNavbar from '../components/LandingNavbar'
import Hero from '../components/Landing/Hero'

export default function Landing() {
  return (
    <div style={{ background: '#020b0d', minHeight: '100vh' }}>
      <LandingNavbar />
      
      <main>
        <Hero />

        {/* Sections for anchor links */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
          <section id="product" style={{ padding: '6rem 0', minHeight: '400px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '2rem', marginBottom: '1rem' }}>Product</h2>
            <p style={{ color: '#94a3b8' }}>Product information goes here...</p>
          </section>

          <section id="pricing" style={{ padding: '6rem 0', minHeight: '400px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '2rem', marginBottom: '1rem' }}>Pricing</h2>
            <p style={{ color: '#94a3b8' }}>Pricing information goes here...</p>
          </section>

          <section id="docs" style={{ padding: '6rem 0', minHeight: '400px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '2rem', marginBottom: '1rem' }}>Documentation</h2>
            <p style={{ color: '#94a3b8' }}>Documentation goes here...</p>
          </section>

          <section id="contact" style={{ padding: '6rem 0', minHeight: '400px' }}>
            <h2 style={{ color: '#ffffff', fontSize: '2rem', marginBottom: '1rem' }}>Contact</h2>
            <p style={{ color: '#94a3b8' }}>Contact information goes here...</p>
          </section>
        </div>
      </main>
    </div>
  )
}
