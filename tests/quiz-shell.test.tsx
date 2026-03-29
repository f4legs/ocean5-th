import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import QuizShell, { type QuizShellConfig } from '@/components/quiz-shell'

function createConfig(overrides: Partial<QuizShellConfig> = {}): QuizShellConfig {
  const items = [{ id: 1, th: 'ฉันชอบวางแผนล่วงหน้า' }]

  return {
    eyebrowText: 'test',
    titleText: 'Quiz',
    subtitleText: 'Subtitle',
    instructionText: 'Instruction',
    draftStatusText: 'Draft status',
    items,
    getPageItems: () => items,
    itemsPerPage: 1,
    totalPages: 1,
    premiumBadge: null,
    restoreState: async () => ({ answers: { 1: 5 }, page: 1 }),
    onAnswer: vi.fn(),
    onPageChange: vi.fn(),
    onComplete: vi.fn(async () => {}),
    ...overrides,
  }
}

describe('QuizShell completion guard', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn()
  })

  it('prevents duplicate completion submits on rapid clicks', async () => {
    let resolveComplete!: () => void
    const onComplete = vi.fn(() => new Promise<void>(resolve => {
      resolveComplete = resolve
    }))

    render(<QuizShell config={createConfig({ onComplete })} />)

    const submitButton = await screen.findByRole('button', { name: /ดูผลลัพธ์/i })

    fireEvent.click(submitButton)
    fireEvent.click(submitButton)

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /กำลังบันทึกผลลัพธ์/i })).toBeDisabled()

    resolveComplete()

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  it('shows an error and unlocks retry when completion fails', async () => {
    const onComplete = vi.fn(async () => {
      throw new Error('save failed')
    })

    render(<QuizShell config={createConfig({ onComplete })} />)

    fireEvent.click(await screen.findByRole('button', { name: /ดูผลลัพธ์/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('ไม่สามารถบันทึกผลลัพธ์ได้ในขณะนี้ กรุณาลองอีกครั้ง')
    expect(screen.getByRole('button', { name: /ดูผลลัพธ์/i })).toBeEnabled()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
