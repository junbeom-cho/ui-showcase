import { GLSL_NOISE } from '../engine/glsl'
import { ShaderScene } from '../engine/shader-scene'
import type { AnimationStyle, SceneProps } from '../types'

// A ray-marched toy set: a chick, a rounded cube, a ring and two little balls on a
// photo-studio sweep. Clay look = matte wrap lighting, very soft shadows, ambient
// occlusion in the contacts, a faint hand-made bump and no sharp highlight.
// Every object hops with squash and stretch; nearby pieces merge like soft dough.
const FRAGMENT = /* glsl */ `
${GLSL_NOISE}

// Per-object animation state, set once per pixel at the top of main().
vec3 hopChick;
vec3 hopCube;
vec3 hopRing;
vec3 hopBallA;
vec3 hopBallB;
vec2 posBallA;
vec2 posBallB;
float turnChick;
float turnCube;
float turnRing;

// Set by map(): the hit point in the object's own frame (so bumps stick to the clay)
// and whether it is an object (1) or the backdrop (0).
vec3 gTex;
float gObj;

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

// One bounce cycle: x = lift above the floor, y = vertical scale, z = horizontal scale.
// The first fifth of the cycle is ground contact (squash), the rest is the jump (stretch).
vec3 hop(float t, float lift) {
  float ph = fract(t);
  float squash = 0.0;
  float stretch = 0.0;
  float h = 0.0;
  if (ph < 0.2) {
    squash = sin(ph * 15.70796);
  } else {
    float s = (ph - 0.2) / 0.8;
    h = 4.0 * s * (1.0 - s);
    stretch = abs(1.0 - 2.0 * s) * smoothstep(0.0, 0.12, s) * smoothstep(0.0, 0.12, 1.0 - s);
  }
  float sy = 1.0 + u_softness * (0.3 * stretch - 0.42 * squash);
  return vec3(h * lift, sy, inversesqrt(sy));
}

// Into an object's frame: origin on the floor under it, squashed by its hop.
vec3 toLocal(vec3 p, vec2 at, vec3 h) {
  vec3 q = p - vec3(at.x, h.x, at.y);
  return vec3(q.x / h.z, q.y / h.y, q.z / h.z);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

// Smooth union that also blends colour (.yzw) and texture frame where two shapes meet.
vec4 blend(vec4 a, vec4 b, float k, inout vec3 ta, vec3 tb) {
  float h = clamp(0.5 + 0.5 * (b.x - a.x) / k, 0.0, 1.0);
  ta = mix(tb, ta, h);
  return vec4(mix(b.x, a.x, h) - k * h * (1.0 - h), mix(b.yzw, a.yzw, h));
}

vec4 chick(vec3 p, out vec3 tex) {
  vec3 q = toLocal(p, vec2(0.0, 0.15), hopChick);
  q.xz = rot(turnChick) * q.xz;
  tex = q;
  float body = length(q - vec3(0.0, 0.52, 0.0)) - 0.52;
  float head = length(q - vec3(0.0, 1.12, 0.0)) - 0.36;
  float h = clamp(0.5 + 0.5 * (head - body) / 0.12, 0.0, 1.0);
  float d = mix(head, body, h) - 0.12 * h * (1.0 - h);
  // blush painted on the cheeks
  float cheek = 1.0 - smoothstep(0.05, 0.09, length(vec3(abs(q.x) - 0.2, q.y - 1.05, q.z - 0.28)));
  vec4 res = vec4(d, mix(vec3(1.0, 0.84, 0.42), vec3(1.0, 0.58, 0.55), cheek));
  // eyes and beak are little extra pieces pressed on
  float eye = length(vec3(abs(q.x) - 0.13, q.y - 1.18, q.z - 0.31)) - 0.055;
  if (eye < res.x) res = vec4(eye, vec3(0.13, 0.11, 0.13));
  float beak = length(q - vec3(0.0, 1.07, 0.35)) - 0.06;
  if (beak < res.x) res = vec4(beak, vec3(1.0, 0.55, 0.22));
  res.x *= min(hopChick.y, hopChick.z);
  return res;
}

vec4 cube(vec3 p, out vec3 tex) {
  vec3 q = toLocal(p, vec2(-1.75, -0.35), hopCube);
  q.xz = rot(turnCube) * q.xz;
  tex = q;
  float d = sdRoundBox(q - vec3(0.0, 0.47, 0.0), vec3(0.29), 0.18);
  return vec4(d * min(hopCube.y, hopCube.z), vec3(0.56, 0.73, 0.98));
}

vec4 ring(vec3 p, out vec3 tex) {
  vec3 q = toLocal(p, vec2(1.75, -0.35), hopRing) - vec3(0.0, 0.55, 0.0);
  q.xz = rot(turnRing) * q.xz;
  q.yz = rot(1.1) * q.yz;
  tex = q;
  float d = length(vec2(length(q.xz) - 0.4, q.y)) - 0.19;
  return vec4(d * min(hopRing.y, hopRing.z), vec3(0.98, 0.6, 0.72));
}

vec4 ball(vec3 p, vec2 at, vec3 h, float r, vec3 col, out vec3 tex) {
  vec3 q = toLocal(p, at, h);
  tex = q;
  return vec4((length(q - vec3(0.0, r, 0.0)) - r) * min(h.y, h.z), col);
}

vec4 objects(vec3 p, out vec3 tex) {
  float k = 0.04 + 0.3 * u_softness;
  vec3 tb;
  vec4 res = chick(p, tex);
  vec4 b = cube(p, tb);
  res = blend(res, b, k, tex, tb);
  b = ring(p, tb);
  res = blend(res, b, k, tex, tb);
  b = ball(p, posBallA, hopBallA, 0.21, vec3(0.55, 0.88, 0.74), tb);
  res = blend(res, b, k, tex, tb);
  b = ball(p, posBallB, hopBallB, 0.17, vec3(0.76, 0.64, 0.98), tb);
  res = blend(res, b, k, tex, tb);
  return res;
}

// Floor (y = 0) that curves up into a back wall, like a paper sweep in a photo studio.
float backdrop(vec3 p) {
  vec2 q = vec2(p.z + 2.4, p.y);
  if (q.x < 1.6 && q.y < 1.6) return 1.6 - length(q - vec2(1.6));
  return min(q.x, q.y);
}

vec4 map(vec3 p) {
  vec3 tex;
  vec4 res = objects(p, tex);
  float b = backdrop(p);
  gTex = tex;
  gObj = 1.0;
  if (b < res.x) {
    res = vec4(b, vec3(0.97, 0.84, 0.74));
    gTex = p;
    gObj = 0.0;
  }
  return res;
}

// Thumb-print lumps; the finest layer fades out on small canvases where it would only flicker.
float bump(vec3 p) {
  float fine = smoothstep(120.0, 360.0, u_resolution.y);
  return u_bumps * (0.012 * vnoise(p * 9.0) + 0.005 * fine * vnoise(p * 27.0));
}

float surface(vec3 p) {
  float d = map(p).x;
  return d + mix(0.25, 1.0, gObj) * bump(gTex);
}

vec3 calcNormal(vec3 p) {
  vec2 k = vec2(1.0, -1.0);
  float e = 0.002;
  return normalize(
    k.xyy * surface(p + k.xyy * e) +
    k.yyx * surface(p + k.yyx * e) +
    k.yxy * surface(p + k.yxy * e) +
    k.xxx * surface(p + k.xxx * e));
}

float softShadow(vec3 ro, vec3 rd) {
  float res = 1.0;
  float t = 0.02;
  vec3 tex;
  for (int i = 0; i < 24; i++) {
    float h = objects(ro + rd * t, tex).x;
    res = min(res, 5.0 * h / t);
    t += clamp(h, 0.04, 0.4);
    if (res < 0.01 || t > 5.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.02 + 0.11 * float(i);
    float d = map(p + n * h).x;
    occ += (h - d) * sca;
    sca *= 0.85;
  }
  return clamp(1.0 - 1.5 * occ, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;
  float tm = u_time;

  hopChick = hop(tm * 0.8, 0.35);
  hopCube = hop(tm * 0.65 + 0.3, 0.6);
  hopRing = hop(tm * 0.55 + 0.65, 0.45);
  hopBallA = hop(tm * 1.3, 0.5);
  hopBallB = hop(tm * 1.5 + 0.5, 0.42);
  float orbitA = tm * 0.6;
  float orbitB = 2.5 - tm * 0.45;
  posBallA = vec2(0.0, 0.15) + 1.02 * vec2(cos(orbitA), sin(orbitA));
  posBallB = vec2(0.0, 0.15) + 1.08 * vec2(cos(orbitB), sin(orbitB));
  turnChick = 0.45 * sin(tm * 0.7);
  turnCube = tm * 0.5;
  turnRing = 0.5 * sin(tm * 0.4);

  // camera: a slow sway, nudged around by the pointer; backs off on tall screens
  float yaw = 0.28 * sin(tm * 0.17);
  float pitch = 0.3;
  if (u_pointer.z > 0.5) {
    vec2 ptr = u_pointer.xy / u_resolution - 0.5;
    yaw += ptr.x * 1.0;
    pitch += ptr.y * 0.5;
  }
  pitch = clamp(pitch, 0.06, 0.6);
  float dist = 6.6 * max(1.0, 1.45 / aspect);
  vec3 target = vec3(0.0, 0.62, -0.1);
  vec3 ro = target + dist * vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch));
  vec3 fw = normalize(target - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(uv.x * rt + uv.y * up + 1.9 * fw);

  float t = 0.0;
  for (int i = 0; i < 90; i++) {
    float d = map(ro + rd * t).x;
    if (d < 0.0008 * t) break;
    t += d;
    if (t > 60.0) break;
  }

  vec3 col = vec3(0.97, 0.84, 0.74);
  if (t < 60.0) {
    vec3 pos = ro + rd * t;
    vec4 hit = map(pos);
    float obj = gObj;
    vec3 n = calcNormal(pos);
    vec3 lig = normalize(vec3(-0.55, 0.85, 0.6));
    // wrap lighting: light reaches past the terminator, as on a soft matte surface
    float wrap = clamp((dot(n, lig) + 0.5) / 1.5, 0.0, 1.0);
    float sha = softShadow(pos + n * 0.02, lig);
    float occ = calcAO(pos, n);
    float sky = 0.55 + 0.45 * n.y;
    float bounce = clamp(0.5 - 0.5 * n.y, 0.0, 1.0);
    vec3 lin = vec3(1.0, 0.93, 0.82) * 0.95 * wrap * mix(0.4, 1.0, sha);
    lin += vec3(0.6, 0.66, 0.8) * 0.4 * sky;
    lin += vec3(1.0, 0.78, 0.62) * 0.2 * bounce;
    col = hit.yzw * lin * mix(0.45, 1.0, occ);
    // light seems to soak into the rim of soft clay
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
    col += hit.yzw * rim * 0.25 * occ * obj;
    // a broad, faint sheen instead of a sharp highlight
    vec3 hv = normalize(lig - rd);
    col += vec3(0.05) * pow(clamp(dot(n, hv), 0.0, 1.0), 6.0) * sha * obj;
  }

  vec2 v = gl_FragCoord.xy / u_resolution - 0.5;
  col *= 1.0 - 0.35 * dot(v, v);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

function Clay3dScene(props: SceneProps) {
  return <ShaderScene fragment={FRAGMENT} resolution={props.thumb ? 0.5 : 0.75} {...props} />
}

export const animation: AnimationStyle = {
  id: 'clay-3d',
  name: '클레이 3D',
  englishName: 'Clay 3D',
  aliases: ['Clay render', 'Soft 3D illustration', '말랑한 3D'],
  description: '점토로 빚은 듯한 무광 파스텔 덩어리들이 말랑하게 찌그러지며 통통 튀는 3D 장면',
  context: '앱 온보딩 일러스트, 랜딩 페이지의 3D 캐릭터, 브랜드 소개 영상에서 자주 봅니다.',
  technique: 'WebGL',
  interaction: '마우스를 좌우·위아래로 움직이면 카메라가 살짝 돌아 장면을 다른 각도에서 보여 줍니다.',
  traits: [
    {
      title: '무광 파스텔',
      description: '반짝이는 하이라이트 없이 빛이 표면을 부드럽게 감쌉니다. 색은 채도를 낮춘 파스텔이고 그림자도 가장자리가 흐릿하게 번집니다.',
    },
    {
      title: '말랑한 움직임',
      description: '바닥에 닿으면 납작해지고 뛰어오르면 길쭉해지는 스쿼시 앤 스트레치로 무게감을 줍니다. 가까워진 덩어리는 반죽처럼 붙습니다.',
    },
    {
      title: '손으로 빚은 결',
      description: '표면에 아주 작은 울퉁불퉁함을 넣어 손자국 같은 결을 냅니다. 휘어진 스튜디오 배경과 접촉 그림자가 작은 모형을 찍은 사진처럼 보이게 합니다.',
    },
  ],
  params: [
    { key: 'softness', label: '말랑함', min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: 'bumps', label: '울퉁불퉁함', min: 0, max: 1, step: 0.05, default: 0.4 },
  ],
  Scene: Clay3dScene,
}
