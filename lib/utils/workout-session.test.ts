import { describe, expect, it } from 'vitest';
import { getUnloggedSetCount } from './workout-session';

describe('getUnloggedSetCount', () => {
  it('counts only sets that have not been logged', () => {
    expect(
      getUnloggedSetCount([
        { sets: [{ logged: true }, { logged: false }] },
        { sets: [{ logged: false }, { logged: false }] },
      ]),
    ).toBe(3);
  });
});
