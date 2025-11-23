import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, expect, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

let mockTime = 0

beforeAll(() => {
  vi.spyOn(performance, 'now').mockImplementation(() => mockTime)
})

declare global {
  // eslint-disable-next-line no-var
  var advanceTime: (ms: number) => void
  // eslint-disable-next-line no-var
  var resetTime: () => void
}

globalThis.advanceTime = (ms: number) => {
  mockTime += ms
}

globalThis.resetTime = () => {
  mockTime = 0
}

globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  const id = globalThis.setTimeout(() => cb(performance.now()), 16)
  return Number(id)
})

globalThis.cancelAnimationFrame = vi.fn((id: number) => {
  globalThis.clearTimeout(id)
})

HTMLCanvasElement.prototype.getContext = vi.fn(
  <T extends RenderingContext>(contextId: string): T | null => {
    if (contextId === 'webgl' || contextId === 'webgl2') {
      return {
        canvas: document.createElement('canvas'),
        drawingBufferWidth: 800,
        drawingBufferHeight: 600,
        getParameter: vi.fn(),
        getExtension: vi.fn(),
        clearColor: vi.fn(),
        clear: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        createShader: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        createProgram: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        useProgram: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        drawArrays: vi.fn(),
      } as unknown as T
    }

    return document
      .createElement('canvas')
      .getContext(contextId as never) as T | null
  }
) as typeof HTMLCanvasElement.prototype.getContext

expect.extend({})
