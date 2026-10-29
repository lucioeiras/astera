// Exercise the real Milkdown/ProseMirror engine, not a native-component mock.
// Run with: bun run test:note-editor
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'https://editor.invalid',
});
for (const name of Object.getOwnPropertyNames(dom.window)) {
  if (!(name in globalThis)) {
    try {
      Object.defineProperty(globalThis, name, {
        value: dom.window[name],
        configurable: true,
        writable: true,
      });
    } catch {}
  }
}
for (const name of [
  'window',
  'document',
  'navigator',
  'Event',
  'CustomEvent',
  'EventTarget',
  'HTMLElement',
  'Element',
  'Node',
  'MutationObserver',
  'File',
  'FileReader',
  'getComputedStyle',
]) {
  Object.defineProperty(globalThis, name, {
    value: dom.window[name],
    configurable: true,
    writable: true,
  });
}
for (const name of ['dispatchEvent', 'addEventListener', 'removeEventListener'])
  globalThis[name] = dom.window[name].bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.ClipboardEvent = class extends dom.window.Event {
  constructor(type, options) {
    super(type, { cancelable: true, bubbles: true });
    this.clipboardData = options.clipboardData;
  }
};
globalThis.DragEvent = class extends dom.window.Event {};
dom.window.Range.prototype.getClientRects = () => [];
dom.window.Range.prototype.getBoundingClientRect = () => ({
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  width: 0,
  height: 0,
});
const { createNoteEditor } = await import('../../../lib/noteEditor/engine.ts');
const root = document.createElement('div');
document.body.append(root);
let imported = 0;
let errorCount = 0;
let failImport = false;
let nativeClipboard = null;
let clipboardReads = 0;
let releaseImport = null;
const options = {
  root,
  markdown:
    '# Heading\n\nParagraph **bold**.\n\n- [ ] Task\n\n![Photo](images/photo.png)\n\n<script>alert("never")</script>',
  placeholder: 'Write a note',
  onChange: () => {},
  importImage: async () => {
    if (releaseImport) await releaseImport;
    if (failImport) throw new Error('disk full');
    return `images/paste-${++imported}.png`;
  },
  resolveImage: async () => 'data:image/png;base64,AQI=',
  readClipboardImage: async () => {
    clipboardReads++;
    return nativeClipboard;
  },
  openLink: () => {},
  onError: () => {
    errorCount++;
  },
};
const engine = await createNoteEditor(options);
try {
  assert.equal(
    await engine.command({ method: 'getMarkdown' }),
    options.markdown,
    'opening preserves exact source'
  );
  assert.equal(
    root.querySelectorAll('script').length,
    0,
    'HTML is never executed/rendered as HTML'
  );
  assert.equal(root.textContent.includes('<script>'), true, 'opaque HTML is retained');
  await engine.command({ method: 'focus', start: true });
  await engine.command({ method: 'format', action: 'bold' });
  engine.view.dispatch(engine.view.state.tr.insertText('Hello '));
  let markdown = await engine.command({ method: 'getMarkdown' });
  assert.match(markdown, /\*\*Hello/);
  assert.match(
    markdown,
    /!\[Photo\]\(images\/photo.png\)/,
    'image alt and relative path survive serialization'
  );
  assert.match(markdown, /<script>alert\("never"\)<\/script>/);
  engine.undo();
  assert.equal((await engine.command({ method: 'getMarkdown' })).includes('Hello'), false);
  engine.redo();
  assert.equal((await engine.command({ method: 'getMarkdown' })).includes('Hello'), true);
  await engine.command({ method: 'setMarkdown', markdown: 'Task' });
  await engine.command({ method: 'focus', start: true });
  await engine.command({ method: 'format', action: 'todo' });
  markdown = await engine.command({ method: 'getMarkdown' });
  assert.match(markdown, /[-*] \[ \] Task/);
  await engine.command({ method: 'setMarkdown', markdown: 'Original' });
  await engine.command({ method: 'focus', start: true });
  await engine.command({ method: 'captureSelection' });
  engine.view.dispatch(engine.view.state.tr.insertText('Before '));
  await engine.command({ method: 'insertImage', uri: 'images/picked.png' });
  markdown = await engine.command({ method: 'getMarkdown' });
  assert.ok(
    markdown.indexOf('Before') < markdown.indexOf('images/picked.png'),
    'bookmark follows intervening edits'
  );
  await engine.command({ method: 'setMarkdown', markdown: 'Selection' });
  await engine.command({ method: 'focus', start: true });
  const file = new File([new Uint8Array([1, 2])], 'paste.png', { type: 'image/png' });
  const event = new ClipboardEvent('paste', {
    clipboardData: { files: [file], getData: () => '' },
  });
  engine.view.dom.dispatchEvent(event);
  markdown = await engine.command({ method: 'getMarkdown' });
  assert.match(markdown, /images\/paste-1.png/, 'saving immediately waits for image import');
  assert.equal(errorCount, 0);
  const { TextSelection } = await import('@milkdown/kit/prose/state');
  // A failed import must neither delete the selection nor allow a stale save.
  await engine.command({ method: 'setMarkdown', markdown: 'Keep selected text' });
  engine.view.dispatch(
    engine.view.state.tr.setSelection(TextSelection.create(engine.view.state.doc, 1, 5))
  );
  failImport = true;
  engine.view.dom.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: { files: [file], getData: () => '' } })
  );
  await assert.rejects(engine.command({ method: 'getMarkdown' }), /import failed/i);
  assert.equal(await engine.command({ method: 'getMarkdown' }), 'Keep selected text');
  assert.equal(errorCount, 1);
  failImport = false;
  // Multiple files are stored first, and replace the selection in one transaction.
  let release;
  releaseImport = new Promise((resolve) => {
    release = resolve;
  });
  engine.view.dom.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: { files: [file, file], getData: () => '' } })
  );
  let finished = false;
  const waitingSave = engine.command({ method: 'getMarkdown' }).then((value) => {
    finished = true;
    return value;
  });
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(finished, false);
  assert.equal(engine.view.state.doc.textContent, 'Keep selected text');
  release();
  markdown = await waitingSave;
  releaseImport = null;
  assert.match(markdown, /images\/paste-2.png/);
  assert.match(markdown, /images\/paste-3.png/);
  assert.equal(markdown.includes('Keep'), false);
  // Empty native paste explicitly calls the bridge; ordinary text never does.
  nativeClipboard = 'data:image/png;base64,AQI=';
  engine.view.dom.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: { files: [], getData: () => '' } })
  );
  markdown = await engine.command({ method: 'getMarkdown' });
  assert.match(markdown, /images\/paste-4.png/);
  assert.equal(clipboardReads, 1);
  engine.view.dom.dispatchEvent(
    new ClipboardEvent('paste', {
      clipboardData: { files: [], getData: (type) => (type === 'text/plain' ? 'Pasted text' : '') },
    })
  );
  markdown = await engine.command({ method: 'getMarkdown' });
  assert.equal(clipboardReads, 1);
  assert.match(markdown, /Pasted text/);
  // The quote control preserves the app's literal-quotation behavior.
  await engine.command({ method: 'setMarkdown', markdown: 'Quote me' });
  await engine.command({ method: 'focus', start: true });
  await engine.command({ method: 'format', action: 'quote' });
  assert.equal((await engine.command({ method: 'getMarkdown' })).trim(), '"Quote me"');
  await engine.command({ method: 'format', action: 'quote' });
  assert.equal((await engine.command({ method: 'getMarkdown' })).trim(), 'Quote me');
  // Existing syntax can normalize only after editing, with no lost content.
  const fixture = readFileSync(new URL('./fixtures/compatibility.md', import.meta.url), 'utf8');
  await engine.command({ method: 'setMarkdown', markdown: fixture });
  assert.equal(await engine.command({ method: 'getMarkdown' }), fixture);
  assert.equal(root.querySelectorAll('script,custom-tag,unknown').length, 0);
  await engine.command({ method: 'focus', start: true });
  engine.view.dispatch(engine.view.state.tr.insertText('Edited '));
  markdown = await engine.command({ method: 'getMarkdown' });
  for (const fragment of [
    'Nested',
    '**bold**',
    '~~strike~~',
    '[ ] Open task',
    '[x] Done task',
    '> Quoted paragraph',
    'images/photo_123.png',
    'Photo alt',
    'Caption',
    'https://example.com/path',
    'images/reference.png',
    'Link title',
    '| Keep',
    'const sample',
    '<custom-tag>Unsupported HTML</custom-tag>',
    '<unknown attribute="value">',
    'Existing footnote text.',
  ]) {
    assert.ok(markdown.includes(fragment), `Missing compatibility fragment: ${fragment}`);
  }
  assert.match(markdown, /[*_]italic[*_]/);
  await engine.command({ method: 'setMarkdown', markdown: '- [ ] Open task\n- [x] Done task' });
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const taskMarker = root.querySelector('.label-wrapper .unchecked');
  assert.ok(
    taskMarker?.querySelector('.note-task-box'),
    'task marker uses the native-style checkbox'
  );
  taskMarker.parentElement.dispatchEvent(
    new dom.window.MouseEvent('pointerdown', { bubbles: true, cancelable: true })
  );
  assert.match(
    await engine.command({ method: 'getMarkdown' }),
    /\[x\] Open task/,
    'styled checkbox still toggles its task'
  );
  assert.match(
    await engine.command({ method: 'getMarkdown' }),
    /\[x\] Done task/,
    'other task stays checked'
  );
  await engine.command({ method: 'setMarkdown', markdown: 'Keep selection' });
  await engine.command({ method: 'focus', start: true });
  engine.view.dispatch(
    engine.view.state.tr.setSelection(TextSelection.create(engine.view.state.doc, 1, 5))
  );
  const beforeBlur = engine.view.state.doc;
  await engine.command({ method: 'blur' });
  assert.equal(engine.view.hasFocus(), false, 'dismissal blurs the actual DOM editor');
  assert.equal(engine.view.state.doc, beforeBlur, 'dismissal does not change the document');
  await engine.command({ method: 'format', action: 'bold' });
  assert.match(
    await engine.command({ method: 'getMarkdown' }),
    /\*\*Keep\*\* selection/,
    'toolbar selection survives dismissal'
  );
  engine.updatePlaceholder('Escreva aqui');
  assert.equal(engine.view.dom.getAttribute('aria-label'), 'Escreva aqui');
  console.log(
    'Real editor checks passed: compatibility, live formatting, history, lists/tasks/quotes, selection mapping, multiple images, paste/fallback, import failure, immediate save and localization.'
  );
} finally {
  await engine.destroy();
  dom.window.close();
}
