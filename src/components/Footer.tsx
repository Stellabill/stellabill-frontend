import { Github, Linkedin, Send, Twitter } from 'lucide-react'

const footerLinks = {
  Product: ['Features', 'Pricing', 'API', 'Security'],
  Resources: ['Documentation', 'Status', 'Blog', 'Changelog'],
  Company: ['About', 'Contact', 'Grants', 'Careers'],
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <section className="site-footer__brand-col">
          <div className="site-footer__brand">
            <span className="site-footer__logo">S</span>
            <h2>Stellabill</h2>
          </div>
          <p>
            Recurring USDC subscription billing infrastructure on the Stellar blockchain. Built with Soroban smart
            contracts.
          </p>

          <h3>Subscribe to updates</h3>
          <form className="site-footer__subscribe" onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="your@email.com" aria-label="Email address" />
            <button type="submit" aria-label="Send">
              <Send size={18} />
            </button>
          </form>

          <div className="site-footer__socials">
            <button type="button" aria-label="Twitter">
              <Twitter size={18} />
            </button>
            <button type="button" aria-label="GitHub">
              <Github size={18} />
            </button>
            <button type="button" aria-label="LinkedIn">
              <Linkedin size={18} />
            </button>
          </div>
        </section>

        {Object.entries(footerLinks).map(([section, links]) => (
          <section key={section} className="site-footer__links-col">
            <h3>{section}</h3>
            <ul>
              {links.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="site-footer__bottom">
        <small>(c) 2026 Stellabill. Part of the Stellar ecosystem.</small>
        <nav aria-label="Legal">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
        </nav>
      </div>
    </footer>
  )
}
