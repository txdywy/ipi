import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GroupPanel } from '../src/components/GroupPanel'

describe('GroupPanel', () => {
  it('renders zero progress for an empty group', () => {
    render(
      <GroupPanel
        title="Empty"
        eyebrow="EMPTY"
        headline="No targets configured."
        description="Empty groups should not produce invalid progress values."
        items={[]}
        isRunning={false}
        activeTargetIds={[]}
      />,
    )

    expect(screen.getByText('0/0 已返回')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
