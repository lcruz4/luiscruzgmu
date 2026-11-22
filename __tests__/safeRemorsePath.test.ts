import { safeRemorsePath } from '@/lib/auth';

describe('safeRemorsePath', () => {
  it.each([
    ['/projects/remorse-chess', '/projects/remorse-chess'],
    ['/projects/remorse-chess/abc?x=1#h', '/projects/remorse-chess/abc?x=1#h'],
  ])('keeps %s', (input, expected) => {
    expect(safeRemorsePath(input)).toBe(expected);
  });

  it.each([
    [undefined],
    [['/projects/remorse-chess/abc']],
    ['/'],
    ['/projects/workout-tracker'],
    ['/projects/remorse-chessx'],
    ['/projects/remorse-chess/../workout-tracker'],
    ['/projects/remorse-chess/%2e%2e/admin'],
    ['//evil.com/projects/remorse-chess'],
    ['https://evil.com/projects/remorse-chess'],
  ])('sends %p to the lobby', (input) => {
    expect(safeRemorsePath(input)).toBe('/projects/remorse-chess');
  });
});
