import { fireEvent, render } from '@testing-library/react-native';

import { CardActions } from '@/components/card/CardActions';
import { ITEM_TYPES, type LibraryItem } from '@/lib/library/types';

const base = {
  version: 1 as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const makeActions = () => ({
  onDelete: jest.fn(),
  onAddToFolder: jest.fn(),
  onManageRelatedCards: jest.fn(),
  onAddSource: jest.fn(),
  onDownload: jest.fn(),
  onCopy: jest.fn(),
  onShare: jest.fn(),
  onOpenLink: jest.fn(),
  onOpenPdf: jest.fn(),
  onEditNote: jest.fn(),
  onTranscribeAudio: jest.fn(),
});

describe('CardActions', () => {
  it.each(ITEM_TYPES)('offers related cards for %s', async (type) => {
    const actions = makeActions();
    const item = { ...base, id: type, type } as LibraryItem;
    const screen = await render(<CardActions item={item} {...actions} />);
    await fireEvent.press(screen.getByLabelText('Manage related cards'));
    expect(actions.onManageRelatedCards).toHaveBeenCalledTimes(1);
  });

  it('shows common and text-card actions', async () => {
    const actions = makeActions();
    const item: LibraryItem = { ...base, id: 'note', type: 'note', text: 'Body' };
    const { getByLabelText, queryByLabelText } = await render(
      <CardActions item={item} {...actions} />
    );

    await fireEvent.press(getByLabelText('Manage related cards'));
    expect(actions.onManageRelatedCards).toHaveBeenCalledTimes(1);
    expect(getByLabelText('Delete')).toBeTruthy();
    expect(getByLabelText('Add to folder')).toBeTruthy();
    expect(getByLabelText('Copy')).toBeTruthy();
    expect(getByLabelText('Edit note')).toBeTruthy();
    expect(queryByLabelText('Share')).toBeNull();
    expect(queryByLabelText('Open link')).toBeNull();
    await fireEvent.press(getByLabelText('Copy'));
    expect(actions.onCopy).toHaveBeenCalledTimes(1);
    await fireEvent.press(getByLabelText('Edit note'));
    expect(actions.onEditNote).toHaveBeenCalledTimes(1);
  });

  it('shows Log reading as the final primary action when enabled', async () => {
    const actions = makeActions();
    const onLogReading = jest.fn();
    const item: LibraryItem = {
      ...base,
      id: 'book',
      type: 'book',
      title: 'Book',
      isbn: '',
      authors: [],
    };
    const { getByLabelText, queryByLabelText, queryByText } = await render(
      <CardActions item={item} {...actions} showLogReading onLogReading={onLogReading} />
    );

    const logButton = getByLabelText('Log reading');
    expect(logButton.props.accessibilityState?.disabled).toBeFalsy();
    expect(queryByText('Log reading')).toBeNull();
    expect(queryByLabelText('Copy')).toBeNull();
    await fireEvent.press(logButton);
    expect(onLogReading).toHaveBeenCalledTimes(1);
    expect(queryByLabelText('Log reading')).toBeTruthy();
  });

  it('hides Log reading when disabled', async () => {
    const actions = makeActions();
    const item: LibraryItem = {
      ...base,
      id: 'book',
      type: 'book',
      title: 'Book',
      isbn: '',
      authors: [],
    };
    const { queryByLabelText } = await render(
      <CardActions item={item} {...actions} onLogReading={jest.fn()} />
    );

    expect(queryByLabelText('Log reading')).toBeNull();
  });

  it('adds download action for image cards', async () => {
    const actions = makeActions();
    const item: LibraryItem = { ...base, id: 'image', type: 'image', image: 'image.jpg' };
    const { getByLabelText } = await render(<CardActions item={item} {...actions} />);

    await fireEvent.press(getByLabelText('Download image'));
    await fireEvent.press(getByLabelText('Share'));
    expect(actions.onDownload).toHaveBeenCalledTimes(1);
    expect(actions.onShare).toHaveBeenCalledTimes(1);
  });

  it('shows PDF actions and opens the PDF', async () => {
    const actions = makeActions();
    const item: LibraryItem = { ...base, id: 'pdf', type: 'pdf', pdf: 'document.pdf' };
    const { getByLabelText } = await render(<CardActions item={item} {...actions} />);

    await fireEvent.press(getByLabelText('Open PDF'));
    expect(getByLabelText('Copy')).toBeTruthy();
    expect(getByLabelText('Share')).toBeTruthy();
    expect(actions.onOpenPdf).toHaveBeenCalledTimes(1);
  });

  it('shows share and open-link actions for linked cards', async () => {
    const actions = makeActions();
    const item: LibraryItem = {
      ...base,
      id: 'link',
      type: 'link',
      url: 'https://example.com',
      siteTitle: 'Example',
      description: '',
      favicon: '',
    };
    const { getByLabelText, queryByLabelText } = await render(
      <CardActions item={item} {...actions} />
    );

    await fireEvent.press(getByLabelText('Open link'));
    expect(actions.onOpenLink).toHaveBeenCalledTimes(1);
    expect(getByLabelText('Share')).toBeTruthy();
    expect(queryByLabelText('Copy')).toBeNull();
  });

  it('shows a manual transcription action for audio without a transcript', async () => {
    const actions = makeActions();
    const item: LibraryItem = { ...base, id: 'audio', type: 'audio', audio: 'audio.m4a' };
    const { getByLabelText, queryByLabelText } = await render(
      <CardActions item={item} {...actions} />
    );

    await fireEvent.press(getByLabelText('Transcribe audio'));
    expect(actions.onTranscribeAudio).toHaveBeenCalledTimes(1);

    const transcribedItem: LibraryItem = { ...item, transcript: 'A saved transcript' };
    const withTranscript = await render(<CardActions item={transcribedItem} {...actions} />);
    expect(withTranscript.queryByLabelText('Transcribe audio')).toBeNull();
    expect(queryByLabelText('Transcribe audio')).toBeTruthy();
  });
});

it('shows the primary play log action only when enabled', async () => {
  const item: LibraryItem = { ...base, id: 'game', type: 'game', title: 'Game', cover: '' };
  const onLogPlay = jest.fn();
  const view = await render(
    <CardActions item={item} {...makeActions()} showLogPlay onLogPlay={onLogPlay} />
  );
  await fireEvent.press(view.getByLabelText('Log play'));
  expect(onLogPlay).toHaveBeenCalledTimes(1);
  await view.rerender(<CardActions item={item} {...makeActions()} onLogPlay={onLogPlay} />);
  expect(view.queryByLabelText('Log play')).toBeNull();
});

it.each([undefined, 'want', 'in-progress', 'completed', 'abandoned'] as const)(
  'hides Copy for games with status %s while preserving Share',
  async (progressStatus) => {
    const actions = makeActions();
    const item: LibraryItem = {
      ...base,
      id: 'game',
      type: 'game',
      title: 'Game',
      cover: '',
      progressStatus,
    };
    const view = await render(<CardActions item={item} {...actions} />);
    expect(view.queryByLabelText('Copy')).toBeNull();
    await fireEvent.press(view.getByLabelText('Share'));
    expect(actions.onShare).toHaveBeenCalledTimes(1);
  }
);
