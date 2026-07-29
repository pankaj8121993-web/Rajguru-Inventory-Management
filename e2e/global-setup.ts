import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Resets the development database before the suite so tests are deterministic.
 *
 * Without this, a test that creates a godown changes the counts a later test
 * asserts on. Shared mutable state between tests hides real failures.
 */
export default function globalSetup() {
  const script = path.join(__dirname, '..', 'scripts', 'db-reset.sh');
  execFileSync(script, { stdio: 'inherit' });
}
