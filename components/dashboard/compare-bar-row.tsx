import { DOMAIN_COLORS, type Factor } from '@/lib/ocean-constants'

interface CompareBarRowProps {
  factor: Factor
  label: string
  code?: string
  scoreA?: number
  scoreB?: number
  delta?: number | null
  highlighted?: boolean
  compact?: boolean
  showMedallion?: boolean
}

function clampPct(value?: number): number {
  if (value === undefined || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export default function CompareBarRow({
  factor,
  label,
  code,
  scoreA,
  scoreB,
  delta = null,
  highlighted = false,
  compact = false,
  showMedallion = false,
}: CompareBarRowProps) {
  const colors = DOMAIN_COLORS[factor]
  const trackHeight = compact ? '0.32rem' : '0.38rem'
  const aWidth = clampPct(scoreA)
  const bWidth = clampPct(scoreB)
  const deltaTone = delta !== null && Math.abs(delta) >= 20 ? 'text-red-500' : 'text-[var(--text-faint)]'

  return (
    <div
      className={`rounded-xl transition-colors ${compact ? 'px-0 py-1.5' : 'px-3 py-3'} ${highlighted ? 'bg-[rgba(69,98,118,0.06)]' : ''}`}
    >
      <div className={`flex items-start gap-3 ${compact ? 'text-xs' : ''}`}>
        {showMedallion && (
          <span className="factor-medallion shrink-0 mt-0.5">
            <span>{factor}</span>
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-2' : 'mb-2.5'}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {code && (
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                    style={{ background: colors.chipBg, color: colors.chipText }}
                  >
                    {code}
                  </span>
                )}
                <span className={`block truncate ${compact ? 'text-[11px] font-medium text-[var(--text-soft)]' : 'text-xs font-medium text-[var(--text-main)]'}`}>
                  {label}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 text-[11px]">
              {scoreA !== undefined && (
                <span className="font-semibold tabular-nums" style={{ color: colors.compareStrong }}>
                  A {Math.round(scoreA)}%
                </span>
              )}
              {scoreB !== undefined && (
                <span className="font-semibold tabular-nums" style={{ color: colors.compareSoft }}>
                  B {Math.round(scoreB)}%
                </span>
              )}
              {delta !== null && (
                <span className={`font-semibold tabular-nums ${deltaTone}`}>
                  Δ{delta > 0 ? '+' : ''}{Math.round(delta)}
                </span>
              )}
            </div>
          </div>

          <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
            {scoreA !== undefined && (
              <div
                className="w-full overflow-hidden rounded-full"
                style={{ height: trackHeight, background: colors.compareTrack }}
              >
                <div
                  aria-label={`${label} profile A`}
                  className="h-full rounded-full transition-all duration-500"
                  data-testid="compare-bar-a"
                  style={{ width: `${aWidth}%`, background: colors.compareStrong }}
                />
              </div>
            )}

            {scoreB !== undefined && (
              <div
                className="w-full overflow-hidden rounded-full"
                style={{ height: trackHeight, background: colors.compareTrack }}
              >
                <div
                  aria-label={`${label} profile B`}
                  className="h-full rounded-full transition-all duration-500"
                  data-testid="compare-bar-b"
                  style={{ width: `${bWidth}%`, background: colors.compareSoft }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
