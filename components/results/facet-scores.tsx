'use client'

import { FACET_DOMAIN_ORDER, DOMAIN_LABELS, DOMAIN_COLORS, type Factor } from '@/lib/ocean-constants'
import { FACET_NAMES, FACET_DOMAIN } from '@/lib/scoring120'

interface Props {
  facets: Record<string, { raw: number; pct: number }>
}

export default function FacetScores({ facets }: Props) {
  return (
    <section className="section-panel rounded-[1.75rem] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
        ลักษณะย่อย 30 ด้าน
      </p>
      <h2 className="section-title mt-2 text-2xl">คะแนนรายลักษณะย่อย</h2>
      <div className="mt-6 space-y-8">
        {FACET_DOMAIN_ORDER.map(domain => {
          const facetCodes = Object.entries(FACET_DOMAIN)
            .filter(([, d]) => d === domain)
            .map(([code]) => code)
          return (
            <div key={domain}>
              <div className="flex items-center gap-2 mb-3">
                <div className="factor-medallion factor-medallion-sm shrink-0"><span>{domain}</span></div>
                <p className="text-sm font-semibold text-slate-700">{DOMAIN_LABELS[domain as Factor].label}</p>
              </div>
              <div className="space-y-2">
                {facetCodes.map(code => {
                  const name = FACET_NAMES[code as keyof typeof FACET_NAMES]
                  const facet = facets[code]
                  const pct = facet?.pct ?? 0
                  return (
                    <div key={code} className="flex items-center gap-3">
                      <span className="w-6 shrink-0 text-xs font-mono text-slate-400">{code}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">{name}</span>
                          <span className="text-xs font-semibold text-slate-700">{Math.round(pct)}%</span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(69,98,118,0.10)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: DOMAIN_COLORS[domain as Factor].barColor }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
