import { GLSL_NOISE } from '../engine/glsl'
import { ShaderScene } from '../engine/shader-scene'
import type { AnimationStyle, SceneProps } from '../types'

// A slowly drifting noise landscape printed like a survey map. Contours are where
// height * levels crosses a whole number; the distance to that line in pixels is
// (distance in height) / (height change per pixel), measured with two extra samples.
const FRAGMENT = /* glsl */ `
${GLSL_NOISE}

// Height of the land at a screen point (y spans one unit): about 0 in valleys, 1 on peaks.
float terrain(vec2 p) {
  float t = u_time * 0.035;
  vec2 q = p * (2.4 / u_scale) + vec2(t * 2.0, t * 0.7);
  vec2 warp = vec2(vnoise(vec3(q * 0.5, t + 3.0)), vnoise(vec3(q * 0.5 + 5.2, t + 9.0))) - 0.5;
  float h = (fbm(vec3(q + warp * 1.4, t)) - 0.25) / 0.55;
  // the pointer pushes up a round hill, higher while pressed
  if (u_pointer.z > 0.5) {
    vec2 m = (u_pointer.xy - 0.5 * u_resolution) / u_resolution.y;
    vec2 dm = p - m;
    h += (0.5 + 0.35 * u_pointer.w) * exp(-dot(dm, dm) / 0.02);
  }
  return h;
}

// Hypsometric tint: green lowlands, cream plains, tan and brown highlands, pale peaks.
vec3 landTint(float h) {
  vec3 c = mix(vec3(0.66, 0.80, 0.60), vec3(0.82, 0.88, 0.68), smoothstep(0.08, 0.32, h));
  c = mix(c, vec3(0.96, 0.92, 0.77), smoothstep(0.32, 0.55, h));
  c = mix(c, vec3(0.91, 0.79, 0.60), smoothstep(0.55, 0.78, h));
  c = mix(c, vec3(0.80, 0.65, 0.49), smoothstep(0.78, 0.98, h));
  return mix(c, vec3(0.97, 0.95, 0.92), smoothstep(1.02, 1.2, h));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float px = 1.0 / u_resolution.y;
  float h = terrain(uv);
  // height change per pixel, from one sample to the right and one above
  vec2 grad = vec2(terrain(uv + vec2(px, 0.0)) - h, terrain(uv + vec2(0.0, px)) - h);
  float slope = max(length(grad), 1e-6);
  // half width of a thin line in pixels: about one CSS pixel, never thinner than a buffer pixel
  float lw = max(0.7, u_resolution.y / 900.0);

  // water below sea level, with its own soft shoreline
  float sea = 0.06;
  float shoreDist = (h - sea) / slope;
  float wet = clamp(0.5 - shoreDist, 0.0, 1.0);
  vec3 water = mix(vec3(0.72, 0.86, 0.90), vec3(0.55, 0.74, 0.86), smoothstep(0.0, 0.35, sea - h));
  vec3 col = mix(landTint(h), water, wet);

  // hill shading, lit from the upper left
  vec3 n = normalize(vec3(-grad * u_resolution.y * 0.25, 1.0));
  float shade = dot(n, normalize(vec3(-0.6, 0.7, 0.8)));
  col *= mix(1.0, 0.68 + 0.5 * shade, u_relief * (1.0 - 0.7 * wet));

  // contour lines: every fifth one (the index contour) is drawn twice as thick
  float c = h * u_levels;
  float perPx = slope * u_levels;
  float f = fract(c);
  float dist = min(f, 1.0 - f) / perPx;
  float major = step(mod(floor(c + 0.5) + 0.5, 5.0), 1.0);
  float w = lw * (1.0 + major);
  float ink = 1.0 - smoothstep(w - 0.6, w + 0.6, dist);
  // where lines crowd together only the index contours stay, as on printed maps
  ink *= max(major, smoothstep(2.5 * lw, 5.0 * lw, 1.0 / perPx));
  vec3 inkCol = mix(vec3(0.46, 0.30, 0.18), vec3(0.22, 0.45, 0.66), wet);
  col = mix(col, inkCol, ink * (0.7 + 0.25 * major));

  float shore = 1.0 - smoothstep(1.3 * lw - 0.6, 1.3 * lw + 0.6, abs(shoreDist));
  col = mix(col, vec3(0.22, 0.45, 0.66), shore * 0.9);

  // faint map grid that stays put while the land drifts underneath
  vec2 cell = abs(fract(uv * 4.0 + 0.5) - 0.5) * 0.25 * u_resolution.y;
  float grid = 1.0 - smoothstep(0.3, 1.1, min(cell.x, cell.y));
  col = mix(col, vec3(0.32, 0.47, 0.62), grid * 0.16);

  // spot height under the pointer
  if (u_pointer.z > 0.5) {
    float r = 2.5 * lw;
    float pd = length(gl_FragCoord.xy - u_pointer.xy);
    col = mix(col, vec3(0.42, 0.24, 0.14), 1.0 - smoothstep(r - 0.7, r + 0.7, pd));
  }

  // paper grain and a soft vignette
  col *= 0.965 + 0.05 * vnoise(vec3(gl_FragCoord.xy * 0.8, 0.0));
  vec2 v = gl_FragCoord.xy / u_resolution - 0.5;
  col *= 1.0 - 0.28 * dot(v, v);
  gl_FragColor = vec4(col, 1.0);
}
`

function TopographicLinesScene(props: SceneProps) {
  return <ShaderScene fragment={FRAGMENT} {...props} />
}

export const animation: AnimationStyle = {
  id: 'topographic-lines',
  name: '등고선',
  englishName: 'Topographic Lines',
  aliases: ['Contour lines', 'Topo map pattern', '지형도 무늬'],
  description: '같은 높이를 이은 선들이 지형을 따라 천천히 흐르며 모양을 바꾸는 지도 무늬',
  context: '아웃도어·여행 브랜드, 데이터 대시보드 배경, 포스터와 명함의 장식 무늬로 씁니다.',
  technique: 'WebGL',
  interaction: '마우스를 올리면 그 자리에 언덕이 솟아 동심원 등고선이 생기고, 누르고 있으면 더 높아집니다.',
  traits: [
    {
      title: '같은 높이를 잇는 선',
      description: '땅의 높이를 일정한 간격으로 잘라 같은 높이의 점들을 선으로 잇습니다. 선이 촘촘하면 가파르고 성기면 완만한 땅입니다.',
    },
    {
      title: '다섯 줄마다 굵은 선',
      description: '실제 지도처럼 다섯 번째 선(계곡선)을 굵게 그려 높이를 세기 쉽게 합니다. 선 굵기는 화면 픽셀 기준이라 어느 크기에서나 고르게 보입니다.',
    },
    {
      title: '높이에 따른 색',
      description: '가장 낮은 곳은 물, 낮은 땅은 초록, 높은 땅은 황갈색으로 칠합니다. 비스듬한 빛의 음영을 더하면 평면에서도 산의 모양이 읽힙니다.',
    },
  ],
  params: [
    { key: 'levels', label: '줄 수', min: 6, max: 40, step: 1, default: 18, unit: '개' },
    { key: 'scale', label: '지형 크기', min: 0.5, max: 2, step: 0.1, default: 1, unit: '×' },
    { key: 'relief', label: '음영', min: 0, max: 1, step: 0.05, default: 0.5 },
  ],
  Scene: TopographicLinesScene,
}
