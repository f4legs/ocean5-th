'use client'

import ReactMarkdown from 'react-markdown'
import { formatDuration } from '@/lib/ocean-constants'

interface Props {
  report: string
  loading: boolean
  error: string | null
  fakeProgress: number
  loadingSeconds: number
  eyebrowText: string
  titleText: string
  loadingMessage: string
  estimatedTime: string
  onRetry: () => void
}

export default function ReportPanel({
  report, loading, error, fakeProgress, loadingSeconds,
  eyebrowText, titleText, loadingMessage, estimatedTime, onRetry,
}: Props) {
  const displayProgress = loading ? fakeProgress : report ? 100 : 0

  return (
    <section className="section-panel report-panel rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">{eyebrowText}</p>
          <h2 className="section-title mt-2 text-2xl">{titleText}</h2>
        </div>
        {report && !loading && (
          <button
            onClick={onRetry}
            className="secondary-button min-h-0 px-4 py-2 text-xs"
          >
            ประเมินใหม่
          </button>
        )}
      </div>

      {loading && !report && (
        <div className="py-10 text-center sm:px-8">
          <div className="loading-line" role="status" aria-label="กำลังโหลด" />
          <p className="mt-4 text-base font-medium text-slate-700">{loadingMessage}</p>
          <p className="body-faint mt-2 text-sm">รายงานเชิงลึกอาจใช้เวลา {estimatedTime}</p>
          <div className="mx-auto mt-6 max-w-xl">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">ความคืบหน้าโดยประมาณ</span>
              <span className="text-slate-500">{displayProgress}%</span>
            </div>
            <div className="mt-3 rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(69,98,118,0.12)' }}>
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{ width: `${displayProgress}%`, background: 'var(--gradient-hero)', boxShadow: '0 0 8px rgba(69,98,118,0.4)' }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>เวลาที่ผ่านไป {formatDuration(loadingSeconds)}</span>
              <span>บางช่วงอาจค้างที่ 90%+ ชั่วคราว</span>
            </div>
          </div>
        </div>
      )}

      {error && !report && (
        <div className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50/90 p-5 text-sm text-red-700">
          <p>{error}</p>
          <button
            onClick={onRetry}
            className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {report && (
        <div className="report-markdown mt-6">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      )}
    </section>
  )
}
