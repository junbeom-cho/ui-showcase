import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ShowcaseEntry } from '../types'

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

export const accordionEntry: ShowcaseEntry = {
  id: 'accordion',
  name: 'Accordion',
  aliases: ['Collapse', 'Expander', 'Disclosure', '아코디언'],
  description: '제목을 누르면 내용이 펼쳐지고 다시 누르면 접히는 목록.',
  Preview: AccordionPreview,
}
