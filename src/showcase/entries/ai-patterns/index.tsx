import type { ShowcaseEntry } from '../../types'
import { AiPatternsPreview, AiPatternsSpecimen, States } from './drawings'
import {
  AgentStepsFormat,
  AttachmentFormat,
  CitationsFormat,
  EditPromptFormat,
  FeedbackFormat,
  RegenerateFormat,
  StreamingFormat,
  SuggestionsFormat,
  ThinkingFormat,
} from './formats'

export const aiPatternsEntry: ShowcaseEntry = {
  id: 'ai-patterns',
  name: 'AI Patterns',
  aliases: [
    'Chat UI',
    'Conversational UI',
    'Thinking indicator',
    'Streaming',
    'Suggested prompts',
    'Regenerate',
    'Citations',
    'Feedback',
    'Edit prompt',
    'Attachments',
    'Agent steps',
    'AI 채팅',
    '챗봇',
    'AI 화면',
    '생각 중 표시',
    '스트리밍 답변',
    '추천 질문',
    '다시 생성',
    '출처 표시',
    '답변 피드백',
    '고쳐 묻기',
    '파일 첨부',
    '에이전트 단계',
  ],
  description:
    'AI 도우미와 주고받는 대화 화면에서 생각 중·답변 중 같은 진행 상태를 알리고, 답을 멈추거나 다시 만들고, 출처·피드백·첨부·작업 단계를 다루는 방식을 모은 패턴.',
  category: 'pattern',
  Preview: AiPatternsPreview,
  anatomy: {
    Specimen: AiPatternsSpecimen,
    parts: [
      { slot: 'ai-user-message', name: 'User message', description: '내가 보낸 말. 오른쪽의 색 있는 말풍선으로 도우미의 답과 구분' },
      { slot: 'ai-assistant-message', name: 'Assistant message', description: '도우미의 답. 말풍선 없이 넓게 써서 긴 글도 읽기 쉽게' },
      { slot: 'ai-citation', name: 'Citation', description: '문장 끝의 출처 번호. 가리키거나 누르면 출처 카드가 나옴' },
      { slot: 'ai-actions', name: 'Message actions', description: '답 아래의 복사·좋아요·별로예요·다시 생성 버튼' },
      { slot: 'ai-suggestions', name: 'Suggested prompts', description: '눌러서 바로 물어볼 수 있는 질문 칩' },
      { slot: 'ai-composer', name: 'Composer', description: '입력창과 보내기 버튼. 답하는 동안에는 정지 버튼으로 바뀜' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        'AI 답변 한 번은 보내는 중 → 생각 중 → 답변 중 → 완료로 흘러갑니다. 중간에 사용자가 멈추면 중단됨, 연결이나 서버 문제면 오류가 됩니다. 단계마다 지금 무엇을 하는지 글과 모양으로 함께 알리고, 오류에는 다시 시도 버튼을 붙입니다.',
      Demo: States,
    },
    {
      title: '생각 중 표시',
      description:
        '첫 글자가 나오기까지 몇 초 넘게 걸릴 때, 멈춘 게 아니라 일하는 중이라는 것을 점 애니메이션과 지난 초로 알립니다. 생각한 과정은 접어 두고 궁금한 사람만 펼쳐 보게 합니다. 1초 안에 답이 시작되는 짧은 대화라면 굳이 보여 주지 않아도 됩니다. 보내기를 누른 뒤 ‘생각하는 중’을 눌러 요약이 한 줄씩 늘어나는 것을 보세요. 움직임 줄이기를 켠 기기에서는 점이 멈춰 있습니다.',
      Demo: ThinkingFormat,
    },
    {
      title: '스트리밍 답변',
      description:
        '긴 답을 다 만들 때까지 기다리게 하지 않고 만들어지는 대로 조금씩 보여 줍니다. 끝에 커서를 두어 아직 쓰는 중임을 알리고, 보내기 버튼은 정지 버튼으로 바뀌어 원하던 답이 아니면 바로 끊을 수 있습니다. 화면 낭독기에는 낱말마다 읽어 주지 않고 상태가 바뀔 때만 알립니다. 한 줄짜리 확인 메시지처럼 한 번에 보여 줘도 되는 답에는 쓰지 않습니다. 보낸 뒤 중간에 정지를 눌러 보세요. 움직임 줄이기를 켠 기기에서는 문장 단위로 나옵니다.',
      Demo: StreamingFormat,
    },
    {
      title: '추천 질문 칩',
      description:
        '빈 대화창에서 무엇을 물어야 할지 모르는 사람에게 바로 쓸 수 있는 질문 몇 개를 칩으로 보여 줍니다. 칩을 누르면 바로 보내고, 연필을 누르면 입력창에 넣어 고쳐 보낼 수 있습니다. 답이 끝나면 이어서 물어볼 질문을 다시 제안합니다. 할 일이 분명한 화면에서는 칩이 오히려 방해가 됩니다. 칩 하나를 보내고, 답 아래의 이어 묻기 칩도 눌러 보세요.',
      Demo: SuggestionsFormat,
    },
    {
      title: '다시 생성',
      description:
        '같은 질문에 다른 답을 받아 보고 싶을 때 씁니다. 새 답은 예전 답을 지우지 않고 버전으로 쌓여서, ‹ 1/2 › 화살표로 오가며 비교할 수 있습니다. 답이 늘 같아야 하는 계산이나 조회 결과에는 맞지 않습니다. 다시 생성을 두 번 누른 뒤 화살표로 버전을 넘겨 보세요.',
      Demo: RegenerateFormat,
    },
    {
      title: '출처 표시',
      description:
        '답의 문장마다 어디서 온 정보인지 번호를 달아 사용자가 직접 확인할 수 있게 합니다. 번호를 가리키거나 키보드로 옮겨 가면 출처 카드가 나오고, 누르면 고정됩니다. 일상 대화나 창작처럼 근거가 필요 없는 답에는 달지 않습니다. 숫자 위에 마우스를 올려 보고, 숫자를 눌러 고정한 뒤 Esc로 닫아 보세요.',
      Demo: CitationsFormat,
    },
    {
      title: '답변 피드백',
      description:
        '답 아래에 복사·좋아요·별로예요 버튼을 두어 답을 바로 쓰거나 평가하게 합니다. 별로예요를 누르면 이유를 칩으로 고르고 하고 싶은 말을 덧붙일 수 있게 하되, 쓰지 않아도 보낼 수 있게 합니다. 모은 평가를 쓸 곳이 없다면 버튼을 두지 않는 편이 낫습니다. 별로예요를 눌러 이유를 고르고 보내 보세요.',
      Demo: FeedbackFormat,
    },
    {
      title: '고쳐 묻기',
      description:
        '보낸 질문을 고쳐 다시 물으면 그 아래 답이 새로 써집니다. 예전 질문과 답은 지우지 않고 갈래로 남겨 ‹ 1/2 › 화살표로 돌아가 볼 수 있습니다. 대화 중간의 질문을 고치면 그 뒤 대화가 모두 바뀐다는 것도 알려야 합니다. 연필을 눌러 질문 끝에 ‘아이랑’을 덧붙여 보낸 뒤, 화살표로 처음 질문으로 돌아가 보세요.',
      Demo: EditPromptFormat,
    },
    {
      title: '파일 첨부',
      description:
        '문서·사진·표를 붙여 그 내용에 대해 물을 때 씁니다. 클립 버튼이나 끌어다 놓기로 붙이고, 보내기 전에 이름과 크기가 적힌 칩으로 확인하고 뺄 수 있게 합니다. 크기나 개수 제한은 붙이는 순간 알려 줍니다. 파일을 받을 수 없는 서비스라면 버튼을 두지 않습니다. 예시 파일을 붙여(내 컴퓨터의 파일도 됩니다) 보내 보세요.',
      Demo: AttachmentFormat,
    },
    {
      title: '에이전트 단계',
      description:
        '도우미가 파일 읽기·비교·메일 보내기처럼 여러 도구를 차례로 쓰는 일을 맡았을 때 지금 어느 단계인지 체크리스트로 보여 줍니다. 끝난 단계는 체크, 진행 중인 단계는 스피너로 표시하고, 펼치면 실제로 무엇을 실행했는지 볼 수 있습니다. 한 번에 끝나는 짧은 답에는 쓰지 않습니다. 보내기를 누르고 단계를 펼쳐 본 뒤, 다시 실행으로 처음부터 보세요.',
      Demo: AgentStepsFormat,
    },
  ],
}
