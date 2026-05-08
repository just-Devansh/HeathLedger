import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Car, ShoppingBag, Coffee, Utensils, Plus } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// 4 quick actions — amounts always entered manually
const QUICK_ACTIONS = [
  { id: 'rapido', label: 'Rapido', category: 'Commute',                 note: 'Rapido', Icon: Car },
  { id: 'zepto',  label: 'Zepto',  category: 'Zepto/Blinkit/Instamart', note: 'Zepto',  Icon: ShoppingBag },
  { id: 'lunch',  label: 'Lunch',  category: 'Food',                    note: 'Lunch',  Icon: Coffee },
  { id: 'dinner', label: 'Dinner', category: 'Food',                    note: 'Dinner', Icon: Utensils },
]

// 5 arc positions: 4 quick actions + 1 manual entry (null = manual)
// Order maps to ANGLES below: [150°, 120°, 90°, 60°, 30°]
//   150° lower-left  → Lunch
//   120° upper-left  → Rapido
//    90° top-center  → Manual entry
//    60° upper-right → Zepto
//    30° lower-right → Dinner
const ARC_ITEMS = [
  QUICK_ACTIONS[2],  // Lunch  — lower-left
  QUICK_ACTIONS[0],  // Rapido — upper-left
  null,              // Manual — top-center
  QUICK_ACTIONS[1],  // Zepto  — upper-right
  QUICK_ACTIONS[3],  // Dinner — lower-right
]

const ANGLES = [150, 120, 90, 60, 30]
const RADIUS  = 130  // px — gives ~67px edge-to-edge spacing between buttons
const FAB_Y   = 96   // px from viewport bottom to FAB center (with -44px marginTop lift)

function arcPos(deg) {
  const r = (deg * Math.PI) / 180
  return { x: RADIUS * Math.cos(r), y: RADIUS * Math.sin(r) }
}

export default function RadialMenu({ isOpen, onToggle, onActionSelect, onManualEntry }) {
  const { theme, isDark } = useTheme()

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onToggle() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onToggle])

  const n = ARC_ITEMS.length

  // Glass surface values for quick-action buttons
  const glassBg     = isDark ? 'rgba(22,22,22,0.92)' : 'rgba(255,255,255,0.94)'
  const glassBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'
  const glassInset  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)'
  const glassShadow = isDark
    ? `0 6px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`
    : `0 6px 24px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.75)`

  const overlay = (
    <>
      {/* Backdrop — z-39, sits below nav (z-40) so nav tabs stay tappable */}
      <div
        onClick={onToggle}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.26)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 39,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* Arc items */}
      {ARC_ITEMS.map((item, i) => {
        const { x, y } = arcPos(ANGLES[i])
        const isManual = item === null

        // Container bottom: places button center at FAB_Y + y
        // btn_center = cBottom + labelH(14) + gap(4) + halfBtn(26) = cBottom + 44
        const cBottom = FAB_Y + y - 44

        // Stagger: open left→right, close right→left
        const delay = isOpen
          ? `${i * 42}ms`
          : `${(n - 1 - i) * 28}ms`

        return (
          <div
            key={isManual ? 'manual' : item.id}
            style={{
              position: 'fixed',
              bottom: cBottom,
              left: `calc(50% + ${x}px)`,
              zIndex: 50,
              pointerEvents: isOpen ? 'auto' : 'none',
            }}
          >
            {/* Animation wrapper: translateX(-50%) centers over arc point; scale+fade on open/close */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
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
              {isManual ? (
                // Manual entry — gradient FAB style, visually distinct
                <button
                  onClick={() => onManualEntry()}
                  aria-label="Add expense manually"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradEnd})`,
                    boxShadow: `0 4px 20px rgba(${theme.shadowRgb},0.45), inset 0 1px 0 rgba(255,255,255,0.15)`,
                    color: 'white',
                    cursor: 'pointer',
                    outline: 'none',
                    border: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    flexShrink: 0,
                    transition: 'transform 0.12s ease',
                  }}
                  onPointerDown={e  => { e.currentTarget.style.transform = 'scale(0.88)' }}
                  onPointerUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
                  onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <Plus size={22} strokeWidth={2.5} />
                </button>
              ) : (
                // Quick-action — glassmorphism style
                <button
                  onClick={() => onActionSelect(item)}
                  aria-label={item.label}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: glassBg,
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border: `1.5px solid ${glassBorder}`,
                    boxShadow: glassShadow,
                    color: theme.primary,
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    flexShrink: 0,
                    transition: 'transform 0.12s ease',
                  }}
                  onPointerDown={e  => { e.currentTarget.style.transform = 'scale(0.88)' }}
                  onPointerUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
                  onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <item.Icon size={20} strokeWidth={2} />
                </button>
              )}

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.68)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  textShadow: isDark
                    ? '0 1px 8px rgba(0,0,0,1)'
                    : '0 1px 6px rgba(255,255,255,1), 0 0 12px rgba(255,255,255,0.8)',
                }}
              >
                {isManual ? 'Custom' : item.label}
              </span>
            </div>
          </div>
        )
      })}
    </>
  )

  return (
    <>
      {/* FAB — rendered inline inside the nav grid */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Close quick actions' : 'Add expense'}
        aria-expanded={isOpen}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          marginTop: '-44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradEnd})`,
          boxShadow: isOpen
            ? `0 6px 30px rgba(${theme.shadowRgb},0.7), 0 0 0 6px rgba(${theme.shadowRgb},0.16)`
            : `0 4px 20px rgba(${theme.shadowRgb},0.5)`,
          transition: 'box-shadow 0.3s ease',
          position: 'relative',
          zIndex: 50,
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          <Plus size={24} strokeWidth={2.5} />
        </div>
      </button>

      {/* Arc overlay via portal — appended to document.body */}
      {createPortal(overlay, document.body)}
    </>
  )
}
