import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultRow } from '../src/components/ResultRow'
import type { Target } from '../src/types'

const target: Target = {
  id: 'github-favicon',
  label: 'GitHub',
  group: 'global',
  probeType: 'image',
  url: 'https://github.githubassets.com/favicons/favicon.png',
  logoUrl: 'https://github.githubassets.com/favicons/favicon.png',
  timeoutMs: 7000,
  expectedSignal: 'load',
  location: 'Global · Dev',
  tags: ['开发', '协作'],
  emphasis: '适合观察全球开发平台的基础访问情况。',
}

describe('ResultRow logo fallback', () => {
  it('shows a fallback avatar when the remote logo fails to load', () => {
    render(
      <ResultRow
        target={target}
        isRunning={false}
        isActive={false}
        attemptCount={1}
      />,
    )

    fireEvent.error(screen.getByAltText('GitHub logo'))

    expect(screen.getByLabelText('GitHub fallback logo')).toBeInTheDocument()
  })
})
