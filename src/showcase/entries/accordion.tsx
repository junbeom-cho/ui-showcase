import { CreditCardIcon, PackageIcon, RotateCcwIcon } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

function One({ open = false, disabled = false, demoState }: { open?: boolean; disabled?: boolean; demoState?: string }) {
  return (
    <Accordion type="single" collapsible defaultValue={open ? 'a' : undefined} className="w-full max-w-48">
      <AccordionItem value="a" disabled={disabled}>
        <AccordionTrigger data-demo-state={demoState}>배송 안내</AccordionTrigger>
        <AccordionContent>2~3일 걸립니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '닫힘', node: <One /> },
        { label: '열림', node: <One open /> },
        { label: '호버', node: <One demoState="hover" /> },
        { label: '포커스', node: <One demoState="focus" /> },
        { label: '비활성', node: <One disabled /> },
      ]}
    />
  )
}

function AccordionPreview() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-56">
      <AccordionItem value="shipping">
        <AccordionTrigger>배송은 얼마나 걸리나요?</AccordionTrigger>
        <AccordionContent>보통 2~3일 걸립니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="refund">
        <AccordionTrigger>환불할 수 있나요?</AccordionTrigger>
        <AccordionContent>받은 날부터 7일 안에 가능합니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function AccordionSpecimen() {
  return (
    <Accordion type="single" collapsible defaultValue="open" className="w-full max-w-72">
      <AccordionItem value="open">
        <AccordionTrigger>배송은 얼마나 걸리나요?</AccordionTrigger>
        <AccordionContent>주문 후 보통 2~3일 안에 도착합니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="closed">
        <AccordionTrigger>환불할 수 있나요?</AccordionTrigger>
        <AccordionContent>받은 날부터 7일 안에 가능합니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const faq = [
  { q: '비밀번호를 잊어버렸어요.', a: '로그인 화면의 "비밀번호 찾기"를 누르면 이메일로 재설정 링크를 보냅니다.' },
  { q: '여러 기기에서 쓸 수 있나요?', a: '같은 계정으로 최대 3대까지 동시에 로그인할 수 있습니다.' },
  { q: '탈퇴하면 자료는 어떻게 되나요?', a: '30일 동안 보관한 뒤 모두 지웁니다. 그 전에는 복구할 수 있습니다.' },
]

function SingleFaq() {
  return (
    <Accordion type="single" collapsible defaultValue="0" className="w-full max-w-96">
      {faq.map((item, i) => (
        <AccordionItem key={item.q} value={String(i)}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function MultipleOpen() {
  return (
    <Accordion type="multiple" defaultValue={['0', '1']} className="w-full max-w-96">
      {faq.map((item, i) => (
        <AccordionItem key={item.q} value={String(i)}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

const policies = [
  { icon: PackageIcon, title: '배송', body: '오후 2시 전 주문은 당일 출고합니다. 제주·산간 지역은 하루 더 걸립니다.' },
  { icon: RotateCcwIcon, title: '교환·반품', body: '상품을 받은 날부터 7일 안에 마이페이지에서 신청하세요.' },
  { icon: CreditCardIcon, title: '결제', body: '카드, 계좌이체, 간편결제를 쓸 수 있습니다. 할부는 5만 원부터 가능합니다.' },
]

function BorderedAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-96 rounded-lg border bg-background">
      {policies.map((p) => (
        <AccordionItem key={p.title} value={p.title} className="px-4">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <p.icon className="size-4 text-muted-foreground" />
              {p.title}
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{p.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export const accordionEntry: ShowcaseEntry = {
  id: 'accordion',
  name: 'Accordion',
  aliases: ['Collapse', 'Expander', 'Disclosure', '아코디언'],
  description: '제목을 누르면 내용이 펼쳐지고 다시 누르면 접히는 목록.',
  category: 'display',
  Preview: AccordionPreview,
  anatomy: {
    Specimen: AccordionSpecimen,
    parts: [
      { slot: 'accordion-item', name: 'AccordionItem', description: '제목과 내용을 묶은 한 칸' },
      { slot: 'accordion-trigger', name: 'AccordionTrigger', description: '눌러서 펼치고 접는 제목 줄' },
      { slot: 'accordion-trigger-icon', name: 'icon', description: '열림 상태에 따라 뒤집히는 꺾쇠' },
      { slot: 'accordion-content', name: 'AccordionContent', description: '펼쳤을 때만 보이는 내용' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description: '항목 하나가 닫히고 열리는 모습과, 호버하면 제목에 밑줄이 생기는 모습입니다.',
      Demo: States,
    },
    {
      title: '하나만 열기',
      description: '자주 묻는 질문처럼 하나를 열면 나머지는 저절로 닫힙니다 (type="single").',
      Demo: SingleFaq,
    },
    {
      title: '여러 개 열기',
      description: '여러 항목을 함께 펼쳐 비교할 수 있습니다 (type="multiple").',
      Demo: MultipleOpen,
    },
    {
      title: '테두리와 아이콘',
      description: '상품 상세 페이지의 안내처럼 상자로 감싸고 제목 앞에 아이콘을 둡니다.',
      Demo: BorderedAccordion,
    },
  ],
}
