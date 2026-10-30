import { act, fireEvent, render } from '@testing-library/react-native';
import { Keyboard, Platform, Text } from 'react-native';

import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';

describe('ActionFooter', () => {
  it('renders its actions and forwards presses', async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await render(
      <ActionFooter>
        <Button accessibilityLabel="Save" text="Save" onPress={onPress} variant="primary" />
      </ActionFooter>
    );

    expect(getByText('Save')).toBeTruthy();
    await fireEvent.press(getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports icon-only and text-only actions', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <ActionFooter>
        <Button accessibilityLabel="Delete" icon={<Text>Icon</Text>} onPress={jest.fn()} />
        <Button accessibilityLabel="Cancel" text="Cancel" onPress={jest.fn()} />
      </ActionFooter>
    );

    expect(getByLabelText('Delete')).toBeTruthy();
    expect(getByText('Icon')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(queryByText('Delete')).toBeNull();
  });

  it('can float over scrollable content', async () => {
    const { toJSON } = await render(
      <ActionFooter overlay>
        <Button accessibilityLabel="Save" text="Save" onPress={jest.fn()} />
      </ActionFooter>
    );

    expect(toJSON()?.props.style).toMatchObject({ position: 'absolute', bottom: 0 });
  });
});

it.each([false, true])(
  'dismisses the active input with horizontalScroll=%s',
  async (horizontalScroll) => {
    const listeners = new Map<string, () => void>();
    const subscribe = Keyboard.addListener.bind(Keyboard);
    const addListener = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((event, listener) => {
        listeners.set(event, () => listener({} as Parameters<typeof listener>[0]));
        return subscribe(event, listener);
      });
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    const onDismissKeyboard = jest.fn();
    try {
      const view = await render(
        <ActionFooter horizontalScroll={horizontalScroll} onDismissKeyboard={onDismissKeyboard} />
      );
      await act(async () => {
        listeners.get(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow')?.();
      });
      await fireEvent.press(view.getByLabelText('Hide keyboard'));
      expect(onDismissKeyboard).toHaveBeenCalledTimes(1);
      expect(dismiss).not.toHaveBeenCalled();
      await view.rerender(<ActionFooter horizontalScroll={horizontalScroll} />);
      await fireEvent.press(view.getByLabelText('Hide keyboard'));
      expect(dismiss).toHaveBeenCalledTimes(1);
    } finally {
      addListener.mockRestore();
      dismiss.mockRestore();
    }
  }
);
