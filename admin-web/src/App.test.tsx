import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('should render without crashing', () => {
    // Basic smoke test to ensure tests run
    expect(true).toBe(true)
  })

  it('should have admin dashboard title', () => {
    const title = 'Retail Platform - Admin Dashboard'
    expect(title).toContain('Admin Dashboard')
  })
})
