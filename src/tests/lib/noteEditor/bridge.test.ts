import { NoteEditorBridge } from '@/lib/noteEditor/bridge';
import { NoteEditorSession } from '@/lib/noteEditor/session';

it('waits for initialization and serializes commands until their acknowledgements', async () => {
  const bridge = new NoteEditorBridge();
  const send = jest.fn();
  const focus = bridge.request({ method: 'focus' });
  const read = bridge.request({ method: 'getMarkdown' });
  expect(send).not.toHaveBeenCalled();
  bridge.connect(send);
  expect(send).toHaveBeenCalledTimes(1);
  bridge.receive({ id: 999, value: 'stale' });
  expect(send).toHaveBeenCalledTimes(1);
  bridge.receive({ id: send.mock.calls[0][0].id });
  await expect(focus).resolves.toBe('');
  expect(send).toHaveBeenCalledTimes(2);
  bridge.receive({ id: send.mock.calls[1][0].id, value: '**latest**' });
  await expect(read).resolves.toBe('**latest**');
});
it('rejects failed operations and allows the next command', async () => {
  const bridge = new NoteEditorBridge();
  const send = jest.fn();
  bridge.connect(send);
  const read = bridge.request({ method: 'getMarkdown' });
  const rejected = expect(read).rejects.toThrow('import failed');
  bridge.receive({ id: send.mock.calls[0][0].id, error: 'import failed' });
  await rejected;
  const retry = bridge.request({ method: 'getMarkdown' });
  bridge.receive({ id: send.mock.calls[1][0].id, value: 'retained' });
  await expect(retry).resolves.toBe('retained');
});
it('rejects pending work on reload and ignores replies from the old document', async () => {
  const bridge = new NoteEditorBridge();
  const send = jest.fn();
  bridge.connect(send);
  const read = bridge.request({ method: 'getMarkdown' });
  const rejected = expect(read).rejects.toThrow('reloaded');
  bridge.disconnect();
  await rejected;
  bridge.connect(send);
  const next = bridge.request({ method: 'getMarkdown' });
  bridge.receive({ id: send.mock.calls[0][0].id, value: 'old' });
  bridge.receive({ id: send.mock.calls[1][0].id, value: 'recovered' });
  await expect(next).resolves.toBe('recovered');
});
it('times out an unavailable editor without saving a stale snapshot', async () => {
  jest.useFakeTimers();
  try {
    const bridge = new NoteEditorBridge(100);
    const read = bridge.request({ method: 'getMarkdown' });
    const rejected = expect(read).rejects.toThrow('did not respond');
    jest.advanceTimersByTime(101);
    await rejected;
  } finally {
    jest.useRealTimers();
  }
});
it('keeps exact source on open and selection-only changes, then emits actual edits', () => {
  const session = new NoteEditorSession('- item', '* item\n');
  expect(session.change('* item\n')).toBeUndefined();
  expect(session.markdown).toBe('- item');
  expect(session.change('* edited\n')).toBe('* edited\n');
  expect(session.markdown).toBe('* edited\n');
  session.replace('# external', '# external\n');
  expect(session.markdown).toBe('# external');
});
