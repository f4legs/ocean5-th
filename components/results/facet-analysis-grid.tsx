'use client'

import { FACET_DOMAIN_ORDER, DOMAIN_COLORS, DOMAIN_LABELS, pctToLabel, type Factor } from '@/lib/ocean-constants'
import { FACET_LABELS, FACETS_BY_DOMAIN, type FacetCode } from '@/lib/scoring120'

interface FacetScoreValue {
  raw?: number
  pct: number
}

interface Props {
  facets: Record<string, FacetScoreValue | undefined>
}

export default function FacetAnalysisGrid({ facets }: Props) {
  return (
    <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
      {FACET_DOMAIN_ORDER.map(domain => {
        const info = DOMAIN_LABELS[domain as Factor]
        const palette = DOMAIN_COLORS[domain as Factor]
        const facetCodes = FACETS_BY_DOMAIN[domain as Factor]
        const domainScore = Math.round(
          facetCodes.reduce((sum, code) => sum + Math.round(facets[code]?.pct ?? 0), 0) / facetCodes.length
        )

        return (
          <section key={domain} className="border-t-2 pt-3.5" style={{ borderColor: palette.barColor }}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: palette.chipBg, color: palette.chipText }}
                  >
                    {domain}
                  </span>
                  <h3 className="min-w-0 text-sm font-semibold text-slate-800">
                    {info.label}
                  </h3>
                </div>
                <p className="mt-1 pl-8 text-[11px] text-slate-400">{info.english}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{pctToLabel(domainScore)}</p>
                <p className="text-sm font-bold tabular-nums text-slate-700">{domainScore}%</p>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {facetCodes.map(code => {
                const label = FACET_LABELS[code as FacetCode]
                const pct = Math.round(facets[code]?.pct ?? 0)

                return (
                  <div
                    key={code}
                    className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-start gap-x-3 gap-y-1"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-0.5 shrink-0 text-[10px] font-bold"
                          style={{ color: palette.chipText }}
                        >
                          {code}
                        </span>
                        <p className="min-w-0 text-[12px] leading-5 text-slate-700">
                          {label.th}
                          <span className="text-slate-400"> / {label.en}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[12px] font-semibold tabular-nums text-slate-700">
                      {pct}%
                    </div>

                    <div
                      className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`${label.en} score`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: palette.barColor,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
