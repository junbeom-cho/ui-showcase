import { GLSL_NOISE } from '../engine/glsl'
import { ShaderScene } from '../engine/shader-scene'
import type { AnimationStyle, SceneProps } from '../types'

// Each ball adds r²/d² to a field; where the sum passes 1 we are "inside".
// Near each other the fields add up, so balls swell toward each other and merge.
const FRAGMENT = /* glsl */ `
${GLSL_NOISE}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;
  float field = 0.0;
  vec3 tint = vec3(0.0);

  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    if (fi >= u_count) break;
    float t = u_time * (0.35 + 0.08 * fi);
    // stay near the middle so balls meet often; narrow stages squeeze sideways
    vec2 c = vec2(sin(t + fi * 1.7) * 0.36 * min(aspect, 1.7), cos(t * 1.3 + fi * 2.3) * 0.29);
    float r = (0.085 + 0.03 * sin(fi * 3.1)) * u_size;
    float v = r * r / max(dot(uv - c, uv - c), 1e-5);
    field += v;
    tint += v * palette(fi / u_count + 0.05 * u_time, vec3(0.6), vec3(0.4), vec3(1.0), vec3(0.0, 0.33, 0.67));
  }

  // the pointer is one more ball you can push into the others
  if (u_pointer.z > 0.5) {
    vec2 pc = (u_pointer.xy - 0.5 * u_resolution) / u_resolution.y;
    float r = 0.1 * u_size;
    float v = r * r / max(dot(uv - pc, uv - pc), 1e-5);
    field += v;
    tint += v * vec3(1.0, 0.95, 0.75);
  }

  tint /= max(field, 1e-4);
  float edge = smoothstep(0.96, 1.04, field);
  // depth is 0 at the surface and grows toward the centres: a thin bright rim, then an even body
  float depth = smoothstep(1.0, 4.0, field);
  float rim = 1.0 - smoothstep(1.0, 1.35, field);
  vec3 background = vec3(0.035, 0.03, 0.07) + 0.04 * vnoise(vec3(uv * 3.0, u_time * 0.1));
  vec3 ball = tint * (0.82 + 0.18 * depth) + rim * 0.35 + pow(depth, 3.0) * 0.2;
  float halo = smoothstep(0.35, 1.0, field) * (1.0 - edge) * u_glow;
  gl_FragColor = vec4(mix(background, ball, edge) + halo * tint * 0.7, 1.0);
}
`

function MetaballsScene(props: SceneProps) {
  return <ShaderScene fragment={FRAGMENT} {...props} />
}

export const animation: AnimationStyle = {
  id: 'metaballs',
  name: '메타볼',
  englishName: 'Metaballs',
  aliases: ['Blobby objects', 'Gooey blobs', '끈적한 공'],
  description: '공들이 가까워지면 물방울처럼 서로 늘어나 붙고, 멀어지면 다시 떨어지는 애니메이션',
  context: '라바 램프 같은 배경, 로딩 표시, 음악·브랜드 영상의 유기적인 장식에 씁니다.',
  technique: 'WebGL',
  interaction: '마우스를 올리면 노란 공 하나가 생겨 다른 공들과 붙었다 떨어집니다.',
  traits: [
    { title: '경계가 녹아 붙음', description: '공마다 주변에 힘의 장을 만들고, 장의 합이 기준을 넘는 곳을 칠합니다. 그래서 가까운 공끼리 매끄럽게 이어집니다.' },
    { title: '섞이는 색', description: '붙은 부분은 두 공의 색이 가까운 쪽 비율로 섞여 부드럽게 바뀝니다.' },
    { title: '점마다 계산하는 셰이더', description: '화면의 모든 픽셀이 동시에 "나는 공 안인가"를 계산합니다. 그래픽 카드가 하는 일입니다.' },
  ],
  params: [
    { key: 'count', label: '공 개수', min: 2, max: 12, step: 1, default: 7, unit: '개' },
    { key: 'size', label: '크기', min: 0.5, max: 2, step: 0.1, default: 1, unit: '×' },
    { key: 'glow', label: '번짐', min: 0, max: 1, step: 0.05, default: 0.3 },
  ],
  Scene: MetaballsScene,
}
