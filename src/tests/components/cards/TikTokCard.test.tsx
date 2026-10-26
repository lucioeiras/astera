import { render } from '@testing-library/react-native';
import { TikTokCard } from '@/components/cards/TikTokCard';

let mockIsDark = false;
jest.mock('@/lib/theme', () => ({ useAppTheme: () => ({ isDark: mockIsDark }) }));

it.each<[boolean, number | undefined]>([
  [false, undefined],
  [true, undefined],
  [false, 100],
  [true, 100],
])('uses cyan in dark mode %s with compact height %s', async (isDark, compactHeight) => {
  mockIsDark = isDark;
  const view = await render(
    <TikTokCard videoTitle="A video" thumbnail="thumbnail.jpg" compactHeight={compactHeight} />
  );
  const titleContainer = view.getByTestId(
    compactHeight === undefined ? 'tiktok-title-container' : 'pinned-title-container'
  );
  expect(titleContainer.props.className).toContain('bg-cyan-500/10');
  if (compactHeight === undefined) {
    expect(view.getByTestId('tiktok-brand-label').props.className).toContain(
      isDark ? 'text-cyan-400' : 'text-cyan-700'
    );
  } else {
    expect(view.queryByTestId('tiktok-brand-label')).toBeNull();
  }
});
