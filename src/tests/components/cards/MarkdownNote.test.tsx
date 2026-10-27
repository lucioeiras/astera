import { palettes } from '@/lib/theme/palette';
import { fireEvent, render } from '@testing-library/react-native';

import { MarkdownNote } from '@/components/card/MarkdownNote';

describe('MarkdownNote', () => {
  it('renders headings, emphasis and list items', async () => {
    const { getByText } = await render(
      <MarkdownNote
        markdown={
          '# Heading\n\n**Bold** text\n\n- Item\n\n1. First\n2) Second\n\n- [ ] Unfinished task\n- [x] Finished task'
        }
      />
    );

    expect(getByText('Heading')).toBeTruthy();
    expect(getByText('Bold')).toBeTruthy();
    expect(getByText('• Item')).toBeTruthy();
    expect(getByText('1. First')).toBeTruthy();
    expect(getByText('2. Second')).toBeTruthy();
    expect(getByText('Unfinished task')).toBeTruthy();
    expect(getByText('Finished task')).toBeTruthy();
  });

  it('toggles a task and preserves the Markdown source', async () => {
    const onMarkdownChange = jest.fn();
    const markdown = '## Tasks\n\n- [ ] Plan the next release';
    const { getByLabelText } = await render(
      <MarkdownNote markdown={markdown} onMarkdownChange={onMarkdownChange} />
    );

    await fireEvent.press(getByLabelText('Mark task complete'));
    expect(onMarkdownChange).toHaveBeenCalledWith('## Tasks\n\n- [x] Plan the next release');
  });

  it('renders and toggles the live-editor checkbox format', async () => {
    const onMarkdownChange = jest.fn();
    const { getByLabelText, getByText } = await render(
      <MarkdownNote markdown="☐ Buy milk" onMarkdownChange={onMarkdownChange} />
    );

    expect(getByText('Buy milk')).toBeTruthy();
    await fireEvent.press(getByLabelText('Mark task complete'));
    expect(onMarkdownChange).toHaveBeenCalledWith('☑ Buy milk');
  });

  it('strikes completed tasks and shows them in a softer gray', async () => {
    const { getByTestId } = await render(
      <MarkdownNote markdown={'- [ ] Pending\n- [x] Complete'} />
    );

    expect(getByTestId('markdown-task-text-0').props.style).toMatchObject({
      color: palettes.dark.foreground,
      textDecorationLine: 'none',
    });
    expect(getByTestId('markdown-task-text-1').props.style).toMatchObject({
      color: palettes.dark.secondary,
      textDecorationLine: 'line-through',
    });
  });

  it('uses descending sizes and explicit font weights for heading levels', async () => {
    const { getByTestId } = await render(
      <MarkdownNote markdown={'# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6'} />
    );

    const sizes = [1, 2, 3, 4, 5, 6].map((level) =>
      Number(getByTestId(`markdown-heading-${level}`).props.style.fontSize)
    );
    const lineHeights = [1, 2, 3, 4, 5, 6].map((level) =>
      Number(getByTestId(`markdown-heading-${level}`).props.style.lineHeight)
    );
    const weights = [1, 2, 3, 4, 5, 6].map(
      (level) => getByTestId(`markdown-heading-${level}`).props.style.fontFamily
    );
    expect(sizes).toEqual([34, 29, 25, 22, 20, 18]);
    expect(lineHeights).toEqual([64, 48, 40, 36, 30, 28]);
    expect(weights).toEqual([
      'InstrumentSans_700Bold',
      'InstrumentSans_700Bold',
      'InstrumentSans_600SemiBold',
      'InstrumentSans_600SemiBold',
      'InstrumentSans_500Medium',
      'InstrumentSans_500Medium',
    ]);
  });

  it('uses a smaller body font with a more open line height', async () => {
    const { getByTestId } = await render(<MarkdownNote markdown="Body text" />);

    expect(getByTestId('markdown-body-text').props.style).toMatchObject({
      fontSize: 18,
      lineHeight: 32,
    });
  });

  it('opens the editor when tapped', async () => {
    const onEdit = jest.fn();
    const { getByRole } = await render(<MarkdownNote markdown="Text" onEdit={onEdit} />);

    fireEvent.press(getByRole('button'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
