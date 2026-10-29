import { fireEvent, render } from '@testing-library/react-native';

import { CardSelectionBar } from '@/components/menus/CardSelectionBar';

describe('CardSelectionBar', () => {
  const callbacks = () => ({
    onDelete: jest.fn(),
    onAddToFolder: jest.fn(),
    onTogglePin: jest.fn(),
    onCancel: jest.fn(),
  });

  it('does not render while hidden', async () => {
    const { toJSON } = await render(
      <CardSelectionBar visible={false} selectedCount={0} {...callbacks()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('shows the empty selection prompt and disables selection actions', async () => {
    const { getByText, getByLabelText } = await render(
      <CardSelectionBar visible selectedCount={0} {...callbacks()} />
    );

    expect(getByText('Select cards')).toBeTruthy();
    expect(getByLabelText('Add selected cards to folder')).toBeDisabled();
    expect(getByLabelText('Delete selected cards')).toBeDisabled();
  });

  it('reports the selected count and calls each action', async () => {
    const handlers = callbacks();
    const { getByText, getByLabelText } = await render(
      <CardSelectionBar
        visible
        selectedCount={3}
        pinActionLabel="Pin selected cards"
        {...handlers}
      />
    );

    expect(getByText('3')).toBeTruthy();
    await fireEvent.press(getByLabelText('Cancel selection'));
    await fireEvent.press(getByLabelText('Add selected cards to folder'));
    await fireEvent.press(getByLabelText('Pin selected cards'));
    await fireEvent.press(getByLabelText('Delete selected cards'));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
    expect(handlers.onAddToFolder).toHaveBeenCalledTimes(1);
    expect(handlers.onTogglePin).toHaveBeenCalledTimes(1);
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('offers archive and restore actions when supplied', async () => {
    const onToggleArchive = jest.fn();
    const { getByLabelText } = await render(
      <CardSelectionBar
        visible
        selectedCount={2}
        archiveActionLabel="Archive selected cards"
        onToggleArchive={onToggleArchive}
        {...callbacks()}
      />
    );
    await fireEvent.press(getByLabelText('Archive selected cards'));
    expect(onToggleArchive).toHaveBeenCalledTimes(1);
  });
});
