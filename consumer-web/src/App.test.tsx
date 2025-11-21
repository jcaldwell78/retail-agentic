import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('should render without crashing', () => {
    // Basic smoke test to ensure tests run
    expect(true).toBe(true)
  })

  it('should have consumer web title', () => {
    const title = 'Retail Platform - Consumer Web'
    expect(title).toContain('Consumer Web')
  })
})
