import { Link, Outlet, useLocation } from 'react-router-dom'
import LandingNavbar from './LandingNavbar'

const nav = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/subscriptions', label: 'Subscriptions' },
  { path: '/plans', label: 'Plans' },
  { path: '/ui-kit', label: 'UI Kit (Mockups)' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0a' }}>
      <LandingNavbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <aside
          style={{
            width: 220,
            background: '#1a1a2e',
            color: '#fff',
            padding: '1.5rem 0',
          }}
        >
          <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
            <strong style={{ fontSize: '1.1rem' }}>Stellarbill</strong>
          </div>
          <nav>
            {nav.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'block',
                  padding: '0.5rem 1rem',
                  color: location.pathname === path ? '#fff' : '#94a3b8',
                  background: location.pathname === path ? '#2d2d44' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
