import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActivityCalendar } from '@/components/profile/ActivityCalendar';
import { CompletionChart } from '@/components/profile/CompletionChart';
import { ProfileSelect } from '@/components/profile/ProfileSelect';
import { setActiveLanguage } from '@/lib/i18n/locale';

jest.mock('@/components/Button', () => ({
  Button: ({
    accessibilityLabel,
    onPress,
  }: {
    accessibilityLabel: string;
    onPress: () => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress}>
        <Text>{accessibilityLabel}</Text>
      </Pressable>
    );
  },
}));
it('announces day counts, opens a day, and navigates months across a year', async () => {
  const onPressDate = jest.fn(),
    onChangeMonth = jest.fn();
  await render(
    <ActivityCalendar
      month={new Date(2026, 0, 1)}
      byDay={{ '2026-01-01': 2 }}
      onPressDate={onPressDate}
      onChangeMonth={onChangeMonth}
    />
  );
  await fireEvent.press(screen.getByLabelText(/January 1, 2026, 2 cards added/));
  expect(onPressDate).toHaveBeenCalledWith('2026-01-01');
  await fireEvent.press(screen.getByLabelText('Previous month'));
  expect(onChangeMonth).toHaveBeenCalledWith(new Date(2025, 11, 1));
});
it('starts the Portuguese added-cards calendar on Monday with Portuguese weekday initials', async () => {
  setActiveLanguage('pt');
  const { unmount } = await render(
    <ActivityCalendar
      month={new Date(2026, 0, 1)}
      byDay={{}}
      onPressDate={jest.fn()}
      onChangeMonth={jest.fn()}
    />
  );
  expect(screen.getAllByText(/^[STQD]$/).map((element) => element.props.children)).toEqual([
    'S',
    'T',
    'Q',
    'Q',
    'S',
    'S',
    'D',
  ]);
  unmount();
  setActiveLanguage('en');
});
it('shows all twelve accessible counts and an empty state', async () => {
  await render(<CompletionChart months={Array.from({ length: 12 }, () => [])} year={2026} />);
  expect(screen.getByLabelText('January 2026: 0 cards completed')).toBeTruthy();
  expect(screen.getByLabelText('December 2026: 0 cards completed')).toBeTruthy();
  expect(screen.getByText('No completions recorded for this selection.')).toBeTruthy();
});
it('opens a select, switches its value, and closes the options', async () => {
  const onSelect = jest.fn();
  await render(
    <ProfileSelect
      label="Year"
      value="2026"
      options={[
        { value: '2026', label: '2026' },
        { value: '2025', label: '2025' },
      ]}
      onSelect={onSelect}
    />
  );
  await fireEvent.press(screen.getByLabelText('Year: 2026'));
  expect(screen.getByTestId('year-dropdown')).toBeTruthy();
  expect(screen.getByLabelText('2026').props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByLabelText('2025'));
  expect(onSelect).toHaveBeenCalledWith('2025');
  expect(screen.queryByTestId('year-dropdown')).toBeNull();
  expect(screen.getByLabelText('Year: 2026').props.accessibilityState.expanded).toBe(false);
  await fireEvent.press(screen.getByLabelText('Year: 2026'));
  await fireEvent.press(screen.getByLabelText('Year: 2026'));
  expect(screen.queryByTestId('year-dropdown')).toBeNull();
});

it('uses progressively lighter blue backgrounds for days with more additions', async () => {
  await render(
    <ActivityCalendar
      month={new Date(2026, 0, 1)}
      byDay={{
        '2026-01-01': 1,
        '2026-01-02': 5,
        '2026-01-03': 10,
        '2026-01-04': 30,
      }}
      onChangeMonth={jest.fn()}
      onPressDate={jest.fn()}
    />
  );
  const color = (day: string) =>
    screen.getByTestId(`activity-day-${day}`).props.style.backgroundColor;
  expect(color('2026-01-05')).toBe('#18181b');
  expect(color('2026-01-01')).toBe('rgb(30, 58, 138)');
  const dark = color('2026-01-01').match(/\d+/g).map(Number);
  const medium = color('2026-01-02').match(/\d+/g).map(Number);
  const light = color('2026-01-03').match(/\d+/g).map(Number);
  for (let channel = 0; channel < 3; channel++) {
    expect(medium[channel]).toBeGreaterThan(dark[channel]);
    expect(light[channel]).toBeGreaterThan(medium[channel]);
  }
  expect(color('2026-01-04')).toBe(color('2026-01-03'));
  expect(screen.getByLabelText(/January 3, 2026, 10 cards added/)).toBeTruthy();
  expect(screen.getByTestId('activity-day-count-2026-01-01').props.children).toBe(1);
  expect(screen.getByTestId('activity-day-count-2026-01-03').props.children).toBe(10);
  expect(screen.queryByTestId('activity-day-count-2026-01-05')).toBeNull();
});
