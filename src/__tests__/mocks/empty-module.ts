/**
 * Empty module mock for optional native dependencies
 * Used in vitest config to alias modules that may not be installed
 */

import { vi } from 'vitest'

export default {
  Database: class MockDatabase {
    run() { return this }
    exec() { return [] }
    prepare() {
      return {
        run: () => {},
        get: () => null,
        all: () => [],
      }
    }
    close() {}
  },
}

export const Pool = vi.fn().mockImplementation(() => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
  connect: vi.fn().mockResolvedValue({ release: vi.fn() }),
  end: vi.fn().mockResolvedValue(undefined),
}))

export const createPool = vi.fn().mockImplementation(() => ({
  query: vi.fn().mockResolvedValue([[]]),
  execute: vi.fn().mockResolvedValue([[]]),
  getConnection: vi.fn().mockResolvedValue({
    ping: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  }),
  end: vi.fn().mockResolvedValue(undefined),
}))

export function spawn() {
  return {
    pid: 12345,
    stdin: { write: vi.fn(), end: vi.fn() },
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    kill: vi.fn(),
  }
}
