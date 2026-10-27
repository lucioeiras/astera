import { redirectSystemPath } from '@/app/+native-intent';

it.each([
  [
    'astera://control-add?controlItem=note&controlToken=one',
    '/board?controlAddItem=note&controlToken=one',
  ],
  [
    'astera:///control-add?controlItem=book&controlToken=two',
    '/board?controlAddItem=book&controlToken=two',
  ],
  [
    'astera://add?controlItem=pdf&controlToken=a%20b',
    '/board?controlAddItem=pdf&controlToken=a%20b',
  ],
  [
    'astera://control-add?controlItem=invalid&controlToken=three',
    '/board?controlAddItem=all&controlToken=three',
  ],
  ['astera://expo-sharing', '/handle-share'],
])('routes the Astera link %s', (path, expected) => {
  expect(redirectSystemPath({ path, initial: true })).toBe(expected);
});

it.each(['/settings', 'invalid url', 'other-app://add?controlItem=note', 'astera://unknown'])(
  'preserves unrelated or invalid paths: %s',
  (path) => {
    expect(redirectSystemPath({ path, initial: false })).toBe(path);
  }
);
