import { FACTOR_ORDER } from '@/lib/ocean-constants'

interface Props {
  pct: Record<string, number>
}

export default function SidebarScores({ pct }: Props) {
  return (
    <div className="muted-panel rounded-[1.75rem] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
        คะแนนมิติหลัก
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {FACTOR_ORDER.map(factor => (
          <div key={factor} className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-center">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{factor}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{pct[factor] ?? 0}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
