import { filterSlashCommands, noteSlashCommands, slashQuery } from '@/lib/noteEditor/slashCommands';

describe('note slash commands', () => {
  it('detects a slash at the start or after whitespace and retains its range', () => {
    expect(slashQuery('/')).toEqual({ query: '', offset: 0 });
    expect(slashQuery('Note /titulo')).toEqual({ query: 'titulo', offset: 5 });
    expect(slashQuery('Note /')).toEqual({ query: '', offset: 5 });
  });

  it.each(['https://example.com/', 'images/photo', '//', '/two words', 'text', '/done '])(
    'does not treat %s as a command',
    (text) => expect(slashQuery(text)).toBeNull()
  );

  it('filters localized labels without requiring accents or case', () => {
    const commands = noteSlashCommands((key) => (key === 'Heading 1' ? 'Título 1' : key));
    expect(filterSlashCommands(commands, 'TITULO')).toEqual([
      { action: 'heading-1', label: 'Título 1', icon: 'heading-1' },
    ]);
    expect(filterSlashCommands(commands, '')).toEqual(commands);
    expect(filterSlashCommands(commands, 'unknown')).toEqual([]);
    expect(commands.map(({ action }) => action)).toEqual([
      'paragraph',
      'heading-1',
      'heading-2',
      'heading-3',
      'bold',
      'italic',
      'bullet',
      'numbered',
      'todo',
      'quote',
      'image',
      'lyrics',
    ]);
  });
});
