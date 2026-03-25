'use client'

interface Trait {
  key: string
  label: string
  sublabel: string
  hue: number
  dx: number   // horizontal offset from center (px)
  dy: number   // vertical offset from center (px)
  rotate: number
  z: number
}

// Badges are 72px wide; step of 80px → ~10px edge overlap per adjacent pair
const TRAITS: Trait[] = [
  { key: 'O', label: 'การเปิดรับประสบการณ์', sublabel: 'Openness',         hue: 210, dx: -160, dy:  8, rotate: -12, z: 2 },
  { key: 'C', label: 'ความรับผิดชอบ',         sublabel: 'Conscientiousness', hue: 38,  dx:  -80, dy: -8, rotate:   6, z: 3 },
  { key: 'E', label: 'ความเปิดเผย',            sublabel: 'Extraversion',      hue: 158, dx:    0, dy: 12, rotate:  -2, z: 5 },
  { key: 'A', label: 'ความเป็นมิตร',           sublabel: 'Agreeableness',     hue: 268, dx:   80, dy: -6, rotate:   9, z: 4 },
  { key: 'N', label: 'ความไม่มั่นคงทางอารมณ์', sublabel: 'Neuroticism',       hue: 348, dx:  160, dy:  6, rotate:  -7, z: 2 },
]

function TraitIcon({ traitKey, size = 28 }: { traitKey: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    // Openness — sun / spark of ideas
    O: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    ),
    // Conscientiousness — clipboard / checklist
    C: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    // Extraversion — people / social group
    E: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    // Agreeableness — heart
    A: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    // Neuroticism — lightning / storm
    N: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  }
  return <>{icons[traitKey]}</>
}

export default function OceanTraitCloud() {
  return (
    <div
      className="trait-cloud-wrap"
      role="list"
      aria-label="5 มิติ OCEAN"
    >
      {TRAITS.map((t) => {
        const bg    = `hsl(${t.hue}, 52%, 96%)`
        const color = `hsl(${t.hue}, 48%, 38%)`

        return (
          <div
            key={t.key}
            role="listitem"
            className="trait-badge"
            data-key={t.key}
            style={{
              '--dx':  `${t.dx}px`,
              '--dy':  `${t.dy}px`,
              '--rot': `${t.rotate}deg`,
              zIndex: t.z,
              background: bg,
              color,
            } as React.CSSProperties}
          >
            <TraitIcon traitKey={t.key} size={28} />
            <span className="trait-tooltip">
              <span className="trait-tooltip-en">{t.sublabel}</span>
              <span className="trait-tooltip-th">{t.label}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
