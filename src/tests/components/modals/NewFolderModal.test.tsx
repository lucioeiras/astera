import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { NewFolderModal } from '@/components/modals/NewFolderModal';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('NewFolderModal', () => {
  it('requires a non-empty name and trims it before creating', async () => {
    const onCreate = jest.fn().mockResolvedValue(true);
    const onClose = jest.fn();
    const view = await render(<NewFolderModal visible onClose={onClose} onCreate={onCreate} />);

    const create = view.getByLabelText('Create folder');
    expect(create.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(view.getByLabelText('Folder name'), '  Reads  ');
    expect(view.getByLabelText('Create folder').props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(view.getByLabelText('Create folder'));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Reads'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the form open when creation is rejected and resets it on cancel', async () => {
    const onCreate = jest.fn().mockResolvedValue(false);
    const onClose = jest.fn();
    const view = await render(<NewFolderModal visible onClose={onClose} onCreate={onCreate} />);
    await fireEvent.changeText(view.getByLabelText('Folder name'), 'Already exists');
    await fireEvent.press(view.getByLabelText('Create folder'));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();

    await fireEvent.press(view.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
