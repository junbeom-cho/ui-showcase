import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { CheckIcon, CircleAlertIcon, CloudUploadIcon, FileTextIcon, ImageIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// keys for list items only, never DOM ids
let lastKey = 0
const nextKey = () => `file-${++lastKey}`

const noop = () => {}

type DropzoneProps = {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  hint?: string
  compact?: boolean
  /** pins a look for the state gallery */
  demo?: 'dragging' | 'focus'
}

/**
 * A label wrapped around a visually hidden <input type="file">: clicking the zone
 * opens the file picker, Tab reaches the input, and dropped files arrive here too.
 */
function Dropzone({ onFiles, accept, multiple = true, disabled = false, hint, compact = false, demo }: DropzoneProps) {
  const id = useId()
  const [dragging, setDragging] = useState(false)
  // dragenter and dragleave also fire while moving over the zone's own children
  const depth = useRef(0)
  const isDragging = !disabled && (dragging || demo === 'dragging')

  const hold = (e: DragEvent) => {
    // without this the browser opens the dropped file itself
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <label
      data-slot="file-upload-dropzone"
      data-dragging={isDragging || undefined}
      data-disabled={disabled || undefined}
      data-demo-state={demo === 'focus' ? 'focus' : undefined}
      onDragEnter={(e) => {
        hold(e)
        if (disabled) return
        depth.current += 1
        setDragging(true)
      }}
      onDragOver={(e) => {
        hold(e)
        if (!disabled && e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={(e) => {
        hold(e)
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setDragging(false)
      }}
      onDrop={(e) => {
        hold(e)
        depth.current = 0
        setDragging(false)
        if (!disabled) onFiles(Array.from(e.dataTransfer?.files ?? []))
      }}
      className={cn(
        'relative flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-input bg-background px-4 text-center outline-none motion-safe:transition-colors',
        compact ? 'py-4' : 'py-7',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-foreground/30 hover:bg-muted/40',
        // the real input is hidden, so its keyboard focus is drawn on the whole zone
        'has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'data-dragging:border-primary data-dragging:bg-primary/5',
      )}
    >
      <input
        type="file"
        data-slot="file-upload-input"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-labelledby={`${id}-text`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []))
          e.target.value = '' // so choosing the same file again still counts
        }}
      />
      <CloudUploadIcon aria-hidden className={cn('size-7 text-muted-foreground', isDragging && 'text-primary')} />
      <span id={`${id}-text`} className="text-sm font-medium">
        {isDragging ? '여기에 놓으세요' : '파일을 끌어다 놓거나 눌러서 고르세요'}
      </span>
      {hint && (
        <span id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  )
}

type FileStatus = 'ready' | 'uploading' | 'done' | 'error' | 'canceled'

type FileItemProps = {
  name: string
  size: number
  type?: string
  status?: FileStatus
  progress?: number
  /** why the file failed (error status) */
  message?: string
  actions?: ReactNode
}

function FileItem({ name, size, type = '', status = 'ready', progress = 0, message, actions }: FileItemProps) {
  const Icon = status === 'error' ? CircleAlertIcon : type.startsWith('image/') ? ImageIcon : FileTextIcon
  const note: Record<FileStatus, string> = {
    ready: formatBytes(size),
    uploading: `${formatBytes(size)} · ${progress}%`,
    done: `${formatBytes(size)} · 올림`,
    error: message ?? '올리지 못했습니다',
    canceled: `${formatBytes(size)} · 취소됨`,
  }
  return (
    <li
      data-slot="file-upload-item"
      data-status={status}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-background p-2.5',
        status === 'error' && 'border-destructive/40 bg-destructive/5',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground',
          status === 'error' && 'bg-destructive/10 text-destructive',
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn('truncate text-sm font-medium', status === 'canceled' && 'text-muted-foreground')}>{name}</span>
        <span
          className={cn(
            'flex items-center gap-1 text-xs tabular-nums',
            status === 'error' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {status === 'done' && <CheckIcon aria-hidden className="size-3 text-emerald-600" />}
          {note[status]}
        </span>
        {status === 'uploading' && <Progress value={progress} aria-label={`${name} 올리는 중`} />}
      </div>
      {actions}
    </li>
  )
}

function FileList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul data-slot="file-upload-list" aria-label={label} className="flex w-full flex-col gap-2">
      {children}
    </ul>
  )
}

function RemoveButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      data-slot="file-upload-remove"
      aria-label={`${name} 삭제`}
      onClick={onClick}
      className="text-muted-foreground"
    >
      <XIcon />
    </Button>
  )
}

function CancelButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      data-slot="file-upload-cancel"
      aria-label={`${name} 올리기 취소`}
      onClick={onClick}
      className="text-muted-foreground"
    >
      <XIcon />
    </Button>
  )
}

function Cell({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-72">{children}</div>
}

function States() {
  return (
    <StateGrid
      wide
      items={[
        { label: '기본', node: <Cell><Dropzone compact onFiles={noop} /></Cell> },
        { label: '끌어다 놓는 중', node: <Cell><Dropzone compact onFiles={noop} demo="dragging" /></Cell> },
        { label: '포커스', node: <Cell><Dropzone compact onFiles={noop} demo="focus" /></Cell> },
        { label: '비활성', node: <Cell><Dropzone compact onFiles={noop} disabled /></Cell> },
        {
          label: '업로드 중',
          node: (
            <Cell>
              <FileList label="업로드 중">
                <FileItem
                  name="여행 사진.zip"
                  size={3_400_000}
                  status="uploading"
                  progress={45}
                  actions={<CancelButton name="여행 사진.zip" onClick={noop} />}
                />
              </FileList>
            </Cell>
          ),
        },
        {
          label: '완료',
          node: (
            <Cell>
              <FileList label="완료">
                <FileItem
                  name="여행 사진.zip"
                  size={3_400_000}
                  status="done"
                  actions={<RemoveButton name="여행 사진.zip" onClick={noop} />}
                />
              </FileList>
            </Cell>
          ),
        },
        {
          label: '오류',
          node: (
            <Cell>
              <FileList label="오류">
                <FileItem
                  name="풍경.png"
                  size={3_600_000}
                  type="image/png"
                  status="error"
                  message="2MB를 넘습니다 (3.4 MB)"
                  actions={<RemoveButton name="풍경.png" onClick={noop} />}
                />
              </FileList>
            </Cell>
          ),
        },
      ]}
    />
  )
}

function FileUploadPreview() {
  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      <Dropzone compact onFiles={noop} />
      <FileList label="올린 파일">
        <FileItem name="보고서.pdf" size={1_250_000} status="done" />
      </FileList>
    </div>
  )
}

function FileUploadSpecimen() {
  return (
    <div className="flex w-80 max-w-full flex-col gap-3">
      <Dropzone compact onFiles={noop} hint="PDF, 한 파일에 10MB까지" />
      <FileList label="올린 파일">
        <FileItem
          name="계약서.pdf"
          size={1_250_000}
          status="done"
          actions={<RemoveButton name="계약서.pdf" onClick={noop} />}
        />
        <FileItem
          name="견적서.pdf"
          size={2_900_000}
          status="uploading"
          progress={60}
          actions={<CancelButton name="견적서.pdf" onClick={noop} />}
        />
      </FileList>
    </div>
  )
}

type Picked = { key: string; name: string; size: number; type: string }
const toPicked = (file: File): Picked => ({ key: nextKey(), name: file.name, size: file.size, type: file.type })
const totalSize = (files: { size: number }[]) => files.reduce((sum, f) => sum + f.size, 0)

function DropArea() {
  const [files, setFiles] = useState<Picked[]>([])
  const add = (picked: File[]) => {
    const added = picked.map(toPicked)
    setFiles((prev) => [...prev, ...added])
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Dropzone onFiles={add} hint="여러 개를 한 번에 골라도 됩니다" />
      {files.length > 0 && (
        <FileList label="고른 파일">
          {files.map((f) => (
            <FileItem
              key={f.key}
              name={f.name}
              size={f.size}
              type={f.type}
              actions={<RemoveButton name={f.name} onClick={() => setFiles((prev) => prev.filter((x) => x.key !== f.key))} />}
            />
          ))}
        </FileList>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {files.length > 0 ? `파일 ${files.length}개 · 모두 ${formatBytes(totalSize(files))}` : '아직 고른 파일이 없습니다.'}
      </p>
    </div>
  )
}

type Photo = { key: string; name: string; size: number; url?: string; swatch?: string }

// stand-ins drawn with gradients, so the grid is not empty before anything is chosen
const samplePhotos: Photo[] = [
  { key: 'sample-sea', name: '바다.jpg', size: 1_840_000, swatch: 'bg-linear-to-br from-sky-200 to-blue-500' },
  { key: 'sample-forest', name: '숲길.png', size: 960_000, swatch: 'bg-linear-to-br from-lime-200 to-emerald-600' },
]

function ImagePreview() {
  const [photos, setPhotos] = useState<Photo[]>(samplePhotos)
  const [skipped, setSkipped] = useState(0)
  const madeUrls = useRef(new Set<string>())

  useEffect(() => {
    const urls = madeUrls.current
    // free the previews still alive when the demo goes away
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const add = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'))
    setSkipped(files.length - images.length)
    const added = images.map((f): Photo => {
      // a temporary blob: address that points at the file in this tab's memory
      const url = URL.createObjectURL(f)
      madeUrls.current.add(url)
      return { key: nextKey(), name: f.name, size: f.size, url }
    })
    setPhotos((prev) => [...prev, ...added])
  }
  const remove = (photo: Photo) => {
    if (photo.url) {
      URL.revokeObjectURL(photo.url)
      madeUrls.current.delete(photo.url)
    }
    setPhotos((prev) => prev.filter((p) => p.key !== photo.key))
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Dropzone compact accept="image/*" onFiles={add} hint="사진만 받습니다" />
      {photos.length > 0 && (
        <ul aria-label="미리보기" className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li key={photo.key} className="relative overflow-hidden rounded-lg border bg-muted">
              {photo.url ? (
                <img src={photo.url} alt={photo.name} className="aspect-square w-full object-cover" />
              ) : (
                <div role="img" aria-label={photo.name} className={cn('aspect-square w-full', photo.swatch)} />
              )}
              <span aria-hidden className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[11px] text-white">
                {photo.name}
              </span>
              <Button
                variant="secondary"
                size="icon-xs"
                aria-label={`${photo.name} 삭제`}
                onClick={() => remove(photo)}
                className="absolute top-1 right-1 rounded-full bg-background/90 shadow-sm"
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        사진 {photos.length}장 · {formatBytes(totalSize(photos))}
        {skipped > 0 && ` · 사진이 아닌 파일 ${skipped}개는 뺐습니다`}
      </p>
    </div>
  )
}

const SIZE_LIMIT = 2 * 1024 * 1024
const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/** Why a file is refused, or null. accept only filters the picker, so dropped files are checked here. */
function rejectReason(file: File) {
  if (!imageTypes.includes(file.type)) return '이미지(PNG·JPG·WEBP·GIF)가 아닙니다'
  if (file.size > SIZE_LIMIT) return `2MB를 넘습니다 (${formatBytes(file.size)})`
  return null
}

function Limits() {
  const [accepted, setAccepted] = useState<Picked[]>([])
  const [rejected, setRejected] = useState<(Picked & { reason: string })[]>([])

  const add = (files: File[]) => {
    const ok: Picked[] = []
    const refused: (Picked & { reason: string })[] = []
    for (const file of files) {
      const reason = rejectReason(file)
      if (reason) refused.push({ ...toPicked(file), reason })
      else ok.push(toPicked(file))
    }
    setAccepted((prev) => [...prev, ...ok])
    setRejected(refused) // only the latest batch's refusals
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Dropzone compact accept={imageTypes.join(',')} onFiles={add} hint="PNG·JPG·WEBP·GIF, 한 장에 2MB까지" />
      {rejected.length > 0 && (
        <div role="alert" className="flex flex-col gap-2">
          <p className="text-xs font-medium text-destructive">파일 {rejected.length}개는 받지 않았습니다.</p>
          <FileList label="받지 않은 파일">
            {rejected.map((f) => (
              <FileItem key={f.key} name={f.name} size={f.size} type={f.type} status="error" message={f.reason} />
            ))}
          </FileList>
        </div>
      )}
      {accepted.length > 0 && (
        <FileList label="받은 파일">
          {accepted.map((f) => (
            <FileItem
              key={f.key}
              name={f.name}
              size={f.size}
              type={f.type}
              actions={<RemoveButton name={f.name} onClick={() => setAccepted((prev) => prev.filter((x) => x.key !== f.key))} />}
            />
          ))}
        </FileList>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        받은 파일 {accepted.length}개{rejected.length > 0 && ` · 방금 ${rejected.length}개 거절`}
      </p>
    </div>
  )
}

type Upload = Picked & { progress: number; status: 'uploading' | 'done' | 'canceled' }

const TICK_MS = 200
/** Percent added per tick: small files finish in about a second, big ones take a few. */
const stepFor = (size: number) => Math.max(4, Math.min(25, Math.round((40 * 1_000_000) / (size + 1_000_000))))

const sampleUploads = [
  { name: '회의록.pdf', size: 820_000, type: 'application/pdf' },
  { name: '발표 자료.pptx', size: 6_200_000, type: 'application/vnd.ms-powerpoint' },
  { name: '현장 사진.jpg', size: 2_400_000, type: 'image/jpeg' },
]

function UploadProgress() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const running = uploads.some((u) => u.status === 'uploading')

  // a pretend upload: every tick moves each running file forward
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      setUploads((prev) =>
        prev.map((u) => {
          if (u.status !== 'uploading') return u
          const progress = Math.min(100, u.progress + stepFor(u.size))
          return { ...u, progress, status: progress === 100 ? 'done' : 'uploading' }
        }),
      )
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [running])

  const start = (files: { name: string; size: number; type: string }[]) => {
    const added = files.map((f): Upload => ({ ...f, key: nextKey(), progress: 0, status: 'uploading' }))
    setUploads((prev) => [...prev, ...added])
  }
  const update = (key: string, patch: Partial<Upload>) =>
    setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, ...patch } : u)))
  const count = (status: Upload['status']) => uploads.filter((u) => u.status === status).length

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Dropzone compact onFiles={start} hint="고르는 즉시 올리기 시작합니다 (흉내만 냅니다)" />
      <Button variant="outline" size="sm" className="self-start" onClick={() => start(sampleUploads)}>
        예시 파일 3개로 해 보기
      </Button>
      {uploads.length > 0 && (
        <FileList label="올리는 파일">
          {uploads.map((u) => (
            <FileItem
              key={u.key}
              name={u.name}
              size={u.size}
              type={u.type}
              status={u.status}
              progress={u.progress}
              actions={
                u.status === 'uploading' ? (
                  <CancelButton name={u.name} onClick={() => update(u.key, { status: 'canceled' })} />
                ) : (
                  <div className="flex">
                    {u.status === 'canceled' && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`${u.name} 다시 올리기`}
                        onClick={() => update(u.key, { status: 'uploading', progress: 0 })}
                        className="text-muted-foreground"
                      >
                        <RotateCcwIcon />
                      </Button>
                    )}
                    <RemoveButton name={u.name} onClick={() => setUploads((prev) => prev.filter((x) => x.key !== u.key))} />
                  </div>
                )
              }
            />
          ))}
        </FileList>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {uploads.length > 0
          ? `올리는 중 ${count('uploading')} · 완료 ${count('done')} · 취소 ${count('canceled')}`
          : '파일을 고르거나 예시 파일로 해 보세요.'}
      </p>
    </div>
  )
}

export const fileUploadEntry: ShowcaseEntry = {
  id: 'file-upload',
  name: 'File Upload',
  aliases: ['Dropzone', 'File input', 'File uploader', 'Drag and drop', '파일 업로드', '드래그 앤 드롭', '첨부 파일'],
  description: '파일을 끌어다 놓거나 눌러서 골라 올리고 올라가는 상태를 보여주는 영역.',
  category: 'input',
  Preview: FileUploadPreview,
  anatomy: {
    Specimen: FileUploadSpecimen,
    parts: [
      {
        slot: 'file-upload-dropzone',
        name: 'Dropzone',
        description: '파일을 끌어다 놓거나 눌러서 고르는 점선 영역. 안에 진짜 <input type="file">이 숨어 있어 키보드로도 열 수 있음',
      },
      { slot: 'file-upload-list', name: 'FileList', description: '고른 파일을 모아 둔 목록' },
      { slot: 'file-upload-item', name: 'FileItem', description: '파일 하나. 이름·크기와 지금 상태(올리는 중, 완료, 오류)를 보여줌' },
      { slot: 'progress', name: 'Progress', description: '파일마다 얼마나 올라갔는지 보여주는 막대' },
      { slot: 'file-upload-remove', name: 'RemoveButton', description: '목록에서 빼는 × 버튼. 올리는 중에는 같은 자리에 취소 버튼이 옴' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '위쪽 넷은 끌어다 놓는 영역, 아래쪽 셋은 목록에 올라간 파일 하나의 상태입니다. 끌어다 놓는 중에는 테두리가 진해지고, 포커스는 숨은 파일 입력에 키보드가 왔을 때 영역 전체에 테두리를 그린 모습입니다.',
      Demo: States,
    },
    {
      title: '끌어다 놓기 영역',
      description:
        '탐색기에서 파일을 끌어다 놓거나 영역을 눌러 골라 보세요. Tab으로 영역에 와서 스페이스를 눌러도 열립니다. 고른 파일은 아래 목록에 쌓이고 ×로 뺄 수 있습니다.',
      Demo: DropArea,
    },
    {
      title: '이미지 미리보기',
      description:
        '사진은 올리기 전에 작은 그림으로 확인하게 합니다. 브라우저가 파일을 가리키는 임시 주소(blob:)를 만들어 보여 주고, ×로 빼면 그 주소도 지웁니다. 사진이 아닌 파일은 빠집니다.',
      Demo: ImagePreview,
    },
    {
      title: '형식·크기 제한',
      description:
        '받을 형식과 크기를 영역 안에 미리 적어 둡니다. accept 속성은 파일 고르는 창만 거르고 끌어다 놓은 파일은 거르지 못하므로 다시 검사해야 합니다. 받지 않은 파일은 이유와 함께 알려 줍니다.',
      Demo: Limits,
    },
    {
      title: '업로드 진행',
      description:
        '파일마다 진행 막대와 취소 버튼을 둡니다. 큰 파일일수록 천천히 올라갑니다. 예시 파일로 시작해 하나를 취소하고 다시 올려 보세요. 실제로 어디에 보내지는 않습니다.',
      Demo: UploadProgress,
    },
  ],
}
