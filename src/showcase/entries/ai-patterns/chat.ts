import { useEffect, useState } from 'react'

/** Every reply is canned and played back with timers: no network, no model. */

export type ReplyPhase = 'thinking' | 'streaming' | 'done' | 'stopped'

export type Reply = {
  text: string
  tokens: string[]
  /** tokens shown so far */
  count: number
  /** whole seconds spent thinking so far */
  seconds: number
  /** seconds to think before the first token */
  think: number
  /** delay between tokens */
  ms: number
  phase: ReplyPhase
}

export const THINK_SECOND = 1000
export const TOKEN_MS = 70
/** With reduced motion a whole sentence arrives at once: the text still streams, just in fewer jumps. */
export const SENTENCE_MS = 450

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Words (with their trailing space), or whole sentences when motion is reduced. */
export const tokenize = (text: string, reduced = false) =>
  text.match(reduced ? /[^.!?]+[.!?]*\s*/g : /\S+\s*/g) ?? []

export const isBusy = (r: Reply | undefined) => r?.phase === 'thinking' || r?.phase === 'streaming'
export const shownText = (r: Reply) => r.tokens.slice(0, r.count).join('')

const make = (text: string, think: number): Reply => {
  const reduced = prefersReducedMotion()
  return {
    text,
    tokens: tokenize(text, reduced),
    count: 0,
    seconds: 0,
    think,
    ms: reduced ? SENTENCE_MS : TOKEN_MS,
    phase: think > 0 ? 'thinking' : 'streaming',
  }
}

const finished = (text: string): Reply => ({ ...make(text, 0), count: Infinity, phase: 'done' })

const step = (r: Reply): Reply => {
  if (r.phase === 'thinking') {
    const seconds = r.seconds + 1
    return { ...r, seconds, phase: seconds >= r.think ? 'streaming' : 'thinking' }
  }
  const count = r.count + 1
  return { ...r, count, phase: count >= r.tokens.length ? 'done' : 'streaming' }
}

/** A list of replies; the one in progress thinks second by second, then streams token by token. */
export function useReplies(initial: string[] = []) {
  const [replies, setReplies] = useState<Reply[]>(() => initial.map(finished))
  const live = replies.findIndex(isBusy)

  useEffect(() => {
    if (live < 0) return
    const r = replies[live]
    const timer = window.setTimeout(
      () => setReplies((prev) => prev.map((x, i) => (i === live ? step(x) : x))),
      r.phase === 'thinking' ? THINK_SECOND : r.ms,
    )
    return () => window.clearTimeout(timer)
  }, [replies, live])

  return {
    replies,
    busy: live >= 0,
    /** starts a new reply at the end of the list */
    add: (text: string, think = 1) => setReplies((prev) => [...prev, make(text, think)]),
    stop: () => setReplies((prev) => prev.map((x) => (isBusy(x) ? { ...x, phase: 'stopped' } : x))),
    reset: () => setReplies(initial.map(finished)),
  }
}

/** A plain conversation: one reply per question, in order. */
export function useChat(think = 1) {
  const [questions, setQuestions] = useState<string[]>([])
  const { replies, busy, add, stop, reset } = useReplies()
  return {
    turns: questions.map((question, i) => ({ question, reply: replies[i] })),
    busy,
    last: replies[replies.length - 1] as Reply | undefined,
    ask: (question: string, answer = answerFor(question).text) => {
      if (busy) return
      setQuestions((prev) => [...prev, question])
      add(answer, think)
    },
    stop,
    reset: () => {
      setQuestions([])
      reset()
    },
  }
}

type Answer = { keys: string[]; text: string; followUps: string[] }

const ANSWERS: Answer[] = [
  {
    keys: ['아이'],
    text: '아이와 함께라면 하루에 두 곳만 도는 느슨한 일정이 좋아요. 첫날은 공항 근처 에코랜드 기차를 타고, 둘째 날은 함덕 해변에서 모래놀이를 한 뒤 아쿠아플라넷에 가요. 마지막 날은 숙소 근처 감귤 따기 체험을 하고 공항으로 가면 이동이 짧아요.',
    followUps: ['유모차 빌릴 곳도 알려줘', '아이랑 갈 식당 추천해줘'],
  },
  {
    keys: ['제주'],
    text: '2박 3일 제주 일정을 짜 봤어요. 첫날은 공항 근처 용두암과 동문시장, 둘째 날은 성산일출봉과 우도, 마지막 날은 협재 해변에서 쉬다가 공항으로 가면 동선이 짧아요. 렌터카는 미리 예약해 두는 게 좋아요.',
    followUps: ['3박 4일로 늘려줘', '맛집도 넣어줘'],
  },
  {
    keys: ['가방'],
    text: '이 가방은 가벼운 나일론이라 여행용으로 좋아요. 수납칸이 다섯 개라 여권과 충전기를 나눠 넣기 편하고, 13인치 노트북까지 들어가요. 다만 지퍼 틈으로 비가 스밀 수 있으니 방수 커버를 함께 챙기세요.',
    followUps: ['비슷한 가방 더 보여줘', '방수 커버도 추천해줘'],
  },
  {
    keys: ['비 오는', '실내'],
    text: '비 오는 날 서울이라면 실내 위주로 묶어 보세요. 오전에는 국립중앙박물관, 점심은 용산역 근처에서 먹고, 오후에는 코엑스 별마당 도서관과 아쿠아리움을 이어서 보면 우산 쓸 일이 거의 없어요.',
    followUps: ['저녁 먹을 곳도 알려줘', '주차하기 편한 곳이야?'],
  },
  {
    keys: ['선물'],
    text: '10만 원 이하 부모님 선물로는 목·어깨 안마 쿠션, 홍삼 선물 세트, 쿠션 좋은 산책화가 많이 고르는 편이에요. 평소 산책을 즐기시면 산책화를, 어깨가 자주 뭉치시면 안마 쿠션을 권해요.',
    followUps: ['안마 쿠션 더 자세히', '포장도 해 줘?'],
  },
]

export function answerFor(question: string) {
  const found = ANSWERS.find((a) => a.keys.some((k) => question.includes(k)))
  return (
    found ?? {
      keys: [],
      text: `‘${question.trim()}’에 맞춰 답해 볼게요. 이 예시는 정해진 답만 돌려주지만, 실제 서비스라면 앞의 대화를 이어받아 더 자세히 답해요.`,
      followUps: [],
    }
  )
}

export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`

const PHASE_STATUS: Record<ReplyPhase, string> = {
  thinking: '생각하는 중…',
  streaming: '답변하는 중…',
  done: '답변 완료',
  stopped: '답변을 멈췄어요',
}

/** What the status line says; it changes with the phase, never with each token. */
export const phaseStatus = (r: Reply | undefined, idle: string) => (r ? PHASE_STATUS[r.phase] : idle)
