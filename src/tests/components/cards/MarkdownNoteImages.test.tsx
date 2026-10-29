import { fireEvent, render } from '@testing-library/react-native';
import { MarkdownNote } from '@/components/card/MarkdownNote';
import { LibraryAssetContext } from '@/lib/library/assetContext';

it('renders attachments relative to the current library alongside surrounding text', async () => {
  const view = await render(
    <LibraryAssetContext.Provider value="file:///chosen/library/">
      <MarkdownNote markdown={'Before ![Photo](images/photo.png) after'} />
    </LibraryAssetContext.Provider>
  );
  expect(view.getByLabelText('Photo').props.source).toEqual({
    uri: 'file:///chosen/library/images/photo.png',
  });
  expect(view.getByText('Before ')).toBeTruthy();
  expect(view.getByText(' after')).toBeTruthy();
});
it('renders remote images with compact dimensions', async () => {
  const view = await render(
    <MarkdownNote markdown="![Cover](https://example.com/cover.png)" compact />
  );
  expect(view.getByLabelText('Cover').props.source).toEqual({
    uri: 'https://example.com/cover.png',
  });
  expect(view.getByLabelText('Cover')).toHaveStyle({ height: 160 });
});
it('does not render paths escaping the library or unsupported schemes', async () => {
  const view = await render(
    <MarkdownNote
      markdown={'![Private](images/../../private.png)\n![Unsafe](file:///private.png)'}
    />
  );
  expect(view.queryByLabelText('Private')).toBeNull();
  expect(view.queryByLabelText('Unsafe')).toBeNull();
  expect(view.getByText('Private')).toBeTruthy();
});

it('shows the image description when the file cannot be loaded', async () => {
  const view = await render(
    <MarkdownNote markdown="![Missing photo](https://example.com/missing.png)" />
  );
  await fireEvent(view.getByLabelText('Missing photo'), 'error');
  expect(view.getByText('Missing photo')).toBeTruthy();
});

it('preserves heading typography beside an inline image and accepts image titles', async () => {
  const view = await render(
    <MarkdownNote
      markdown={'# Heading ![Cover](https://example.com/cover.png "Caption")'}
      compact
    />
  );
  expect(view.getByTestId('markdown-heading-1')).toHaveTextContent('Heading');
  expect(view.queryByText('# Heading ')).toBeNull();
  expect(view.getByLabelText('Cover')).toBeTruthy();
});
it('keeps task toggles connected to the full Markdown around images', async () => {
  const onChange = jest.fn();
  const markdown = '- [ ] Task ![Photo](https://example.com/photo.png) suffix';
  const view = await render(<MarkdownNote markdown={markdown} onMarkdownChange={onChange} />);
  await fireEvent.press(view.getByLabelText('Mark task complete'));
  expect(onChange).toHaveBeenCalledWith(markdown.replace('[ ]', '[x]'));
});
