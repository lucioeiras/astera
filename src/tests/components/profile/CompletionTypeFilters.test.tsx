import { fireEvent, render, screen } from '@testing-library/react-native';
import { CompletionTypeFilters } from '@/components/profile/CompletionTypeFilters';

it('shows inline filters in a horizontal scroll with no type selected initially', async () => {
  await render(<CompletionTypeFilters selectedType={null} onSelect={jest.fn()} />);
  expect(screen.getByLabelText('Filter completed cards by type').props.horizontal).toBe(true);
  expect(screen.queryByLabelText('All types')).toBeNull();
  for (const label of ['Books', 'Movies', 'Games', 'Articles', 'YouTube']) {
    expect(screen.getByLabelText(label).props.accessibilityState.selected).toBe(false);
    expect(screen.getByLabelText(label).props.variant).toBe('secondary');
  }
});
it('selects a type and clears it by tapping the selected type again', async () => {
  const onSelect = jest.fn();
  const view = await render(<CompletionTypeFilters selectedType={null} onSelect={onSelect} />);
  await fireEvent.press(screen.getByLabelText('Books'));
  expect(onSelect).toHaveBeenLastCalledWith('book');
  await view.rerender(<CompletionTypeFilters selectedType="book" onSelect={onSelect} />);
  expect(screen.getByLabelText('Books').props.accessibilityState.selected).toBe(true);
  expect(screen.getByLabelText('Books').props.variant).toBe('primary');
  await fireEvent.press(screen.getByLabelText('Books'));
  expect(onSelect).toHaveBeenLastCalledWith(null);
  await fireEvent.press(screen.getByLabelText('YouTube'));
  expect(onSelect).toHaveBeenLastCalledWith('youtube');
});
