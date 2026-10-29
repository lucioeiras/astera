/** Keep the original source until a document edit occurs. Parser/serializer
 * normalization must not rewrite a note merely because it was opened. */
export class NoteEditorSession {
  private original: string;
  private normalized: string;
  private edited = false;

  constructor(source: string, normalized: string) {
    this.original = source;
    this.normalized = normalized;
  }
  change(normalized: string): string | undefined {
    if (normalized === this.normalized) return;
    this.edited = true;
    this.normalized = normalized;
    return normalized;
  }
  get markdown() {
    return this.edited ? this.normalized : this.original;
  }
  replace(source: string, normalized: string) {
    this.original = source;
    this.normalized = normalized;
    this.edited = false;
  }
}
