import { fireEvent, render } from '@testing-library/react-native';
import { CardReview } from '@/components/card/CardReview';

jest.mock('lucide-react-native', () => ({
  Smile: () => null,
  Star: (props: object) =>
    jest
      .requireActual('react')
      .createElement(jest.requireActual('react-native').View, { ...props, testID: 'star' }),
}));

describe('CardReview', () => {
  it('renders empty comments and updates rating and comments', async () => {
    const onRatingChange = jest.fn();
    const onCommentsChange = jest.fn();
    const { getByLabelText, getByPlaceholderText } = await render(
      <CardReview
        rating={null}
        comments=""
        onRatingChange={onRatingChange}
        onCommentsChange={onCommentsChange}
      />
    );

    await fireEvent.press(getByLabelText('3.5 out of 5 stars'));
    await fireEvent.changeText(getByPlaceholderText('What is your opinion on this?'), 'Great');
    expect(onRatingChange).toHaveBeenCalledWith(3.5);
    expect(onCommentsChange).toHaveBeenCalledWith('Great');
  });

  it('reflects a selected full-star rating', async () => {
    const { getByLabelText } = await render(
      <CardReview
        rating={4}
        comments="Worth reading"
        onRatingChange={jest.fn()}
        onCommentsChange={jest.fn()}
      />
    );

    expect(getByLabelText('4 out of 5 stars').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('3.5 out of 5 stars').props.accessibilityState.selected).toBe(false);
  });
});

it.each([
  [null, []],
  [0, []],
  [0.5, [12]],
  [3.5, [24, 24, 24, 12]],
  [5, [24, 24, 24, 24, 24]],
] as const)('renders the filled portion of a %s-star rating', async (rating, widths) => {
  const view = await render(
    <CardReview
      rating={rating}
      comments=""
      onRatingChange={jest.fn()}
      onCommentsChange={jest.fn()}
    />
  );
  const stars = view.getAllByTestId('star');
  expect(stars.filter((star) => star.props.strokeWidth === 1.5)).toHaveLength(5);
  const filled = stars.filter((star) => star.props.fill);
  expect(filled.map((star) => star.parent?.props.style.width)).toEqual(widths);
  filled.forEach((star) => expect(star.props.fill).toBe(star.props.color));
});
