import { fireEvent, render } from '@testing-library/react-native';
import { BookOpen } from 'lucide-react-native';
import { YoutubeLogoIcon } from 'phosphor-react-native';
import { TypeFilterButton } from '@/components/menus/TypeFilterButton';
import { palettes } from '@/lib/theme/palette';

jest.mock('lucide-react-native', () => ({
  BookOpen: (props: object) =>
    jest
      .requireActual('react')
      .createElement(jest.requireActual('react-native').View, { ...props, testID: 'book-icon' }),
}));
jest.mock('phosphor-react-native', () => ({
  YoutubeLogoIcon: (props: object) =>
    jest.requireActual('react').createElement(jest.requireActual('react-native').View, {
      ...props,
      testID: 'youtube-icon',
    }),
}));

let mockTheme: 'light' | 'dark' = 'dark';
jest.mock('@/lib/theme', () => ({
  useAppTheme: () => ({ colors: jest.requireActual('@/lib/theme/palette').palettes[mockTheme] }),
}));

it.each(['light', 'dark'] as const)(
  'preserves icon contrast and selection in %s mode',
  async (theme) => {
    mockTheme = theme;
    const onPress = jest.fn();
    const view = await render(
      <TypeFilterButton label="Books" icon={BookOpen} selected={false} onPress={onPress} />
    );
    expect(view.getByTestId('book-icon').props.color).toBe(palettes[theme].secondary);
    await fireEvent.press(view.getByLabelText('Books'));
    expect(onPress).toHaveBeenCalledTimes(1);

    await view.rerender(
      <TypeFilterButton label="Books" icon={BookOpen} selected onPress={onPress} />
    );
    expect(view.getByTestId('book-icon').props.color).toBe(palettes[theme].inverse);
    expect(view.getByLabelText('Books').props.accessibilityState.selected).toBe(true);
    expect(view.getByTestId('book-icon').props.weight).toBeUndefined();
    expect(view.getByTestId('book-icon').props.strokeWidth).toBe(2);
  }
);

it('keeps the platform logo at regular weight', async () => {
  const view = await render(
    <TypeFilterButton label="YouTube" icon={YoutubeLogoIcon} selected onPress={jest.fn()} />
  );
  expect(view.getByTestId('youtube-icon').props.weight).toBe('regular');
});
