import { GLSL_NOISE } from '../engine/glsl'
import { ShaderScene } from '../engine/shader-scene'
import type { AnimationStyle, SceneProps } from '../types'

// A soft continuous-tone picture is "printed" through one to three screens.
// Each screen is a rotated grid; every cell reads the picture at its centre and
// draws a dot whose size grows with how much ink that spot needs. Coloured screens
// (cyan 15°, magenta 75°, yellow 0°) multiply on the paper, slightly misregistered.
const FRAGMENT = /* glsl */ `
${GLSL_NOISE}

const vec3 PAPER = vec3(0.97, 0.95, 0.90);
const vec3 INK_K = vec3(0.10, 0.10, 0.13);
const vec3 INK_C = vec3(0.00, 0.66, 0.92);
const vec3 INK_M = vec3(0.92, 0.05, 0.55);
const vec3 INK_Y = vec3(1.00, 0.90, 0.05);

// ball centres, worked out once per pixel in main()
vec2 g_ball0;
vec2 g_ball1;
vec2 g_ball2;

// buffer pixels (centred on the stage) to scene units; portrait stages zoom out
vec2 toScene(vec2 centred) {
  float fit = min(u_resolution.x / u_resolution.y, 1.0);
  return centred / (u_resolution.y * fit);
}

vec2 ballCentre(float fi) {
  float wide = clamp(u_resolution.x / u_resolution.y, 1.0, 1.7);
  float t = u_time;
  return vec2(
    sin(t * (0.37 + 0.09 * fi) + fi * 2.2) * 0.38 * wide,
    cos(t * (0.29 + 0.06 * fi) + fi * 1.4) * 0.2);
}

// The continuous-tone picture being printed: lit balls drifting over a soft
// gradient, with a shadow where the pointer is.
vec3 picture(vec2 p, vec2 pointer) {
  float n = vnoise(vec3(p * 1.7, u_time * 0.18));
  vec3 col = mix(vec3(0.99, 0.84, 0.50), vec3(0.56, 0.80, 0.96),
    smoothstep(-0.9, 0.9, p.x * 0.8 - p.y + (n - 0.5) * 0.9));
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 c = fi < 0.5 ? g_ball0 : (fi < 1.5 ? g_ball1 : g_ball2);
    float s = length(p - c - vec2(0.05, -0.07)) / (0.19 + 0.035 * fi);
    col *= 1.0 - 0.3 * (1.0 - smoothstep(0.7, 1.35, s));
  }
  vec3 light = normalize(vec3(-0.5, 0.6, 0.65));
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 c = fi < 0.5 ? g_ball0 : (fi < 1.5 ? g_ball1 : g_ball2);
    vec2 q = (p - c) / (0.19 + 0.035 * fi);
    float h = 1.0 - dot(q, q);
    if (h > 0.0) {
      vec3 nrm = vec3(q, sqrt(h));
      vec3 base = fi < 0.5 ? vec3(0.88, 0.16, 0.22) : (fi < 1.5 ? vec3(0.14, 0.33, 0.80) : vec3(0.10, 0.60, 0.42));
      float diff = max(dot(nrm, light), 0.0);
      float spec = pow(max(dot(nrm, halfway), 0.0), 30.0);
      col = base * (0.22 + 0.9 * diff) + spec * 0.9;
    }
  }
  vec2 dp = p - pointer;
  col *= 1.0 - 0.65 * u_pointer.z * exp(-dot(dp, dp) * 18.0);
  return col;
}

// How much of this pixel the dot of screen cell 'cell' covers (0..1). g is the
// pixel in cell units; the dot grows with the ink the picture needs at the cell centre.
float dotFrom(vec2 g, vec2 cell, float pitch, vec2 axisU, vec2 axisV, vec3 mask, vec2 pointer) {
  vec2 centre = cell + 0.5;
  vec3 rgb = picture(toScene((centre.x * axisU + centre.y * axisV) * pitch), pointer);
  float ink = clamp(dot(vec3(1.0) - rgb, mask), 0.0, 1.0);
  float radius = 0.72 * sqrt(ink);
  float coverage = clamp((radius - length(g - centre)) * pitch + 0.5, 0.0, 1.0);
  return coverage * clamp(radius * pitch, 0.0, 1.0);
}

// One printing plate: a grid turned by 'angle' and slid by 'shift' pixels
// (misregistration). Big dots spill into neighbour cells, so check the nearest four.
float plate(float angle, float pitch, vec2 shift, vec3 mask, vec2 pointer) {
  vec2 axisU = vec2(cos(angle), sin(angle));
  vec2 axisV = vec2(-axisU.y, axisU.x);
  vec2 pos = gl_FragCoord.xy - 0.5 * u_resolution - shift;
  vec2 g = vec2(dot(pos, axisU), dot(pos, axisV)) / pitch;
  vec2 cell = floor(g);
  vec2 side = step(0.5, g - cell) * 2.0 - 1.0;
  float c = dotFrom(g, cell, pitch, axisU, axisV, mask, pointer);
  c = max(c, dotFrom(g, cell + vec2(side.x, 0.0), pitch, axisU, axisV, mask, pointer));
  c = max(c, dotFrom(g, cell + vec2(0.0, side.y), pitch, axisU, axisV, mask, pointer));
  c = max(c, dotFrom(g, cell + side, pitch, axisU, axisV, mask, pointer));
  return c;
}

void main() {
  g_ball0 = ballCentre(0.0);
  g_ball1 = ballCentre(1.0);
  g_ball2 = ballCentre(2.0);

  float pitch = max(u_pitch * u_resolution.y / 600.0, 4.0);
  vec2 pointer = toScene(u_pointer.xy - 0.5 * u_resolution);
  float turn = radians(u_angle);
  float slip = pitch * 0.18;

  // paper with a faint grain, then each ink multiplies on top
  vec3 col = PAPER * (0.96 + 0.04 * hash13(vec3(floor(gl_FragCoord.xy), 1.0)));
  if (u_inks < 1.5) {
    float k = plate(turn + radians(45.0), pitch, vec2(0.0), vec3(0.299, 0.587, 0.114), pointer);
    col *= mix(vec3(1.0), INK_K, k);
  } else {
    float cyan = plate(turn + radians(15.0), pitch, vec2(0.6, -0.4) * slip, vec3(1.0, 0.0, 0.0), pointer);
    col *= mix(vec3(1.0), INK_C, cyan);
    float magenta = plate(turn + radians(75.0), pitch, vec2(-0.5, 0.3) * slip, vec3(0.0, 1.0, 0.0), pointer);
    col *= mix(vec3(1.0), INK_M, magenta);
    if (u_inks > 2.5) {
      float yellow = plate(turn, pitch, vec2(0.1, 0.6) * slip, vec3(0.0, 0.0, 1.0), pointer);
      col *= mix(vec3(1.0), INK_Y, yellow);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`

function HalftoneDotsScene(props: SceneProps) {
  return <ShaderScene fragment={FRAGMENT} {...props} />
}

export const animation: AnimationStyle = {
  id: 'halftone-dots',
  name: '하프톤 도트',
  englishName: 'Halftone Dots',
  aliases: ['Halftone', 'Ben-Day dots', '망점'],
  description: '그림의 명암을 크기가 다른 점들로 바꿔 인쇄물처럼 나타낸 애니메이션',
  context: '신문·잡지 사진, 리히텐슈타인풍 팝아트와 만화, 레트로 포스터나 브랜드 그래픽의 질감에서 봅니다.',
  technique: 'WebGL',
  interaction: '마우스를 올리면 그 자리에 그림자가 드리워져, 어두워진 곳의 점이 커지는 모습을 볼 수 있습니다.',
  traits: [
    { title: '어두울수록 큰 점', description: '격자 칸마다 그 자리 그림이 얼마나 어두운지 재고 그만큼 점을 키웁니다. 멀리서 보면 점들이 다시 이어진 명암으로 보입니다.' },
    { title: '기울어진 격자', description: '점은 비스듬한 격자 위에 놓입니다. 색마다 각도를 달리해(시안 15°, 마젠타 75°, 노랑 0°) 겹쳐도 물결무늬 대신 작은 꽃 모양(로제트)이 생깁니다.' },
    { title: '색 분판과 어긋남', description: '시안·마젠타·노랑 판을 따로 찍어 종이 위에 겹칩니다. 판이 살짝 어긋나 가장자리에 다른 색 테두리가 남는 것도 인쇄물다운 특징입니다.' },
  ],
  params: [
    { key: 'pitch', label: '점 간격', min: 4, max: 24, step: 1, default: 10, unit: 'px' },
    { key: 'inks', label: '색 분판 수', min: 1, max: 3, step: 1, default: 3, unit: '색' },
    { key: 'angle', label: '격자 회전', min: -45, max: 45, step: 1, default: 0, unit: '°' },
  ],
  Scene: HalftoneDotsScene,
}
