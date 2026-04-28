import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProbeResult, Target, VisitorProfile } from '../src/types'

const { groups, targets, releaseRun, runAllProbesMock, buildVisitorProfileMock } = vi.hoisted(() => ({
  groups: [
    {
      key: 'global',
      label: '国际主流',
      eyebrow: 'GLOBAL STACK',
      headline: '并发观测测试',
      description: '验证并发运行时的界面状态。',
    },
  ],
  targets: [
    {
      id: 'alpha',
      label: 'Alpha',
      group: 'global',
      probeType: 'fetch',
      url: 'https://alpha.example.com',
      logoUrl: '/brand-logos/github.svg',
      timeoutMs: 1000,
      expectedSignal: 'opaque',
      location: 'Global · Alpha',
      tags: ['A'],
      emphasis: 'Alpha route',
    },
    {
      id: 'beta',
      label: 'Beta',
      group: 'global',
      probeType: 'fetch',
      url: 'https://beta.example.com',
      logoUrl: '/brand-logos/github.svg',
      timeoutMs: 1000,
      expectedSignal: 'opaque',
      location: 'Global · Beta',
      tags: ['B'],
      emphasis: 'Beta route',
    },
  ] as Target[],
  releaseRun: { current: () => {} },
  runAllProbesMock: vi.fn(),
  buildVisitorProfileMock: vi.fn(),
}))

vi.mock('../src/config/targets', () => ({
  GROUPS: groups,
  TARGETS: targets,
}))

vi.mock('../src/lib/ip/buildVisitorProfile', () => ({
  buildVisitorProfile: buildVisitorProfileMock,
}))

vi.mock('../src/lib/probes/probeRunner', () => ({
  ATTEMPTS_PER_TARGET: 5,
  runAllProbes: runAllProbesMock,
}))

import { App } from '../src/app/App'

const readyVisitorProfile: VisitorProfile = {
  status: 'ready',
  hasIpv6Reachability: false,
  dataSources: ['ipify'],
  summary: 'test profile',
}

const makeResult = (target: Target): ProbeResult => ({
  target,
  status: 'reachable',
  confidence: 'high',
  latencyMs: 120,
  successRate: 100,
  attemptCount: 5,
  reason: `${target.label} ok`,
  raw: Array.from({ length: 5 }, () => ({
    targetId: target.id,
    signal: 'opaque' as const,
    ok: true,
    durationMs: 120,
  })),
})

describe('App concurrent progress', () => {
  it('keeps multiple target cards active while probes run concurrently and clears stale state on rerun', async () => {
    buildVisitorProfileMock.mockResolvedValue(readyVisitorProfile)

    runAllProbesMock.mockImplementation(async (callbacks) => {
      callbacks.onTargetStart?.(targets[0], 0, targets.length)
      callbacks.onTargetAttempt?.(targets[0], 1, 5)
      callbacks.onTargetStart?.(targets[1], 1, targets.length)
      callbacks.onTargetAttempt?.(targets[1], 1, 5)

      await new Promise<void>((resolve) => {
        releaseRun.current = resolve
      })

      const alphaResult = makeResult(targets[0])
      const betaResult = makeResult(targets[1])

      callbacks.onTargetFinish?.(alphaResult, 1, targets.length)
      callbacks.onTargetFinish?.(betaResult, 2, targets.length)

      return [alphaResult, betaResult]
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/正在并发检测 2 个目标/)).toBeInTheDocument()
      expect(screen.getByText('Alpha').closest('article')).toHaveClass('result-row--active')
      expect(screen.getByText('Beta').closest('article')).toHaveClass('result-row--active')
    })

    releaseRun.current()

    await screen.findByText('检测完成')
    await screen.findByText('Alpha ok')
    expect(screen.getByText('2/2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重新测试' }))

    await waitFor(() => {
      expect(screen.getByText(/正在并发检测 2 个目标/)).toBeInTheDocument()
      expect(screen.getByText('Alpha').closest('article')).toHaveClass('result-row--active')
      expect(screen.getByText('Beta').closest('article')).toHaveClass('result-row--active')
      expect(screen.queryByText('Alpha ok')).not.toBeInTheDocument()
      expect(screen.getByText('0/2')).toBeInTheDocument()
    })

    releaseRun.current()

    await screen.findByText('检测完成')
  })
})
