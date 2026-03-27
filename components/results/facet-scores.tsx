'use client'

import FacetAnalysisGrid from '@/components/results/facet-analysis-grid'

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
      <div className="mt-6">
        <FacetAnalysisGrid facets={facets} />
      </div>
    </section>
  )
}
