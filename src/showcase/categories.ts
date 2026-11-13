import type { Category, ShowcaseEntry } from './types'

export const categories: Category[] = [
  { id: 'layout', label: '레이아웃', description: '화면을 나누고 내용을 담는 틀' },
  { id: 'navigation', label: '내비게이션', description: '페이지나 내용 사이를 옮겨 다니는 길잡이' },
  { id: 'input', label: '입력과 동작', description: '누르거나 켜고 끄며 무언가를 실행하는 요소' },
  { id: 'display', label: '정보 표시', description: '사람·상태·내용을 짧게 보여주는 요소' },
  { id: 'feedback', label: '피드백', description: '진행 상황과 알릴 내용을 전하는 요소' },
  { id: 'overlay', label: '오버레이', description: '페이지 위에 겹쳐 떠오르는 요소' },
  { id: 'mobile', label: '모바일', description: '휴대폰 앱에서 손가락으로 쓰는 화면과 동작' },
  { id: 'pattern', label: 'UX 패턴', description: '특정 상황에서 반복해 쓰이는 화면 설계. 따라 할 예와 피할 예' },
]

export function groupByCategory(entries: ShowcaseEntry[]) {
  return categories
    .map((category) => ({ category, entries: entries.filter((e) => e.category === category.id) }))
    .filter((group) => group.entries.length > 0)
}
