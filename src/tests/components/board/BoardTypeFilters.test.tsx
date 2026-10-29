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
  const onSelectStatus = jest.fn();
  const onToggleArchived = jest.fn();
  const scrollOffsetRef = { current: 0 };
  const view = await render(
    <BoardTypeFilters
      selectedType="note"
      onSelect={onSelect}
      selectedStatus="want"
      onSelectStatus={onSelectStatus}
      showArchived={false}
      onToggleArchived={onToggleArchived}
      scrollOffsetRef={scrollOffsetRef}
    />
  );
  expect(view.getAllByRole('button')).toHaveLength(ITEM_TYPES.length + 4);
  const buttons = view.getAllByRole('button');
  expect(buttons.slice(0, 3).map((button) => button.props.accessibilityLabel)).toEqual([
    'Want to',
    'In progress',
    'Done',
  ]);
  expect(buttons[0].props.accessibilityState.selected).toBe(true);
  expect(view.getByText('Want to').props.className).toContain('font-sans-semibold');
  expect(view.getByText('In progress').props.className).toContain('font-sans-medium');
  expect(buttons[0].props.style.backgroundColor).toBe(palettes.dark.blueSoft);
  const note = view.getByRole('button', { name: 'Notes' });
  const book = view.getByRole('button', { name: 'Books' });
  expect(note.props.accessibilityState.selected).toBe(true);
  expect(book.props.accessibilityState.selected).toBe(false);
  expect(note.props.style.backgroundColor).toBe(palettes.dark.foreground);
  await fireEvent.press(book);
  expect(onSelect).toHaveBeenLastCalledWith('book');
  await fireEvent.press(note);
  expect(onSelect).toHaveBeenLastCalledWith('note');
  await fireEvent.press(view.getByRole('button', { name: 'Show archived cards' }));
  expect(onToggleArchived).toHaveBeenCalledTimes(1);
  await fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(onSelectStatus).toHaveBeenCalledWith('completed');
});

it('updates the accessible selection when the board changes or clears its filter', async () => {
  const onSelect = jest.fn();
  const onSelectStatus = jest.fn();
  const onToggleArchived = jest.fn();
  const scrollOffsetRef = { current: 0 };
  const view = await render(
    <BoardTypeFilters
      selectedType="note"
      onSelect={onSelect}
      selectedStatus={null}
      onSelectStatus={onSelectStatus}
      showArchived={false}
      onToggleArchived={onToggleArchived}
      scrollOffsetRef={scrollOffsetRef}
    />
  );
  await fireEvent.scroll(view.getByLabelText('Filter cards by type'), {
    nativeEvent: {
      contentOffset: { x: 428, y: 0 },
      contentSize: { width: 900, height: 48 },
      layoutMeasurement: { width: 400, height: 48 },
    },
  });
  expect(scrollOffsetRef.current).toBe(428);
  await view.rerender(
    <BoardTypeFilters
      selectedType="book"
      onSelect={onSelect}
      selectedStatus="completed"
      onSelectStatus={onSelectStatus}
      showArchived
      onToggleArchived={onToggleArchived}
      scrollOffsetRef={scrollOffsetRef}
    />
  );
  expect(view.getByRole('button', { name: 'Notes' }).props.accessibilityState.selected).toBe(false);
  expect(view.getByRole('button', { name: 'Books' }).props.accessibilityState.selected).toBe(true);
  await view.rerender(
    <BoardTypeFilters
      selectedType={null}
      onSelect={onSelect}
      selectedStatus={null}
      onSelectStatus={onSelectStatus}
      showArchived={false}
      onToggleArchived={onToggleArchived}
      scrollOffsetRef={scrollOffsetRef}
    />
  );
  expect(
    view.getAllByRole('button').every((button) => !button.props.accessibilityState.selected)
  ).toBe(true);
});
