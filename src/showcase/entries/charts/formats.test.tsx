import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { filterEntries } from '../../filter-entries'
import { chartsEntry } from '.'
import { dayLabel, heatmapDays } from './data'
import {
  AreaChartFormat,
  BarChartFormat,
  DonutChartFormat,
  HeatmapFormat,
  KpiFormat,
  LineChartFormat,
  SparklineFormat,
} from './formats'

const user = () => userEvent.setup()
const status = () => screen.getByRole('status')
const bars = () => screen.getAllByRole('img', { name: /^\d+월 [\d,]+명$/ })

describe('entry', () => {
  it('is a display entry that search finds by every chart name', () => {
    expect(chartsEntry.id).toBe('charts')
    expect(chartsEntry.name).toBe('Charts')
    expect(chartsEntry.category).toBe('display')
    expect(chartsEntry.description).toMatch(/\.$/)
    for (const query of [
      'Chart',
      'Graph',
      'Data visualization',
      'Bar chart',
      'Line chart',
      'Donut chart',
      'Sparkline',
      'KPI card',
      '차트',
      '그래프',
    ]) {
      expect(filterEntries([chartsEntry], query), query).toHaveLength(1)
    }
  })

  it('lists the chart formats after the state gallery, in order', () => {
    expect(chartsEntry.examples.map((x) => x.title)).toEqual([
      '상태 모음',
      '막대 차트',
      '선 차트',
      '영역 차트',
      '도넛 차트',
      '스파크라인',
      '지표 카드',
      '히트맵',
    ])
    for (const x of chartsEntry.examples) expect(x.description.trim()).not.toBe('')
  })

  it('opens with one chart card in every state', () => {
    const States = chartsEntry.examples[0].Demo
    render(<States />)
    const items = within(screen.getByRole('list', { name: '상태 모음' })).getAllByRole('listitem')
    expect(items.map((li) => li.lastElementChild?.textContent)).toEqual([
      '기본',
      '강조',
      '툴팁 표시',
      '불러오는 중',
      '데이터 없음',
      '오류',
    ])
    const card = (label: string) => items.find((li) => li.lastElementChild?.textContent === label)!
    expect(within(card('툴팁 표시')).getByRole('tooltip')).toHaveTextContent('280명')
    expect(card('불러오는 중').querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(card('불러오는 중').querySelectorAll('[data-slot="skeleton"]')).toHaveLength(7)
    expect(card('데이터 없음')).toHaveTextContent('이번 주 방문 기록이 없어요')
    expect(within(card('오류')).getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('marks every anatomy part in the specimen', () => {
    const { Specimen, parts } = chartsEntry.anatomy
    const { container } = render(<Specimen />)
    expect(parts.length).toBeGreaterThanOrEqual(2)
    for (const part of parts) {
      expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    }
  })

  it('renders its preview and every example', () => {
    const { Preview, examples } = chartsEntry
    expect(() => render(<Preview />)).not.toThrow()
    for (const { Demo } of examples) expect(() => render(<Demo />)).not.toThrow()
  })

  it.each(chartsEntry.examples.slice(1).map((x) => [x.title, x.Demo] as const))(
    '%s: has a title, a hidden summary and a table view',
    async (_title, Demo) => {
      const u = user()
      render(<Demo />)
      const figure = screen.getByRole('figure')
      expect(figure).toHaveAccessibleName()
      expect(figure).toHaveAccessibleDescription()
      expect(within(figure).queryByRole('table', { name: /./ })).toBeNull()
      await u.click(within(figure).getByRole('button', { name: '표로 보기' }))
      expect(within(figure).getByRole('button', { name: '표로 보기' })).toHaveAttribute('aria-pressed', 'true')
      expect(within(figure).getByRole('table', { name: /./ })).toBeInTheDocument()
    },
  )
})

describe('bar chart', () => {
  it('the period tab changes the data', async () => {
    const u = user()
    render(<BarChartFormat />)
    expect(bars()).toHaveLength(12)
    expect(status()).toHaveTextContent('최근 12개월 · 막대 12개')

    await u.click(screen.getByRole('tab', { name: '6개월' }))
    expect(bars()).toHaveLength(6)
    expect(screen.queryByRole('img', { name: '3월 1,240명' })).toBeNull()
    expect(status()).toHaveTextContent('최근 6개월 · 막대 6개 · 합계 8,830명 · 가장 많은 달 10월 1,610명')
  })

  it('focusing a bar shows its exact value in a tooltip', () => {
    render(<BarChartFormat />)
    const march = screen.getByRole('img', { name: '3월 1,240명' })
    expect(march).toHaveAttribute('tabindex', '0')
    expect(screen.queryByRole('tooltip')).toBeNull()

    act(() => march.focus())
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('1,240명')
    expect(tip).toHaveTextContent('2026년 3월')
    expect(tip).toHaveTextContent('지난달보다 ▲ 330명')
    expect(march).toHaveAttribute('aria-describedby', tip.id)

    act(() => march.blur())
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('the table view lists the same numbers', async () => {
    const u = user()
    render(<BarChartFormat />)
    await u.click(screen.getByRole('button', { name: '표로 보기' }))
    const table = screen.getByRole('table', { name: '월별 방문자' })
    expect(within(table).getAllByRole('row')).toHaveLength(13)
    const march = within(table).getByRole('cell', { name: '2026년 3월' }).closest('tr')!
    expect(march).toHaveTextContent('1,240')
    expect(march).toHaveTextContent('▲ 330명')
  })
})

describe('line chart', () => {
  it('a legend entry hides and shows its series', async () => {
    const u = user()
    const { container } = render(<LineChartFormat />)
    const lastYear = screen.getByRole('button', { name: '작년' })
    expect(lastYear).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('[data-series="작년"]')).not.toBeNull()

    await u.click(lastYear)
    expect(lastYear).toHaveAttribute('aria-pressed', 'false')
    expect(container.querySelector('[data-series="작년"]')).toBeNull()
    expect(container.querySelector('[data-series="올해"]')).not.toBeNull()
    expect(status()).toHaveTextContent('올해만 보는 중')

    await u.click(lastYear)
    expect(container.querySelector('[data-series="작년"]')).not.toBeNull()
  })

  it('the crosshair snaps to a month; the arrow keys move it', async () => {
    const u = user()
    render(<LineChartFormat />)
    const slider = screen.getByRole('slider', { name: /월별 주문 수/ })

    act(() => slider.focus())
    expect(slider).toHaveAttribute('aria-valuetext', '12월: 올해 940건, 작년 780건')
    await u.keyboard('{Home}{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuetext', '2월: 올해 380건, 작년 340건')
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('2월')
    expect(tip).toHaveTextContent('380건올해')
    expect(tip).toHaveTextContent('340건작년')
  })
})

describe('area chart', () => {
  it('switches between stacked and overlapping areas', async () => {
    const u = user()
    render(<AreaChartFormat />)
    const figure = screen.getByRole('figure', { name: '경로별 방문자' })
    expect(figure).toHaveAttribute('data-mode', 'stacked')
    expect(status()).toHaveTextContent('누적')

    await u.click(screen.getByRole('radio', { name: '겹침' }))
    expect(figure).toHaveAttribute('data-mode', 'overlap')
    expect(status()).toHaveTextContent('겹침: 세 영역이 모두 0에서 시작')
  })
})

describe('donut chart', () => {
  it('focusing a slice highlights it and its legend row', () => {
    render(<DonutChartFormat />)
    const slice = screen.getByRole('img', { name: '교통 168,000원, 14%' })
    act(() => slice.focus())
    const row = within(screen.getByRole('list', { name: '범례' })).getByText('교통').closest('li')!
    expect(row).toHaveAttribute('data-active', 'true')
    expect(status()).toHaveTextContent('교통: 168,000원, 전체의 14%')
    expect(screen.getByRole('img', { name: '식비 456,000원, 38%' })).toHaveAttribute('opacity', '0.35')
  })
})

describe('sparklines', () => {
  it('puts a trend line in every row and switches the rise/fall colours', async () => {
    const u = user()
    render(<SparklineFormat />)
    expect(screen.getAllByRole('img', { name: /최근 30일: 최저/ })).toHaveLength(5)
    const upCell = () => screen.getByRole('row', { name: /한빛전자/ }).querySelector('[data-change]')!
    expect(upCell()).toHaveAttribute('data-change', 'up')
    expect(upCell()).toHaveTextContent('상승')
    expect(upCell().className).toContain('text-[#d03b3b]')
    expect(status()).toHaveTextContent('한국식')

    await u.click(screen.getByRole('radio', { name: '미국식' }))
    expect(upCell().className).toContain('text-[#006300]')
    expect(status()).toHaveTextContent('미국식: 오르면 초록 ▲, 내리면 빨강 ▼')
  })
})

describe('KPI cards', () => {
  it('shows each value with its change and progress, per period', async () => {
    const u = user()
    render(<KpiFormat />)
    expect(screen.getByRole('progressbar', { name: '매출 목표 달성률' })).toHaveAttribute('aria-valuenow', '96')
    expect(screen.getByText('▲ 12.4%')).toBeInTheDocument()
    expect(status()).toHaveTextContent('이번 달 기준 · 목표 달성 2개 · 미달 2개')

    await u.click(screen.getByRole('radio', { name: '이번 주' }))
    expect(screen.getByRole('progressbar', { name: '매출 목표 달성률' })).toHaveAttribute('aria-valuenow', '90')
    expect(status()).toHaveTextContent('이번 주 기준 · 목표 달성 1개 · 미달 3개')
  })
})

describe('heatmap', () => {
  it('names every cell by its date and count; one cell is in the tab order', () => {
    render(<HeatmapFormat />)
    const days = heatmapDays()
    const cells = screen.getAllByRole('img', { name: /^2026년 \d+월 \d+일 \(.\) · 커밋 \d+개$/ })
    expect(cells).toHaveLength(days.length)
    expect(screen.getByRole('img', { name: `2026년 7월 6일 (월) · 커밋 ${days[0].count}개` })).toBeInTheDocument()
    expect(cells.filter((c) => c.getAttribute('tabindex') === '0')).toEqual([cells[cells.length - 1]])
  })

  it('shows a tooltip for the focused day and moves by week and by day with the arrow keys', async () => {
    const u = user()
    render(<HeatmapFormat />)
    const days = heatmapDays()
    const last = days[days.length - 1]
    act(() => screen.getByRole('img', { name: new RegExp(`^${dayLabel(last.time).replace(/[()]/g, '\\$&')}`) }).focus())
    expect(screen.getByRole('tooltip')).toHaveTextContent(`커밋 ${last.count}개${dayLabel(last.time)}`)

    await u.keyboard('{ArrowLeft}')
    expect(document.activeElement).toHaveAccessibleName(`2026년 11월 1일 (일) · 커밋 ${days[days.length - 8].count}개`)
    await u.keyboard('{ArrowUp}')
    expect(document.activeElement).toHaveAccessibleName(`2026년 10월 31일 (토) · 커밋 ${days[days.length - 9].count}개`)
    expect(document.activeElement).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tooltip')).toHaveTextContent('2026년 10월 31일 (토)')
  })

  it('the table view has a row per week', async () => {
    const u = user()
    render(<HeatmapFormat />)
    await u.click(screen.getByRole('button', { name: '표로 보기' }))
    const table = screen.getByRole('table', { name: '주별·요일별 커밋 수' })
    expect(within(table).getAllByRole('row')).toHaveLength(19)
  })
})
