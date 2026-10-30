import type { NoteFormattingAction } from '@/components/modals/NoteRichTextInput.types';

export type EditorCommand =
  | { method: 'focus'; start?: boolean }
  | { method: 'blur' }
  | { method: 'getMarkdown' }
  | { method: 'setMarkdown'; markdown: string }
  | { method: 'captureSelection' }
  | { method: 'insertImage'; uri: string }
  | { method: 'format'; action: NoteFormattingAction };
export type EditorRequest = { id: number; command: EditorCommand };
export type EditorResult = { id: number; value?: string; error?: string };

/** Expo DOM imperative refs are fire-and-forget. Correlate replies instead of
 * treating an injected JavaScript call as an awaited result. */
export class NoteEditorBridge {
  private nextId = 0;
  private sender: ((request: EditorRequest) => void) | null = null;
  private requests: {
    request: EditorRequest;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }[] = [];

  constructor(
    private timeoutMs = 30000,
    private onTimeout?: () => void
  ) {}

  connect(sender: (request: EditorRequest) => void) {
    this.sender = sender;
    if (this.requests[0]) sender(this.requests[0].request);
  }

  request(command: EditorCommand): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = { id: ++this.nextId, command };
      const timer = setTimeout(() => {
        this.disconnect('Editor did not respond. Please try again.');
        this.onTimeout?.();
      }, this.timeoutMs);
      this.requests.push({ request, resolve, reject, timer });
      if (this.requests.length === 1) this.sender?.(request);
    });
  }

  receive(result: EditorResult) {
    const current = this.requests[0];
    if (!current || current.request.id !== result.id) return;
    this.requests.shift();
    clearTimeout(current.timer);
    if (result.error) current.reject(new Error(result.error));
    else current.resolve(result.value ?? '');
    if (this.requests[0]) this.sender?.(this.requests[0].request);
  }

  disconnect(message = 'Editor was reloaded. Please try again.') {
    this.sender = null;
    for (const current of this.requests.splice(0)) {
      clearTimeout(current.timer);
      current.reject(new Error(message));
    }
  }
}
