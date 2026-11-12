import { ShaderScene } from '../engine/shader-scene'
import type { AnimationStyle, SceneProps } from '../types'

// A ray-marched torus tumbling over a checkered floor is lit in greyscale, then
// every cell of the screen is printed as ink or paper only: its brightness is
// compared with the cell's threshold from an 8x8 Bayer matrix (ordered dithering).
const FRAGMENT = /* glsl */ `
const vec3 INK = vec3(0.106, 0.106, 0.184);
const vec3 PAPER = vec3(0.949, 0.914, 0.847);

// torus rotation and height, worked out once per pixel in main()
vec2 g_spinY;
vec2 g_spinX;
float g_lift;

// 2x2 Bayer matrix (0, 2 / 3, 1) / 4 as plain float maths
float bayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}

// 8x8 Bayer threshold in 0..63/64, built from three nested 2x2 steps
float bayer8(vec2 a) {
  a = mod(floor(a), 8.0);
  return bayer2(a) + 0.25 * bayer2(0.5 * a) + 0.0625 * bayer2(0.25 * a);
}

float map(vec3 p) {
  vec3 q = p - vec3(0.0, g_lift, 0.0);
  q = vec3(g_spinY.x * q.x + g_spinY.y * q.z, q.y, -g_spinY.y * q.x + g_spinY.x * q.z);
  q = vec3(q.x, g_spinX.x * q.y - g_spinX.y * q.z, g_spinX.y * q.y + g_spinX.x * q.z);
  float torus = length(vec2(length(q.xz) - 0.6, q.y)) - 0.24;
  float ground = p.y + 0.8;
  return min(torus, ground);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.001, -0.001);
  return normalize(
    e.xyy * map(p + e.xyy) +
    e.yyx * map(p + e.yyx) +
    e.yxy * map(p + e.yxy) +
    e.xxx * map(p + e.xxx));
}

float softShadow(vec3 ro, vec3 rd) {
  float res = 1.0;
  float t = 0.02;
  for (int i = 0; i < 32; i++) {
    float h = map(ro + rd * t);
    res = min(res, 8.0 * h / t);
    t += clamp(h, 0.02, 0.25);
    if (res < 0.001 || t > 6.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

void main() {
  // every pixel of a cell renders the scene at the cell centre, so cells are flat blocks
  float cell = max(1.0, floor(u_pixel * u_resolution.y / 600.0 + 0.5));
  vec2 cellId = floor(gl_FragCoord.xy / cell);
  vec2 centrePx = (cellId + 0.5) * cell;
  float fit = min(u_resolution.x / u_resolution.y, 1.0);
  vec2 uv = (centrePx - 0.5 * u_resolution) / (u_resolution.y * fit);

  float time = u_time;
  g_spinY = vec2(cos(time * 0.55), sin(time * 0.55));
  g_spinX = vec2(cos(time * 0.8), sin(time * 0.8));
  g_lift = 0.15 + 0.05 * sin(time * 1.1);

  vec3 ro = vec3(0.0, 0.75, 3.4);
  vec3 fw = normalize(vec3(0.0, -0.05, 0.0) - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(uv.x * rt + uv.y * up + 1.6 * fw);

  // the light shines from the upper left, or from wherever the pointer is
  vec3 lightDir = normalize(vec3(-0.7, 1.0, 0.55));
  if (u_pointer.z > 0.5) {
    vec2 pp = (u_pointer.xy - 0.5 * u_resolution) / (u_resolution.y * fit);
    lightDir = normalize(vec3(pp.x * 3.0, max(0.5 + pp.y * 2.5, 0.2), 0.8));
  }

  float dist = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 72; i++) {
    float d = map(ro + rd * dist);
    if (d < 0.001) {
      hit = 1.0;
      break;
    }
    dist += d;
    if (dist > 14.0) break;
  }

  // sky: light overhead, a little darker toward the horizon
  float tone = mix(0.62, 0.95, smoothstep(-0.05, 0.45, rd.y));
  if (hit > 0.5) {
    vec3 pos = ro + rd * dist;
    vec3 nrm = normalAt(pos);
    float diff = max(dot(nrm, lightDir), 0.0);
    float shadow = softShadow(pos + nrm * 0.01, lightDir);
    float spec = pow(max(dot(reflect(-lightDir, nrm), -rd), 0.0), 20.0);
    float albedo = 0.9;
    if (pos.y < -0.79) {
      float check = mod(floor(pos.x * 1.2) + floor(pos.z * 1.2), 2.0);
      albedo = mix(0.75, 0.5, check);
      spec = 0.0;
    }
    float lit = albedo * (0.12 + 0.88 * diff * shadow) + 0.5 * spec * shadow;
    tone = mix(lit, tone, smoothstep(5.0, 13.0, dist));
  }

  // ordered dithering: brightness + the cell's Bayer threshold, rounded down to a level
  float steps = u_levels - 1.0;
  float level = clamp(floor(tone * steps + bayer8(cellId)), 0.0, steps) / steps;
  gl_FragColor = vec4(mix(INK, PAPER, level), 1.0);
}
`

function DitheringScene(props: SceneProps) {
  return <ShaderScene fragment={FRAGMENT} {...props} />
}

export const animation: AnimationStyle = {
  id: 'dithering',
  name: '디더링',
  englishName: 'Dithering',
  aliases: ['Ordered dithering', 'Bayer dithering', '1비트 그래픽'],
  description: '부드러운 명암을 잉크색과 종이색 두 가지 점의 규칙적인 무늬만으로 나타낸 애니메이션',
  context: '옛 매킨토시와 게임보이 화면, Return of the Obra Dinn 같은 레트로 게임, 1비트 감성의 포스터와 웹사이트에서 봅니다.',
  technique: 'WebGL',
  interaction: '마우스를 움직이면 조명이 따라 움직여, 그늘진 쪽의 점 무늬가 바뀝니다.',
  traits: [
    { title: '두 가지 색만 사용', description: '칸마다 잉크와 종이 중 하나만 고릅니다. 회색은 두 색 점이 섞인 비율을 보고 눈이 만들어 냅니다.' },
    { title: '규칙적인 점 무늬', description: '밝기를 칸마다 정해진 8×8 바이어(Bayer) 행렬의 문턱값과 비교합니다. 그래서 밝기마다 바둑판·십자 같은 정해진 무늬가 나타납니다.' },
    { title: '큼직한 픽셀', description: '장면을 몇 픽셀씩 묶은 칸 단위로 계산해, 해상도가 낮은 옛 화면처럼 가장자리가 계단져 보입니다.' },
  ],
  params: [
    { key: 'pixel', label: '픽셀 크기', min: 1, max: 8, step: 1, default: 3, unit: 'px' },
    { key: 'levels', label: '단계 수', min: 2, max: 4, step: 1, default: 2, unit: '단계' },
  ],
  Scene: DitheringScene,
}
