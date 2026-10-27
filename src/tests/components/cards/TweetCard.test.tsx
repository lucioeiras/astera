import { render } from '@testing-library/react-native';
import { TweetCard } from '@/components/cards/TweetCard';

let mockIsDark = false;
jest.mock('@/lib/theme', () => ({ useAppTheme: () => ({ isDark: mockIsDark }) }));

it.each([false, true])(
  'uses sky colors with a readable label when dark mode is %s',
  async (isDark) => {
    mockIsDark = isDark;
    const view = await render(<TweetCard avatar="avatar.jpg" author="Author" text="A tweet" />);
    expect(view.getByTestId('tweet-card-tint').props.className).toContain('bg-sky-500/10');
    expect(view.getByTestId('tweet-brand-label').props.className).toContain(
      isDark ? 'text-sky-400' : 'text-sky-700'
    );
  }
);
