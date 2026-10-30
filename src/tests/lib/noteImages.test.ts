import { isNoteImageUri } from '@/lib/noteImages';

it.each(['images/photo.png', 'https://example.com/photo.png', 'data:image/png;base64,YQ=='])(
  'accepts supported image reference %s',
  (uri) => expect(isNoteImageUri(uri)).toBe(true)
);
it.each([
  'images/../../private.png',
  'file:///private/image.png',
  'javascript:alert(1)',
  'data:text/html;base64,YQ==',
])('rejects unsafe image reference %s', (uri) => expect(isNoteImageUri(uri)).toBe(false));
