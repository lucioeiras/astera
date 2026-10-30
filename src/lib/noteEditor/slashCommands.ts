import type { NoteEditorIcon } from './slashIcons';
import type { NoteFormattingAction } from '@/components/modals/NoteRichTextInput.types';

export type SlashAction = NoteFormattingAction | 'image' | 'lyrics';
export type SlashCommand = { action: SlashAction; label: string; icon: NoteEditorIcon };

export function noteSlashCommands(label: (key: string) => string): SlashCommand[] {
  return [
    { action: 'paragraph', label: label('Text'), icon: 'pilcrow' },
    { action: 'heading-1', label: label('Heading 1'), icon: 'heading-1' },
    { action: 'heading-2', label: label('Heading 2'), icon: 'heading-2' },
    { action: 'heading-3', label: label('Heading 3'), icon: 'heading-3' },
    { action: 'bold', label: label('Bold'), icon: 'bold' },
    { action: 'italic', label: label('Italic'), icon: 'italic' },
    { action: 'bullet', label: label('Bullet list'), icon: 'list' },
    { action: 'numbered', label: label('Numbered list'), icon: 'list-ordered' },
    { action: 'todo', label: label('To-do list'), icon: 'list-checks' },
    { action: 'quote', label: label('Quote'), icon: 'quote' },
    { action: 'image', label: label('Insert image'), icon: 'image-plus' },
    { action: 'lyrics', label: label('Add song lyrics'), icon: 'eighth-note' },
  ];
}

// A slash inside a URL or path is ordinary text. Keep the query in one block.
export function slashQuery(text: string) {
  const match = /(?:^|\s)\/([^/\s]*)$/.exec(text);
  return match ? { query: match[1], offset: text.length - match[1].length - 1 } : null;
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function filterSlashCommands(commands: SlashCommand[], query: string) {
  return commands.filter((command) => normalize(command.label).includes(normalize(query)));
}
