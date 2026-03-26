'use client'

import { FACTOR_ORDER, DOMAIN_LABELS, DOMAIN_COLORS, pctToLabel, type Factor } from '@/lib/ocean-constants'

interface Props {
  pct: Record<string, number>
}

export default function DomainScores({ pct }: Props) {
  return (
    <section className="section-panel rounded-[1.75rem] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
        มิติหลัก 5 ด้าน
      </p>
      <h2 className="section-title mt-2 text-2xl">คะแนนรายมิติ</h2>
      <div className="mt-6 space-y-4">
        {FACTOR_ORDER.map(factor => {
          const info = DOMAIN_LABELS[factor as Factor]
          const score = pct[factor] ?? 0
          return (
            <article key={factor} className="rounded-[1.6rem] bg-gradient-to-r from-[#f8fafb] to-[#f2f5f7] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="factor-medallion shrink-0"><span>{factor}</span></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-base font-semibold text-slate-800">{info.label}</h3>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{info.sublabel}</span>
                    </div>
                    <p className="mt-2 text-sm leading-[1.6] text-slate-600">{info.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: DOMAIN_COLORS[factor as Factor].chipBg, color: DOMAIN_COLORS[factor as Factor].chipText }}
                  >
                    {pctToLabel(score)}
                  </span>
                  <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-main)' }}>{score}%</span>
                </div>
              </div>
              <div
                className="mt-4 rounded-full overflow-hidden"
                style={{ height: '6px', background: 'rgba(255,255,255,0.7)' }}
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${score}%`,
                    background: DOMAIN_COLORS[factor as Factor].barColor,
                    boxShadow: `0 0 8px ${DOMAIN_COLORS[factor as Factor].barColor}`,
                  }}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
