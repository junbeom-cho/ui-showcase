import { GLSL_NOISE } from '../engine/glsl'
import { ShaderScene } from '../engine/shader-scene'
import type { AnimationStyle, SceneProps } from '../types'

// A 2D signed distance field: each blob is a squashed circle, blobs are melted
// together with a smooth minimum, and flowing noise keeps the outline changing.
// The flat shape is shaded as a dome (normal from the field's gradient) with a
// fake studio reflection, an iridescent film and a fresnel rim, so it reads as
// glossy liquid metal.
const FRAGMENT = /* glsl */ `
${GLSL_NOISE}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Rough signed distance to the liquid, negative inside.
float liquid(vec2 p, vec2 pointer, float wide, float radius) {
  float t = u_time;
  float spread = min(u_blobs - 1.0, 1.0);
  float d = 1000.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    if (fi >= u_blobs) break;
    vec2 c = spread * vec2(
      sin(t * (0.31 + 0.07 * fi) + fi * 2.1) * 0.27 * wide,
      cos(t * (0.26 + 0.05 * fi) + fi * 4.2) * 0.17);
    // squash and stretch along a slowly turning axis, like a wobbling drop
    vec2 q = p - c;
    float a = t * 0.4 + fi * 1.3;
    q = vec2(cos(a) * q.x - sin(a) * q.y, sin(a) * q.x + cos(a) * q.y);
    float squash = u_wobble * 0.18 * sin(t * 1.7 + fi * 2.4);
    q *= vec2(1.0 + squash, 1.0 - squash);
    float blob = length(q) - radius;
    // a small drop slides from inside the blob toward the pointer and pulls a bulge out
    vec2 toPointer = pointer - c;
    float reach = length(toPointer);
    float pull = u_pointer.z * (1.0 - smoothstep(radius + 0.05, radius + 0.6, reach));
    float extent = mix(radius * 0.5, min(reach, radius + 0.12 + 0.1 * u_pointer.w), pull);
    vec2 tip = c + toPointer / max(reach, 0.0001) * extent;
    blob = smin(blob, length(p - tip) - 0.085 * pull, 0.12);
    d = smin(d, blob, 0.16);
  }
  float ripple = (vnoise(vec3(p * 2.4 + vec2(0.0, t * 0.15), t * 0.5)) - 0.5)
    + 0.5 * (vnoise(vec3(p * 4.8 - vec2(t * 0.1, 0.0), t * 0.8 + 7.0)) - 0.5);
  return d + u_wobble * 0.16 * ripple;
}

// A fake studio around the liquid: bright ceiling, dark floor, a dark horizon
// line and one soft window. Chrome is nothing but this, reflected.
vec3 studio(vec3 r) {
  vec3 c = mix(vec3(0.10, 0.08, 0.20), vec3(0.97, 0.96, 1.0), smoothstep(-0.6, 0.45, r.y));
  float band = r.y + 0.25;
  c = mix(c, vec3(0.04, 0.03, 0.10), exp(-band * band * 45.0));
  c += 0.8 * smoothstep(0.78, 0.96, dot(r, normalize(vec3(-0.55, 0.7, 0.45))));
  return c;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  float fit = min(aspect, 1.0);
  float wide = clamp(aspect, 1.0, 1.6);
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec2 p = uv / fit;
  vec2 pointer = (u_pointer.xy - 0.5 * u_resolution) / (u_resolution.y * fit);
  float radius = 0.32 * pow(u_blobs, -0.42);
  float px = 1.0 / (u_resolution.y * fit);

  // the gradient, by finite differences, points out of the surface
  float e = 0.004;
  float d = liquid(p, pointer, wide, radius);
  float dx = liquid(p + vec2(e, 0.0), pointer, wide, radius);
  float dy = liquid(p + vec2(0.0, e), pointer, wide, radius);
  vec2 grad = vec2(dx - d, dy - d) / e;
  float g = max(length(grad), 0.25);
  float dist = d / g;

  // pretend the flat shape is a rounded bead: from the edge inward the height rises
  // along a quarter circle, so the rim faces sideways and the middle keeps curving
  // gently (no flat plateau); the normal is the slope of that height
  float bevel = radius * 1.25;
  float t0 = clamp(-d / (g * bevel), 0.0, 1.0);
  float tx = clamp(-dx / (g * bevel), 0.0, 1.0);
  float ty = clamp(-dy / (g * bevel), 0.0, 1.0);
  float h0 = sqrt(t0 * (2.0 - t0));
  vec2 slope = vec2(sqrt(tx * (2.0 - tx)) - h0, sqrt(ty * (2.0 - ty)) - h0) * (bevel * 0.9 / e);
  vec3 n = normalize(vec3(-slope, 1.0));
  float fres = pow(max(1.0 - n.z, 0.0), 3.0);

  // thin-film colours that shift with the surface angle and flow over time
  float swirl = vnoise(vec3(p * 1.8, u_time * 0.25));
  float hue = 0.5 * dot(n.xy, vec2(0.8, 0.5)) + 0.8 * fres + u_flow * (swirl + 0.06 * u_time);
  vec3 film = palette(hue, vec3(0.6), vec3(0.4), vec3(1.0), vec3(0.0, 0.33, 0.67));
  vec3 rim = palette(hue + 0.35, vec3(0.6), vec3(0.4), vec3(1.0), vec3(0.0, 0.33, 0.67));

  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 col = studio(r) * mix(vec3(1.0), film, 0.75);
  col = mix(col, rim * 1.15, fres * 0.65);
  col += 1.1 * pow(max(dot(n, normalize(vec3(-0.45, 0.6, 1.0))), 0.0), 90.0);
  col += 0.25 * pow(max(dot(n, normalize(vec3(0.6, -0.4, 1.0))), 0.0), 30.0) * rim;

  vec3 bg = mix(vec3(0.82, 0.81, 0.95), vec3(0.98, 0.89, 0.86), smoothstep(-0.7, 0.7, uv.x * 0.5 - uv.y));
  bg += 0.05 * (vnoise(vec3(uv * 1.4, u_time * 0.07)) - 0.5);
  bg *= 1.0 - 0.2 * exp(-max(dist, 0.0) * 11.0);

  float inside = 1.0 - smoothstep(-px, px, dist);
  gl_FragColor = vec4(mix(bg, col, inside), 1.0);
}
`

function LiquidMorphScene(props: SceneProps) {
  return <ShaderScene fragment={FRAGMENT} {...props} />
}

export const animation: AnimationStyle = {
  id: 'liquid-morph',
  name: '리퀴드 모프',
  englishName: 'Liquid Morph',
  aliases: ['Liquid blob', 'Liquid chrome', '액체 덩어리'],
  description: '윤기 나는 액체 덩어리가 윤곽을 끊임없이 바꾸며 서로 합쳐졌다 갈라지는 애니메이션',
  context: '테크·뷰티 브랜드의 첫 화면 배경, AI 음성 비서의 대기 표시, Y2K풍 앨범 아트와 포스터에서 자주 봅니다.',
  technique: 'WebGL',
  interaction: '마우스를 가까이 가져가면 표면이 포인터 쪽으로 혹처럼 끌려 나오고, 누르고 있으면 더 길게 늘어납니다.',
  traits: [
    { title: '흐르듯 바뀌는 윤곽', description: '도형까지의 거리값에 시간에 따라 흐르는 노이즈를 더해 윤곽을 계속 흔듭니다. 그래서 단단한 도형이 아니라 출렁이는 액체처럼 보입니다.' },
    { title: '부드럽게 합쳐지는 덩어리', description: '두 모양의 거리값을 부드러운 최솟값(smooth min)으로 섞습니다. 가까워지면 목이 생기며 이어지고, 멀어지면 가늘어지다 끊어집니다.' },
    { title: '무지갯빛 금속 광택', description: '주변 풍경을 비추는 반사, 가장자리에서 색이 바뀌는 프레넬 테두리, 작고 강한 하이라이트가 겹쳐 비눗방울이나 액체 금속 같은 표면이 됩니다.' },
  ],
  params: [
    { key: 'wobble', label: '출렁임', min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: 'blobs', label: '덩어리 수', min: 1, max: 3, step: 1, default: 3, unit: '개' },
    { key: 'flow', label: '색 흐름', min: 0, max: 2, step: 0.1, default: 1, unit: '×' },
  ],
  Scene: LiquidMorphScene,
}
