import type { ReactNode } from 'react'
import { TimerIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import {
  ConfirmshamingFormat,
  FakeCountdownFormat,
  FakeScarcityFormat,
  ForcedContinuityFormat,
  HiddenCostsFormat,
  NaggingFormat,
  PreCheckedFormat,
  RoachMotelFormat,
  SneakIntoBasketFormat,
} from './formats'

/** One small card in the gallery; the tricky ones get a red dashed outline. */
function Tile({ trick = false, children }: { trick?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex w-full max-w-64 flex-col items-center gap-2 rounded-lg border bg-background p-3 text-center',
        trick && 'outline-2 outline-offset-2 outline-red-500 outline-dashed',
      )}
    >
      {children}
    </div>
  )
}

function Consent({ checked }: { checked: boolean }) {
  return (
    <span className="flex items-center gap-2 text-xs">
      <Checkbox checked={checked} tabIndex={-1} aria-label="특가 소식 받기 (선택)" />
      특가 소식 받기 (선택)
    </span>
  )
}

/** Each trick next to its honest twin: left deceptive, right honest. */
function States() {
  return (
    <StateGrid
      wide
      items={[
        { label: '미리 체크됨 (속임수)', node: <Tile trick><Consent checked /></Tile> },
        { label: '기본 동의 해제 (정직)', node: <Tile><Consent checked={false} /></Tile> },
        {
          label: '작은 글씨 (속임수)',
          node: (
            <Tile trick>
              <Button size="sm" tabIndex={-1}>0원으로 시작하기</Button>
              <span className="text-[9px] text-muted-foreground/70">체험 종료 후 월 9,900원 자동 청구</span>
            </Tile>
          ),
        },
        {
          label: '분명한 고지 (정직)',
          node: (
            <Tile>
              <span className="text-xs">4일째부터 월 9,900원이 결제돼요.</span>
              <Button size="sm" tabIndex={-1}>무료 체험 시작</Button>
            </Tile>
          ),
        },
        {
          label: '죄책감 문구 (속임수)',
          node: (
            <Tile trick>
              <Button size="sm" tabIndex={-1}>쿠폰 받기</Button>
              <span className="text-[10px] text-muted-foreground underline">아니요, 할인은 필요 없어요</span>
            </Tile>
          ),
        },
        {
          label: '동등한 선택지 (정직)',
          node: (
            <Tile>
              <span className="flex gap-2">
                <Button size="sm" tabIndex={-1}>쿠폰 받기</Button>
                <Button size="sm" variant="outline" tabIndex={-1}>괜찮아요</Button>
              </span>
            </Tile>
          ),
        },
        {
          label: '가짜 마감 시계 (속임수)',
          node: (
            <Tile trick>
              <span className="flex items-center gap-1 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                <TimerIcon aria-hidden className="size-3.5" />
                마감 임박 00:09
              </span>
            </Tile>
          ),
        },
        {
          label: '실제 마감일 (정직)',
          node: (
            <Tile>
              <span className="flex items-center gap-1 text-xs">
                <TimerIcon aria-hidden className="size-3.5" />
                특가 기간: 11월 20일 23:59까지
              </span>
            </Tile>
          ),
        },
      ]}
    />
  )
}

function DarkPatternsSpecimen() {
  return (
    <div className="flex w-80 flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">오사카 왕복 항공권</p>
          <p className="text-xs text-muted-foreground">12월 5일–8일 · 성인 1명</p>
        </div>
        <span data-slot="dark-pattern-urgency" className="shrink-0 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
          00:09
        </span>
      </div>
      <label data-slot="dark-pattern-trick" className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5 text-xs">
        <Checkbox checked tabIndex={-1} />
        여행자 보험 추가 (+12,900원)
      </label>
      <Button data-slot="dark-pattern-primary" size="lg" tabIndex={-1}>
        201,900원 결제하기
      </Button>
      <span data-slot="dark-pattern-escape" className="text-center text-[10px] text-muted-foreground underline">
        아니요, 보험 없이 위험하게 갈래요
      </span>
      <p data-slot="dark-pattern-fine-print" className="text-[9px] leading-snug text-muted-foreground/70">
        결제 시 모아 트래블 플러스(월 4,900원) 30일 무료 체험이 시작되며 이후 자동 결제됩니다. 해지는 고객센터 전화로만 가능합니다.
      </p>
    </div>
  )
}

function DarkPatternsPreview() {
  return (
    <div aria-hidden className="flex w-40 flex-col gap-1.5 rounded-lg border bg-background p-3">
      <span className="self-end rounded bg-red-500 px-1 text-[8px] font-semibold text-white">00:09</span>
      <span className="flex items-center gap-1 rounded outline-1 outline-offset-1 outline-red-500 outline-dashed">
        <span className="size-2.5 rounded-sm bg-foreground" />
        <span className="h-1.5 w-20 rounded-full bg-muted-foreground/40" />
      </span>
      <span className="mt-1 h-5 rounded-md bg-foreground" />
      <span className="h-1 w-16 self-center rounded-full bg-muted-foreground/30" />
    </div>
  )
}

export const darkPatternsEntry: ShowcaseEntry = {
  id: 'dark-patterns',
  name: 'Dark Patterns',
  aliases: [
    'Dark pattern',
    'Deceptive design',
    'Deceptive pattern',
    'Roach motel',
    'Pre-checked consent',
    'Fake countdown',
    'Confirmshaming',
    'Sneak into basket',
    'Fake scarcity',
    'Hidden costs',
    'Forced continuity',
    'Nagging',
    '다크 패턴',
    '기만적 설계',
    '속임수 설계',
    '숨은 해지',
    '미리 체크된 동의',
    '가짜 마감 시계',
    '죄책감 버튼',
    '끼워 팔기',
    '가짜 희소성',
    '숨은 비용',
    '몰래 자동 결제',
    '끝없는 권유',
  ],
  description: '사용자가 원하지 않는 가입·결제·동의를 하도록 화면을 꾸며 속이는 설계로, 알아보고 만들지 않도록 정직한 방식과 나란히 비교해 보는 모음.',
  category: 'pattern',
  Preview: DarkPatternsPreview,
  anatomy: {
    Specimen: DarkPatternsSpecimen,
    parts: [
      { slot: 'dark-pattern-urgency', name: 'Fake urgency', description: '근거 없이 서두르게 만드는 마감 시계나 “남은 자리 2석” 같은 표시' },
      { slot: 'dark-pattern-trick', name: 'Trick', description: '고른 적 없는데 미리 체크되거나 담겨 있는 추가 상품·동의' },
      { slot: 'dark-pattern-primary', name: 'Primary action', description: '회사가 바라는 쪽만 크고 눈에 띄게 만든 버튼' },
      { slot: 'dark-pattern-escape', name: 'Escape', description: '거절하는 길. 작고 흐리게, 거절하는 사람을 깎아내리는 말로 씀' },
      { slot: 'dark-pattern-fine-print', name: 'Fine print', description: '자동 결제·해지 조건처럼 꼭 알아야 할 내용을 아주 작고 흐린 글씨로 숨긴 곳' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '같은 동의 칸과 버튼도 기본값·글씨 크기·문구·마감 표시에 따라 정직해지기도, 속임수가 되기도 합니다. 왼쪽이 속임수(빨간 점선), 오른쪽이 같은 내용을 정직하게 보여 주는 방식입니다.',
      Demo: States,
    },
    {
      title: '숨은 해지',
      description:
        '가입은 버튼 한 번인데 해지는 작은 글씨 속 링크와 전화로만 되게 숨겨 두는 수법(Roach motel)입니다. 구독·멤버십을 만든다면 가입한 곳과 같은 화면에서, 같은 수고로 해지할 수 있어야 합니다. 가입한 뒤 해지를 시도해 클릭 수를 세어 보고, 정직한 버전과 비교해 보세요.',
      Demo: RoachMotelFormat,
    },
    {
      title: '미리 체크된 동의',
      description:
        '마케팅 수신이나 제3자 제공 같은 선택 항목을 미리 체크해 두어, 훑어보고 넘어가면 동의한 것이 되게 하는 수법입니다. 선택 항목은 늘 비워 두고 원하는 사람만 고르게 해야 합니다. 필수 항목만 체크하고 바로 가입해 상태 줄에 무엇이 함께 동의됐는지 보세요.',
      Demo: PreCheckedFormat,
    },
    {
      title: '가짜 마감 시계',
      description:
        '진짜 마감이 없는데 시계를 돌려 서두르게 만드는 수법입니다. 0이 되거나 새로고침하면 처음부터 다시 시작하는 것이 들통나는 지점입니다. 마감이 정말 있을 때만 실제 날짜와 시각을 보여 주세요. 20초를 기다리거나 새로고침을 눌러 시계가 다시 시작되는 것을 보세요.',
      Demo: FakeCountdownFormat,
    },
    {
      title: '죄책감 버튼',
      description:
        '거절 버튼을 “아니요, 할인은 필요 없어요”처럼 거절하는 사람을 깎아내리는 말로 써서 미안한 마음에 수락하게 만드는 수법(Confirmshaming)입니다. 거절은 “괜찮아요”, “다음에”처럼 담담하게, 수락과 같은 무게로 둡니다. 두 버전에서 팝업을 거절해 보고 문구를 비교해 보세요.',
      Demo: ConfirmshamingFormat,
    },
    {
      title: '끼워 팔기',
      description:
        '고른 적 없는 보험·추가 상품을 장바구니에 슬쩍 넣어 두는 수법(Sneak into basket)입니다. 추가 상품은 체크하지 않은 채로 권하기만 해야 합니다. 항공권을 장바구니에 담고 합계와 직접 고르지 않은 상품 수를 확인한 뒤, 보험을 빼고 결제해 보세요.',
      Demo: SneakIntoBasketFormat,
    },
    {
      title: '가짜 희소성',
      description:
        '“남은 객실 단 2개!”, “지금 37명이 보고 있어요”처럼 근거 없는 숫자로 조급하게 만드는 수법입니다. 재고를 보여 준다면 실제 숫자를, 예약하면 줄어드는 숫자를 보여 줘야 합니다. 몇 번 예약하고 새로고침해도 숫자가 그대로인지 확인해 보세요.',
      Demo: FakeScarcityFormat,
    },
    {
      title: '숨은 비용',
      description:
        '처음엔 싼 가격만 보여 주고 보험료·수수료를 마지막 결제 단계에서야 더하는 수법입니다. 여기까지 들인 수고 때문에 그냥 결제하기 쉽습니다. 꼭 내야 하는 비용은 처음부터 총액에 넣어 보여 주세요. 다음을 눌러 결제 단계까지 가며 처음 본 가격과 지금 가격을 비교해 보세요.',
      Demo: HiddenCostsFormat,
    },
    {
      title: '몰래 자동 결제',
      description:
        '무료 체험이 끝나면 알림 없이 유료로 바뀌고, 그 사실은 작은 글씨에만 적어 두는 수법(Forced continuity)입니다. 체험을 만든다면 언제 얼마가 나가는지 분명히 알리고, 끝나기 전에 알려 주고, 한 번에 끌 수 있게 해야 합니다. 체험을 시작하고 하루 지나기를 눌러 결제 금액과 받은 알림 수를 보세요.',
      Demo: ForcedContinuityFormat,
    },
    {
      title: '끝없는 권유',
      description:
        '“나중에”를 눌러도 화면을 넘길 때마다 같은 권유를 다시 띄워 지쳐서 수락하게 만드는 수법(Nagging)입니다. 권유는 한 번만 하고, “다시 묻지 않기”를 함께 둬야 합니다. 나중에를 누르고 다음 특가 보기를 몇 번 눌러 권유 횟수가 어떻게 늘어나는지 보세요.',
      Demo: NaggingFormat,
    },
  ],
}
