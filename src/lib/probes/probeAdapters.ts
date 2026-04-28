import type { ProbeRawResult, Target } from '../../types'

const measure = async (
  target: Target,
  runner: () => Promise<Pick<ProbeRawResult, 'signal' | 'ok' | 'detail'>>,
): Promise<ProbeRawResult> => {
  const startedAt = performance.now()
  const timeout = new Promise<ProbeRawResult>((resolve) => {
    window.setTimeout(() => {
      resolve({
        targetId: target.id,
        signal: 'timeout',
        ok: false,
        durationMs: performance.now() - startedAt,
        detail: 'Probe timed out',
      })
    }, target.timeoutMs)
  })

  const result = new Promise<ProbeRawResult>((resolve) => {
    runner()
      .then((value) => {
        resolve({
          targetId: target.id,
          durationMs: performance.now() - startedAt,
          ...value,
        })
      })
      .catch((error: unknown) => {
        resolve({
          targetId: target.id,
          signal: 'error',
          ok: false,
          durationMs: performance.now() - startedAt,
          detail: error instanceof Error ? error.message : 'Unknown probe failure',
        })
      })
  })

  return Promise.race([result, timeout])
}

const imageProbe = (target: Target) =>
  measure(target, () =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.referrerPolicy = 'no-referrer'
      image.onload = () => resolve({ signal: 'load', ok: true })
      image.onerror = () => reject(new Error('Image load failed'))
      image.src = `${target.url}${target.url.includes('?') ? '&' : '?'}_t=${Date.now()}`
    }),
  )

const scriptProbe = (target: Target) =>
  measure(target, () =>
    new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.async = true
      script.src = `${target.url}${target.url.includes('?') ? '&' : '?'}_t=${Date.now()}`
      script.onload = () => {
        script.remove()
        resolve({ signal: 'load', ok: true })
      }
      script.onerror = () => {
        script.remove()
        reject(new Error('Script load failed'))
      }
      document.head.appendChild(script)
    }),
  )

const fetchProbe = (target: Target) =>
  measure(target, async () => {
    const response = await fetch(target.url, {
      mode: 'no-cors',
      cache: 'no-store',
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
