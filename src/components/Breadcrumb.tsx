import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type BreadcrumbItem = {
  label: string
  to?: string
  icon?: ReactNode
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="breadcrumb__item">
              {item.to && !isLast ? (
                <Link to={item.to} className="breadcrumb__link">
                  {item.icon ? <span className="breadcrumb__icon">{item.icon}</span> : null}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="breadcrumb__current">
                  {item.icon ? <span className="breadcrumb__icon">{item.icon}</span> : null}
                  <span>{item.label}</span>
                </span>
              )}

              {!isLast && <span className="breadcrumb__separator">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
