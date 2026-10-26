import { fireEvent, render } from '@testing-library/react-native';

import { BoardTypeFilters } from '@/components/board/BoardTypeFilters';
import { ITEM_TYPES } from '@/lib/library/types';
import { palettes } from '@/lib/theme/palette';
import { setActiveLanguage } from '@/lib/i18n/locale';

beforeEach(() => {
  setActiveLanguage('en');
});

it('shows all types and reports presses on both selected and unselected filters', async () => {
  const onSelect = jest.fn();
  const view = await render(<BoardTypeFilters selectedType="note" onSelect={onSelect} />);
  expect(view.getAllByRole('button')).toHaveLength(ITEM_TYPES.length);
  const note = view.getByRole('button', { name: 'Notes' });
  const book = view.getByRole('button', { name: 'Books' });
  expect(note.props.accessibilityState.selected).toBe(true);
  expect(book.props.accessibilityState.selected).toBe(false);
  expect(note.props.style.backgroundColor).toBe(palettes.dark.foreground);
  await fireEvent.press(book);
  expect(onSelect).toHaveBeenLastCalledWith('book');
  await fireEvent.press(note);
  expect(onSelect).toHaveBeenLastCalledWith('note');
});

it('updates the accessible selection when the board changes or clears its filter', async () => {
  const onSelect = jest.fn();
  const view = await render(<BoardTypeFilters selectedType="note" onSelect={onSelect} />);
  await view.rerender(<BoardTypeFilters selectedType="book" onSelect={onSelect} />);
  expect(view.getByRole('button', { name: 'Notes' }).props.accessibilityState.selected).toBe(false);
  expect(view.getByRole('button', { name: 'Books' }).props.accessibilityState.selected).toBe(true);
  await view.rerender(<BoardTypeFilters selectedType={null} onSelect={onSelect} />);
  expect(
    view.getAllByRole('button').every((button) => !button.props.accessibilityState.selected)
  ).toBe(true);
});
