import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fileUploadEntry } from './file-upload'

const user = () => userEvent.setup()
const demo = (title: string) => fileUploadEntry.examples.find((x) => x.title === title)!.Demo
const status = () => screen.getByRole('status')
const PICK = '파일을 끌어다 놓거나 눌러서 고르세요'
const picker = () => screen.getByLabelText(PICK) as HTMLInputElement
const zoneOf = (input: HTMLElement) => input.closest('[data-slot="file-upload-dropzone"]')!
const names = (list: HTMLElement) =>
  within(list)
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.truncate')?.textContent)

function file(name: string, type: string, size?: number) {
  const f = new File(['x'], name, { type })
  if (size !== undefined) Object.defineProperty(f, 'size', { value: size })
  return f
}

const drop = (target: Element, files: File[]) => fireEvent.drop(target, { dataTransfer: { files, types: ['Files'] } })

beforeAll(() => {
  // jsdom has no blob: URLs
  let made = 0
  URL.createObjectURL = vi.fn(() => `blob:preview-${++made}`)
  URL.revokeObjectURL = vi.fn()
})

it('is an input findable as a dropzone or file input', () => {
  expect(fileUploadEntry).toMatchObject({ id: 'file-upload', name: 'File Upload', category: 'input' })
  expect(fileUploadEntry.aliases).toEqual(
    expect.arrayContaining(['Dropzone', 'File input', '파일 업로드', '드래그 앤 드롭']),
  )
  expect(fileUploadEntry.description).toMatch(/^[^.]+\.$/)
})

it('opens with a labelled state gallery of the zone and of one file', () => {
  expect(fileUploadEntry.examples[0].title).toBe('상태 모음')
  const States = fileUploadEntry.examples[0].Demo
  render(<States />)
  const cells = [...screen.getByRole('list', { name: '상태 모음' }).querySelectorAll<HTMLElement>(':scope > li')]
  expect(cells.map((li) => li.lastElementChild?.textContent)).toEqual([
    '기본', '끌어다 놓는 중', '포커스', '비활성', '업로드 중', '완료', '오류',
  ])
  const zone = (i: number) => cells[i].querySelector('[data-slot="file-upload-dropzone"]')!
  expect(zone(0)).not.toHaveAttribute('data-dragging')
  expect(zone(1)).toHaveAttribute('data-dragging')
  expect(zone(1)).toHaveTextContent('여기에 놓으세요')
  expect(zone(2)).toHaveAttribute('data-demo-state', 'focus')
  expect(cells[3].querySelector('input[type="file"]')).toBeDisabled()
  expect(within(cells[4]).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45')
  expect(within(cells[4]).getByRole('button', { name: '여행 사진.zip 올리기 취소' })).toBeInTheDocument()
  expect(cells[5]).toHaveTextContent('올림')
  expect(cells[6].querySelector('[data-slot="file-upload-item"]')).toHaveAttribute('data-status', 'error')
  expect(cells[6]).toHaveTextContent('2MB를 넘습니다')
})

it('has at least three more examples with distinct titles and descriptions', () => {
  expect(fileUploadEntry.examples.slice(1).length).toBeGreaterThanOrEqual(3)
  expect(new Set(fileUploadEntry.examples.map((x) => x.title)).size).toBe(fileUploadEntry.examples.length)
  for (const x of fileUploadEntry.examples) expect(x.description.trim()).not.toBe('')
})

it('names anatomy parts that exist in its specimen', () => {
  const { parts, Specimen } = fileUploadEntry.anatomy
  expect(parts.length).toBeGreaterThanOrEqual(2)
  const { container } = render(<Specimen />)
  for (const part of parts) {
    expect(container.querySelector(`[data-slot="${part.slot}"]`), part.slot).not.toBeNull()
    expect(part.description.trim()).not.toBe('')
  }
})

it('renders the preview, specimen and every example, twice on one page without clashing ids', () => {
  const demos = [fileUploadEntry.Preview, fileUploadEntry.anatomy.Specimen, ...fileUploadEntry.examples.map((x) => x.Demo)]
  const { container } = render(
    <>
      {[...demos, ...demos].map((Demo, i) => (
        <Demo key={i} />
      ))}
    </>,
  )
  const ids = [...container.querySelectorAll('[id]')].map((el) => el.id)
  expect(ids.length).toBeGreaterThan(0)
  expect(new Set(ids).size).toBe(ids.length)
})

it('the dropzone is a real, keyboard-reachable file input', async () => {
  const u = user()
  const DropArea = demo('끌어다 놓기 영역')
  render(<DropArea />)
  const input = picker()
  expect(input).toHaveAttribute('type', 'file')
  expect(input).toHaveAccessibleDescription('여러 개를 한 번에 골라도 됩니다')
  await u.tab()
  expect(input).toHaveFocus()
})

it('drop area: chosen and dropped files land in the list and can be removed', async () => {
  const u = user()
  const DropArea = demo('끌어다 놓기 영역')
  render(<DropArea />)
  expect(status()).toHaveTextContent('아직 고른 파일이 없습니다.')
  const input = picker()
  const zone = zoneOf(input)

  await u.upload(input, [file('회의록.pdf', 'application/pdf', 1_500_000), file('메모.txt', 'text/plain', 512 * 1024)])
  const list = screen.getByRole('list', { name: '고른 파일' })
  expect(names(list)).toEqual(['회의록.pdf', '메모.txt'])
  expect(list).toHaveTextContent('1.4 MB')
  expect(list).toHaveTextContent('512 KB')
  expect(status()).toHaveTextContent('파일 2개 · 모두 1.9 MB')

  await u.click(screen.getByRole('button', { name: '회의록.pdf 삭제' }))
  expect(names(list)).toEqual(['메모.txt'])

  fireEvent.dragEnter(zone)
  expect(zone).toHaveAttribute('data-dragging')
  expect(zone).toHaveTextContent('여기에 놓으세요')
  fireEvent.dragLeave(zone)
  expect(zone).not.toHaveAttribute('data-dragging')

  fireEvent.dragEnter(zone)
  drop(zone, [file('사진.jpg', 'image/jpeg', 2048)])
  expect(zone).not.toHaveAttribute('data-dragging')
  expect(names(list)).toEqual(['메모.txt', '사진.jpg'])
  expect(status()).toHaveTextContent('파일 2개')
})

it('image preview: a chosen photo gets a blob thumbnail that is freed on removal', async () => {
  const u = user()
  const Preview = demo('이미지 미리보기')
  render(<Preview />)
  expect(screen.getByRole('img', { name: '바다.jpg' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('사진 2장')

  await u.upload(picker(), file('고양이.png', 'image/png', 300_000))
  const thumb = screen.getByRole('img', { name: '고양이.png' })
  expect(thumb).toHaveAttribute('src', expect.stringMatching(/^blob:/))
  expect(status()).toHaveTextContent('사진 3장')

  const url = thumb.getAttribute('src')
  await u.click(screen.getByRole('button', { name: '고양이.png 삭제' }))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
  expect(screen.queryByRole('img', { name: '고양이.png' })).toBeNull()

  drop(zoneOf(picker()), [file('문서.pdf', 'application/pdf'), file('강아지.jpg', 'image/jpeg')])
  expect(screen.getByRole('img', { name: '강아지.jpg' })).toBeInTheDocument()
  expect(status()).toHaveTextContent('사진 3장')
  expect(status()).toHaveTextContent('사진이 아닌 파일 1개는 뺐습니다')
})

it('limits: dropped files of the wrong type or size are refused with a reason', async () => {
  const u = user()
  const Limits = demo('형식·크기 제한')
  render(<Limits />)
  const input = picker()
  expect(input).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp,image/gif')

  drop(zoneOf(input), [
    file('문서.pdf', 'application/pdf', 40_000),
    file('큰 사진.jpg', 'image/jpeg', 3 * 1024 * 1024),
    file('아이콘.png', 'image/png', 20_000),
  ])
  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent('파일 2개는 받지 않았습니다.')
  const refused = within(alert).getAllByRole('listitem')
  expect(refused[0]).toHaveTextContent('문서.pdf')
  expect(refused[0]).toHaveTextContent('이미지(PNG·JPG·WEBP·GIF)가 아닙니다')
  expect(refused[1]).toHaveTextContent('2MB를 넘습니다 (3.0 MB)')
  expect(names(screen.getByRole('list', { name: '받은 파일' }))).toEqual(['아이콘.png'])
  expect(status()).toHaveTextContent('받은 파일 1개 · 방금 2개 거절')

  await u.upload(input, file('배경.webp', 'image/webp', 900_000))
  expect(screen.queryByRole('alert')).toBeNull()
  expect(names(screen.getByRole('list', { name: '받은 파일' }))).toEqual(['아이콘.png', '배경.webp'])
  expect(status()).toHaveTextContent('받은 파일 2개')
})

it('upload progress: each file moves on its own, and a canceled one can start again', async () => {
  // only the demo's ticking interval is faked; user-event and Testing Library keep real timeouts
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  try {
    const u = user()
    const Upload = demo('업로드 진행')
    render(<Upload />)
    const bar = (name: string) => screen.getByRole('progressbar', { name: `${name} 올리는 중` })

    await u.click(screen.getByRole('button', { name: '예시 파일 3개로 해 보기' }))
    expect(status()).toHaveTextContent('올리는 중 3 · 완료 0 · 취소 0')
    expect(bar('회의록.pdf')).toHaveAttribute('aria-valuenow', '0')

    act(() => vi.advanceTimersByTime(400))
    // the small file runs ahead of the big one
    expect(Number(bar('회의록.pdf').getAttribute('aria-valuenow'))).toBeGreaterThan(
      Number(bar('발표 자료.pptx').getAttribute('aria-valuenow')),
    )

    await u.click(screen.getByRole('button', { name: '발표 자료.pptx 올리기 취소' }))
    act(() => vi.advanceTimersByTime(2000))
    expect(status()).toHaveTextContent('올리는 중 0 · 완료 2 · 취소 1')
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.getByText('발표 자료.pptx').closest('li')).toHaveAttribute('data-status', 'canceled')

    await u.click(screen.getByRole('button', { name: '발표 자료.pptx 다시 올리기' }))
    expect(bar('발표 자료.pptx')).toHaveAttribute('aria-valuenow', '0')
    act(() => vi.advanceTimersByTime(4000))
    expect(status()).toHaveTextContent('올리는 중 0 · 완료 3 · 취소 0')
  } finally {
    vi.useRealTimers()
  }
})
