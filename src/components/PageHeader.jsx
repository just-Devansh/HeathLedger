import { useTheme } from '../context/ThemeContext'

export default function PageHeader({ label, title, subtitle, right, animate = false, children }) {
  const { theme } = useTheme()
  return (
    <header className={`${animate ? 'header-animate ' : ''}pt-8 pb-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase"
            style={{ color: theme.accent, letterSpacing: '0.13em' }}
          >
            {label}
          </p>
          <h1
            className="font-display mt-2"
            style={{
              color: theme.heading,
              fontSize: '2.35rem',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-0.035em',
            }}
          >
            {title}
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: theme.textMuted }}>
            {subtitle}
          </p>
        </div>
        {right}
      </div>
      {children}
    </header>
  )
}
