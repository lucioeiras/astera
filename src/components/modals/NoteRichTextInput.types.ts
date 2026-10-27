import type { NoteLineType, TextSelection } from '@/lib/noteFormatting';

export type NoteFormattingAction = 'bold' | 'italic' | NoteLineType;

export type NoteCaretRect = { y: number; height: number };

export type NoteRichTextInputHandle = {
  focus: () => void;
  getMarkdown: () => Promise<string>;
  setSelection: (start: number, end: number) => void;
  setMarkdown: (markdown: string) => void;
  format: (action: NoteFormattingAction, selection?: TextSelection) => void;
};

export type NoteRichTextInputProps = {
  value: string;
  onChangeMarkdown: (markdown: string) => void;
  onSelectionChange?: (selection: TextSelection) => void;
  onCaretRectChange?: (rect: NoteCaretRect) => void;
  placeholder: string;
  placeholderTextColor: string;
};
