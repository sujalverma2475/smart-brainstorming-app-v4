import { colorForUser, darkenColor } from './color';

test('colour is deterministic for the same user', () => {
  expect(colorForUser('sujal')).toBe(colorForUser('sujal'));
});

test('anagram names get different colours', () => {
  expect(colorForUser('ab')).not.toBe(colorForUser('ba'));
});

test('darkenColor lowers lightness and never goes below 0', () => {
  expect(darkenColor('hsl(10, 80%, 85%)', 15)).toBe('hsl(10, 80%, 70%)');
  expect(darkenColor('hsl(10, 80%, 5%)', 15)).toBe('hsl(10, 80%, 0%)');
});
