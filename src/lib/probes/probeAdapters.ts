import type { ProbeRawResult, Target } from '../../types'

const measure = async (
  target: Target,
  runner: (signal: AbortSignal) => Promise<Pick<ProbeRawResult, 'signal' | 'ok' | 'detail'>>,
): Promise<ProbeRawResult> => {
  const startedAt = performance.now()
  const controller = new AbortController()

  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, target.timeoutMs)

  try {
    const value = await runner(controller.signal)
    clearTimeout(timeoutId)
    return {
      targetId: target.id,
      durationMs: performance.now() - startedAt,
      ...value,
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        targetId: target.id,
        signal: 'timeout',
        ok: false,
        durationMs: performance.now() - startedAt,
        detail: 'Probe timed out',
      }
    }
    return {
      targetId: target.id,
      signal: 'error',
      ok: false,
      durationMs: performance.now() - startedAt,
      detail: error instanceof Error ? error.message : 'Unknown probe failure',
    }
  }
}

const imageProbe = (target: Target) =>
  measure(target, (signal) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.referrerPolicy = 'no-referrer'

      const cleanup = () => {
        image.onload = image.onerror = null
        signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        cleanup()
        image.src = '' // Stop loading
        reject(new DOMException('Aborted', 'AbortError'))
      }

      signal.addEventListener('abort', onAbort)

      image.onload = () => {
        cleanup()
        resolve({ signal: 'load', ok: true })
      }
      image.onerror = () => {
        cleanup()
        reject(new Error('Image load failed'))
      }
      image.src = `${target.url}${target.url.includes('?') ? '&' : '?'}_t=${Math.random().toString(36).slice(2)}`
    }),
  )

const scriptProbe = (target: Target) =>
  measure(target, (signal) =>
    new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.async = true

      const cleanup = () => {
        script.onload = script.onerror = null
        if (script.parentNode) script.remove()
        signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        cleanup()
        reject(new DOMException('Aborted', 'AbortError'))
      }

      signal.addEventListener('abort', onAbort)

      script.onload = () => {
        cleanup()
        resolve({ signal: 'load', ok: true })
      }
      script.onerror = () => {
        cleanup()
        reject(new Error('Script load failed'))
      }
      script.src = `${target.url}${target.url.includes('?') ? '&' : '?'}_t=${Math.random().toString(36).slice(2)}`
      document.head.appendChild(script)
    }),
  )

const fetchProbe = (target: Target) =>
  measure(target, async (signal) => {
    const response = await fetch(target.url, {
      mode: 'no-cors',
      cache: 'no-store',
      signal,
    })

    if (response.type === 'opaque') {
      return { signal: 'opaque', ok: true }
    }

    return { signal: 'load', ok: response.ok, detail: `HTTP ${response.status}` }
  })

export const probeTarget = (target: Target): Promise<ProbeRawResult> => {
  switch (target.probeType) {
    case 'image':
      return imageProbe(target)
    case 'script':
      return scriptProbe(target)
    case 'fetch':
      return fetchProbe(target)
    default:
      return Promise.resolve({
        targetId: target.id,
        signal: 'error',
        ok: false,
        durationMs: 0,
        detail: 'Unsupported probe type',
      })
  }
}
