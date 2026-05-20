import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'

// Angle offsets from 90° (top-center) for each action slot.
// With 4 slots: [120°, 60°, 150°, 30°] → sorted desc → [150°,120°,manual@90°,60°,30°]
// Matches the original hardcoded layout exactly.
const SLOT_OFFSETS = [30, -30, 60, -60]

const RADIUS = 130  // px
const FAB_Y  = 96   // px from viewport bottom to FAB center

function arcPos(deg) {
  const r = (deg * Math.PI) / 180
  return { x: RADIUS * Math.cos(r), y: RADIUS * Math.sin(r) }
}

export default function RadialMenu({ isOpen, onToggle, onActionSelect, onManualEntry, quickActions = [], categories = [] }) {
  const { theme, isDark } = useTheme()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onToggle() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onToggle])

  // Resolve each quick action to its category object; skip any whose category was deleted.
  const actions = quickActions
    .map(action => {
      const cat = categories.find(c => c.id === action.categoryId)
      return cat ? { name: action.name, cat } : null
    })
    .filter(Boolean)
    .slice(0, 4)

  // Build arc: manual always at 90°, actions at symmetric offsets around it.
  const arcItems = [{ isManual: true, angle: 90 }]
  actions.forEach((action, i) => arcItems.push({ ...action, angle: 90 + SLOT_OFFSETS[i] }))
  arcItems.sort((a, b) => b.angle - a.angle)  // high angle = left side of arc

  const n = arcItems.length

  const glassBg     = isDark ? 'rgba(22,22,22,0.92)' : 'rgba(255,255,255,0.94)'
  const glassBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'
  const glassShadow = isDark
    ? `0 6px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`
    : `0 6px 24px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.75)`

  const overlay = (
    <>
      <div
        onClick={onToggle}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.26)',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
          zIndex: 39,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {arcItems.map((item, i) => {
        const { x, y } = arcPos(item.angle)
        const cBottom = FAB_Y + y - 44
        const delay = isOpen ? `${i * 42}ms` : `${(n - 1 - i) * 28}ms`

        return (
          <div
            key={item.isManual ? 'manual' : item.cat.id}
            style={{
              position: 'fixed',
              bottom: cBottom,
              left: `calc(50% + ${x}px)`,
              zIndex: 50,
              pointerEvents: isOpen ? 'auto' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                opacity: isOpen ? 1 : 0,
                transform: isOpen
                  ? 'translateX(-50%) scale(1) translateY(0px)'
                  : 'translateX(-50%) scale(0.68) translateY(18px)',
                transition: isOpen
                  ? `opacity 0.22s ease ${delay}, transform 0.36s cubic-bezier(0.34,1.56,0.64,1) ${delay}`
                  : `opacity 0.18s ease ${delay}, transform 0.22s ease ${delay}`,
                willChange: 'opacity, transform',
                transformOrigin: 'bottom center',
              }}
            >
              {item.isManual ? (
                <button
                  onClick={() => onManualEntry()}
                  aria-label="Add expense manually"
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradEnd})`,
                    boxShadow: `0 4px 20px rgba(${theme.shadowRgb},0.45), inset 0 1px 0 rgba(255,255,255,0.15)`,
                    color: 'white', cursor: 'pointer', outline: 'none', border: 'none',
                    WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                    transition: 'transform 0.12s ease',
                  }}
                  onPointerDown={e  => { e.currentTarget.style.transform = 'scale(0.88)' }}
                  onPointerUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
                  onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <Plus size={22} strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  onClick={() => onActionSelect({ categoryId: item.cat.id, note: item.name ?? item.cat.name })}
                  aria-label={item.name ?? item.cat.name}
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: glassBg,
                    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                    border: `1.5px solid ${glassBorder}`,
                    boxShadow: glassShadow,
                    color: theme.primary, cursor: 'pointer', outline: 'none',
                    WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                    transition: 'transform 0.12s ease',
                  }}
                  onPointerDown={e  => { e.currentTarget.style.transform = 'scale(0.88)' }}
                  onPointerUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
                  onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {getIcon(item.cat.icon, { size: 20, strokeWidth: 2 })}
                </button>
              )}

              <span
                style={{
                  display: 'block',
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                  color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.68)',
                  whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
                  textShadow: isDark
                    ? '0 1px 8px rgba(0,0,0,1)'
                    : '0 1px 6px rgba(255,255,255,1), 0 0 12px rgba(255,255,255,0.8)',
                  maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {item.isManual ? 'Custom' : (item.name ?? item.cat.name)}
              </span>
            </div>
          </div>
        )
      })}
    </>
  )

  return (
    <>
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Close quick actions' : 'Add expense'}
        aria-expanded={isOpen}
        style={{
          width: 52, height: 52, borderRadius: '50%', marginTop: '-44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradEnd})`,
          boxShadow: isOpen
            ? `0 6px 30px rgba(${theme.shadowRgb},0.7), 0 0 0 6px rgba(${theme.shadowRgb},0.16)`
            : `0 4px 20px rgba(${theme.shadowRgb},0.5)`,
          transition: 'box-shadow 0.3s ease',
          position: 'relative', zIndex: 50, color: 'white', border: 'none',
          cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          <Plus size={24} strokeWidth={2.5} />
        </div>
      </button>

      {createPortal(overlay, document.body)}
    </>
  )
}
