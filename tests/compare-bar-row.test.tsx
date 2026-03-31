import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import CompareBarRow from '@/components/dashboard/compare-bar-row'
import { DOMAIN_COLORS } from '@/lib/ocean-constants'

function toComputedColor(color: string): string {
  const node = document.createElement('div')
  node.style.color = color
  document.body.appendChild(node)
  const computed = getComputedStyle(node).color
  node.remove()
  return computed
}

afterEach(() => {
  cleanup()
})

describe('CompareBarRow', () => {
  it('renders both profiles with strong and soft trait bars', () => {
    render(
      <CompareBarRow
        factor="O"
        label="การเปิดรับประสบการณ์"
        scoreA={68}
        scoreB={41}
        delta={27}
        highlighted
        showMedallion
      />,
    )

    expect(screen.getByText('การเปิดรับประสบการณ์')).toBeInTheDocument()
    expect(screen.getByText('A 68%')).toBeInTheDocument()
    expect(screen.getByText('B 41%')).toBeInTheDocument()
    expect(screen.getByText('Δ+27')).toBeInTheDocument()

    const barA = screen.getByTestId('compare-bar-a')
    const barB = screen.getByTestId('compare-bar-b')

    expect(barA).toHaveStyle({ width: '68%' })
    expect(barB).toHaveStyle({ width: '41%' })
    expect(getComputedStyle(barA).backgroundColor).toBe(toComputedColor(DOMAIN_COLORS.O.compareStrong))
    expect(getComputedStyle(barB).backgroundColor).toBe(toComputedColor(DOMAIN_COLORS.O.compareSoft))
  })

  it('renders a single profile cleanly when only one score is present', () => {
    render(
      <CompareBarRow
        factor="N"
        label="ความไม่มั่นคงทางอารมณ์"
        scoreA={22}
      />,
    )

    expect(screen.getByText('A 22%')).toBeInTheDocument()
    expect(screen.queryByText(/B /)).not.toBeInTheDocument()
    expect(screen.getByTestId('compare-bar-a')).toHaveStyle({ width: '22%' })
    expect(screen.queryByTestId('compare-bar-b')).not.toBeInTheDocument()
  })
})
