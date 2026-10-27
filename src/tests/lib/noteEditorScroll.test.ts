import { getNoteEditorScrollY } from '@/lib/noteEditorScroll';

const metrics = {
  caretY: 100,
  caretHeight: 32,
  scrollY: 0,
  viewportHeight: 500,
  contentHeight: 1200,
};

it('keeps the scroll still while the insertion line is visible', () => {
  expect(getNoteEditorScrollY(metrics)).toBe(0);
});

it('follows a wrapped line before it reaches the floating footer', () => {
  expect(getNoteEditorScrollY({ ...metrics, caretY: 420 })).toBe(72);
});

it('follows edits above the current viewport instead of jumping to the end', () => {
  expect(getNoteEditorScrollY({ ...metrics, scrollY: 300 })).toBe(44);
});

it('keeps the insertion line visible when the keyboard shrinks the viewport', () => {
  expect(getNoteEditorScrollY({ ...metrics, caretY: 420, viewportHeight: 300 })).toBe(272);
});

it('stays within the scrollable content and waits for layout measurements', () => {
  expect(getNoteEditorScrollY({ ...metrics, caretY: 900, contentHeight: 600 })).toBe(100);
  expect(getNoteEditorScrollY({ ...metrics, caretY: 0, scrollY: 100 })).toBe(0);
  expect(getNoteEditorScrollY({ ...metrics, viewportHeight: 0, scrollY: 100 })).toBe(100);
});
