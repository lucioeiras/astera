import { fireEvent, render } from '@testing-library/react-native';

import { NoteCard } from '@/components/cards/NoteCard';

describe('NoteCard', () => {
  it('removes bottom padding only while the measured text exceeds the maximum height', async () => {
    const { getByTestId } = await render(<NoteCard text="Note text" />);
    const container = getByTestId('note-card-text-container');
    const measurement = getByTestId('note-card-text-measurement');

    expect(container).toHaveStyle({ paddingBottom: 20 });

    for (const [height, paddingBottom] of [
      [100, 20],
      [312, 20],
      [313, 0],
      [600, 0],
      [150, 20],
    ]) {
      await fireEvent(measurement, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 200, height } },
      });
      expect(container).toHaveStyle({ paddingBottom });
    }
  });

  it.each(['Short note', Array(30).fill('A longer paragraph that wraps.').join('\n\n')])(
    'limits only the viewport height without truncating or compressing the Markdown',
    async (text) => {
      const { getByTestId, getAllByTestId } = await render(<NoteCard text={text} />);

      expect(getByTestId('note-card-text-viewport')).toHaveStyle({
        maxHeight: 312,
        overflow: 'hidden',
      });
      const content = getByTestId('markdown-note-content');
      expect(content).toHaveStyle({ flexShrink: 0 });
      expect(content.props.style.maxHeight).toBeUndefined();
      expect(content.props.style.height).toBeUndefined();
      for (const paragraph of getAllByTestId('markdown-body-text')) {
        expect(paragraph.props.numberOfLines).toBeUndefined();
      }
    }
  );

  it('renders Markdown instead of showing the source syntax', async () => {
    const { getByText, queryByRole, queryByText } = await render(
      <NoteCard text={'## Section\n\n**Important** detail'} />
    );

    expect(getByText('Section')).toBeTruthy();
    expect(getByText('Important')).toBeTruthy();
    expect(queryByText('## Section')).toBeNull();
    expect(queryByRole('button')).toBeNull();
  });
});
