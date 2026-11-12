import { GLSL_NOISE } from '../engine/glsl'
import { ShaderScene } from '../engine/shader-scene'
import type { AnimationStyle, SceneProps } from '../types'

// A Mandelbulb: z -> z^n + c in spherical coordinates. Its distance estimate tells
// each ray how far it may safely step; rays walk in until they are within a pixel.
// Colour comes from orbit traps (how close the iteration came to the axes and the centre),
// shading from the step count (many steps = deep crevice = darker).
const FRAGMENT = /* glsl */ `
${GLSL_NOISE}

// Distance estimate to the bulb. trap keeps the closest the orbit came to each axis (xyz)
// and to the centre (w, squared).
float bulb(vec3 p, out vec4 trap) {
  vec3 w = p;
  float m = dot(w, w);
  float dz = 1.0;
  trap = vec4(abs(w), m);
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_detail || m > 256.0) break;
    float r = max(sqrt(m), 1e-5);
    float theta = acos(clamp(w.y / r, -1.0, 1.0)) * u_power;
    float phi = atan(w.x, w.z) * u_power;
    dz = u_power * pow(r, u_power - 1.0) * dz + 1.0;
    w = p + pow(r, u_power) * vec3(sin(theta) * sin(phi), cos(theta), sin(theta) * cos(phi));
    m = dot(w, w);
    trap = min(trap, vec4(abs(w), m));
  }
  m = max(m, 1e-8);
  return 0.25 * log(m) * sqrt(m) / dz;
}

float de(vec3 p) {
  vec4 trap;
  return bulb(p, trap);
}

vec3 calcNormal(vec3 p, float e) {
  vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * de(p + k.xyy * e) +
    k.yyx * de(p + k.yyx * e) +
    k.yxy * de(p + k.yxy * e) +
    k.xxx * de(p + k.xxx * e));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;

  // the camera circles the bulb; the pointer swings it around
  float yaw = u_time * 0.12;
  float pitch = 0.35 + 0.3 * sin(u_time * 0.09);
  if (u_pointer.z > 0.5) {
    vec2 ptr = u_pointer.xy / u_resolution - 0.5;
    yaw += ptr.x * 4.0;
    pitch += ptr.y * 2.2;
  }
  pitch = clamp(pitch, -1.3, 1.3);
  float zoom = 1.5;
  // low powers make a fatter shape, tall screens need more room at the sides
  float dist = (4.0 + 0.5 * max(0.0, 4.0 - u_power)) * max(1.0, 1.15 / aspect);
  vec3 ro = dist * vec3(cos(pitch) * sin(yaw), sin(pitch), cos(pitch) * cos(yaw));
  vec3 fw = normalize(-ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(uv.x * rt + uv.y * up + zoom * fw);

  // deep space backdrop
  vec3 col = mix(vec3(0.06, 0.05, 0.11), vec3(0.01, 0.01, 0.025), clamp(length(uv) * 1.3, 0.0, 1.0));

  // march only inside a bounding sphere around the bulb
  float b = dot(ro, rd);
  float disc = b * b - (dot(ro, ro) - 4.84);
  if (disc > 0.0) {
    float s = sqrt(disc);
    float t = max(-b - s, 0.0);
    float tEnd = -b + s;
    float pixel = 1.0 / (u_resolution.y * zoom);
    float minD = 1000.0;
    float steps = 0.0;
    vec4 trap = vec4(0.0);
    for (int i = 0; i < 90; i++) {
      float d = bulb(ro + rd * t, trap);
      minD = min(minD, d);
      if (d < 0.75 * pixel * t) break;
      t += d;
      steps += 1.0;
      if (t > tEnd) break;
    }

    if (t < tEnd) {
      vec3 pos = ro + rd * t;
      vec3 n = calcNormal(pos, 0.5 * pixel * t);
      vec3 lig = normalize(-0.5 * rt + 0.75 * up - 0.55 * fw);
      float dif = clamp(dot(n, lig), 0.0, 1.0);
      // cheap ambient occlusion: rays that needed many steps went into a crevice
      float ao = clamp(1.2 - steps / 80.0, 0.0, 1.0);
      // orbit-trap colour bands, slowly cycling
      float band = 1.1 * sqrt(trap.w) + 0.8 * trap.y + 0.02 * u_time;
      vec3 base = palette(band, vec3(0.55, 0.4, 0.5), vec3(0.45, 0.4, 0.45), vec3(1.0), vec3(0.0, 0.15, 0.35));
      float sky = 0.5 + 0.5 * dot(n, up);
      vec3 lin = vec3(1.25, 1.1, 0.95) * 1.35 * dif + vec3(0.2, 0.24, 0.42) * sky;
      col = base * lin * ao;
      float spe = pow(clamp(dot(reflect(rd, n), lig), 0.0, 1.0), 20.0) * dif;
      col += vec3(1.0, 0.9, 0.75) * spe * 0.4 * ao;
      // rim glow along the silhouette
      float fre = pow(clamp(1.0 + dot(n, rd), 0.0, 1.0), 3.0);
      col += mix(vec3(0.45, 0.55, 1.0), base, 0.35) * fre * (0.15 + 0.9 * u_glow) * (0.4 + 0.6 * ao);
    } else {
      // rays that brushed past the surface leave a halo
      col += vec3(0.4, 0.45, 1.0) * exp(-minD * 9.0) * 0.6 * u_glow;
    }
  }

  vec2 v = gl_FragCoord.xy / u_resolution - 0.5;
  col *= 1.0 - 0.5 * dot(v, v);
  gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(0.9)), 1.0);
}
`

function RaymarchedFractalsScene(props: SceneProps) {
  return <ShaderScene fragment={FRAGMENT} resolution={props.thumb ? 0.35 : 0.6} {...props} />
}

export const animation: AnimationStyle = {
  id: 'raymarched-fractals',
  name: '레이마칭 프랙탈',
  englishName: 'Ray-marched Fractals',
  aliases: ['Mandelbulb', 'Fractal render', '3D 프랙탈'],
  description: '같은 수식을 되풀이해 만든, 끝없이 잘게 갈라지는 3D 형체를 천천히 돌며 비추는 장면',
  context: '뮤직비디오와 VJ 영상, 데모신 작품, SF 영화의 외계 구조물 장면에서 만납니다.',
  technique: 'WebGL',
  interaction: '마우스를 움직이면 그 방향으로 카메라가 형체 주위를 돕니다.',
  traits: [
    {
      title: '광선을 조금씩 전진',
      description: '화면의 점마다 광선을 쏘고, 표면까지 남은 최소 거리만큼 거듭 전진하다 충분히 가까워지면 멈춥니다. 이것이 레이마칭입니다.',
    },
    {
      title: '되풀이로 생기는 세부',
      description: '점을 거듭제곱하고 더하는 계산을 여러 번 되풀이할수록 혹 위에 더 작은 혹이 생깁니다. 세밀함을 낮추면 매끈한 덩어리로 돌아갑니다.',
    },
    {
      title: '궤도로 칠한 색',
      description: '되풀이하는 동안 점이 지나간 자리(오빗 트랩)로 색을 정해 줄무늬 같은 색 띠가 생깁니다. 오래 걸린 광선은 어둡게 칠해 틈새의 깊이를 드러냅니다.',
    },
  ],
  params: [
    { key: 'power', label: '차수', min: 2, max: 10, step: 1, default: 8 },
    { key: 'detail', label: '세밀함', min: 2, max: 8, step: 1, default: 7, unit: '번' },
    { key: 'glow', label: '빛 번짐', min: 0, max: 1, step: 0.05, default: 0.5 },
  ],
  Scene: RaymarchedFractalsScene,
}
