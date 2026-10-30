import type { NoteLineType } from '@/lib/noteFormatting';
import type { PickedImageAsset } from '@/lib/library/storage';

export type NoteFormattingAction = 'bold' | 'italic' | NoteLineType;

export type NoteRichTextInputHandle = {
  focus: (start?: boolean) => Promise<void>;
  blur: () => Promise<void>;
  getMarkdown: () => Promise<string>;
  setMarkdown: (markdown: string) => Promise<void>;
  captureSelection: () => Promise<void>;
  insertImage: (uri: string) => Promise<void>;
  format: (action: NoteFormattingAction) => Promise<void>;
};

export type NoteRichTextInputProps = {
  value: string;
  onChangeMarkdown: (markdown: string) => void;
  onImportImage: (asset: PickedImageAsset) => Promise<string>;
  placeholder: string;
  placeholderTextColor: string;
  onInsert?: (action: 'image' | 'lyrics') => Promise<void>;
  onReady?: () => void;
  onError?: () => void;
};
