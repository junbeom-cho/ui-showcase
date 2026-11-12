import { useEffect, useRef, useState } from 'react'
import type { Params } from '../types'
import { usePointer } from './pointer'
import { useLoop } from './use-loop'

const VERTEX = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`

/**
 * Prepended to every fragment shader, so scenes must not declare these:
 *   u_resolution  drawing-buffer size in pixels
 *   u_time        scene seconds (scaled by speed, frozen while paused)
 *   u_pointer     xy = pointer in buffer pixels from the bottom-left, z = 1 while inside, w = 1 while pressed
 *   u_<key>       one float per param, e.g. u_count, u_speed
 */
export function shaderHeader(keys: string[]): string {
  return [
    'precision highp float;',
    'uniform vec2 u_resolution;',
    'uniform float u_time;',
    'uniform vec4 u_pointer;',
    ...keys.map((key) => `uniform float u_${key};`),
  ].join('\n')
}

type GlState = {
  gl: WebGLRenderingContext
  canvas: HTMLCanvasElement
  locations: Map<string, WebGLUniformLocation | null>
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  console.error(gl.getShaderInfoLog(shader), '\n', source)
  gl.deleteShader(shader)
  return null
}

/**
 * A full-screen fragment shader that fills its parent. Every mount makes its own
 * canvas and hands the WebGL context back on unmount, because browsers allow only
 * about sixteen live contexts and the index page shows many scenes.
 */
export function ShaderScene({
  fragment,
  params,
  paused,
  thumb = false,
  resolution,
}: {
  /** body of the fragment shader: functions and main(), without the header above */
  fragment: string
  params: Params
  paused: boolean
  thumb?: boolean
  /** buffer pixels per CSS pixel; heavy shaders use less than 1 */
  resolution?: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const pointer = usePointer(box)
  const state = useRef<GlState | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const keys = Object.keys(params).sort()
  const keysKey = keys.join(',')

  const redraw = useLoop(
    box,
    ({ time }) => {
      const s = state.current
      if (!s) return
      const { gl, canvas, locations } = s
      const cssWidth = canvas.clientWidth || 1
      const scale = canvas.width / cssWidth
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(locations.get('u_resolution')!, canvas.width, canvas.height)
      gl.uniform1f(locations.get('u_time')!, time)
      const p = pointer.current
      gl.uniform4f(locations.get('u_pointer')!, p.x * scale, canvas.height - p.y * scale, p.inside ? 1 : 0, p.down ? 1 : 0)
      for (const key of keys) gl.uniform1f(locations.get(`u_${key}`)!, params[key])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    { paused, speed: params.speed ?? 1, redrawKey: JSON.stringify(params) },
  )

  useEffect(() => {
    const host = box.current
    if (!host) return
    const canvas = document.createElement('canvas')
    canvas.className = 'block size-full'
    host.prepend(canvas)

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) {
      setFailure('이 브라우저에서는 WebGL을 쓸 수 없어 움직임을 그리지 못했습니다.')
      canvas.remove()
      return
    }
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const frag = compile(gl, gl.FRAGMENT_SHADER, `${shaderHeader(keysKey ? keysKey.split(',') : [])}\n${fragment}`)
    const program = gl.createProgram()!
    if (vertex && frag) {
      gl.attachShader(program, vertex)
      gl.attachShader(program, frag)
      gl.linkProgram(program)
    }
    if (!vertex || !frag || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailure('셰이더를 준비하지 못했습니다.')
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
      return
    }
    gl.useProgram(program)
    // one triangle that covers the whole screen
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const names = ['u_resolution', 'u_time', 'u_pointer', ...(keysKey ? keysKey.split(',') : []).map((k) => `u_${k}`)]
    const locations = new Map(names.map((name) => [name, gl.getUniformLocation(program, name)]))
    state.current = { gl, canvas, locations }
    setFailure(null)

    const measure = () => {
      const r = host.getBoundingClientRect()
      const ratio = resolution ?? (thumb ? 0.5 : Math.min(window.devicePixelRatio || 1, 1.5))
      canvas.width = Math.max(1, Math.round(r.width * ratio))
      canvas.height = Math.max(1, Math.round(r.height * ratio))
      redraw()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)

    const lost = (event: Event) => {
      event.preventDefault()
      state.current = null
      setFailure('그래픽 자원이 모자라 잠시 멈췄습니다. 페이지를 새로 고치면 다시 움직입니다.')
    }
    canvas.addEventListener('webglcontextlost', lost)

    return () => {
      observer.disconnect()
      canvas.removeEventListener('webglcontextlost', lost)
      state.current = null
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    }
  }, [fragment, keysKey, resolution, thumb, redraw])

  return (
    <div ref={box} className="relative size-full">
      {failure && (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/80">{failure}</p>
      )}
    </div>
  )
}
