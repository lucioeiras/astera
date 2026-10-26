import { decodeHTML } from 'entities';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BookCover } from '../effects/BookCover';
import { ProgressStatus } from './ProgressStatus';

import type { MediaProgressStatus } from '@/lib/library/types';

type BookCardProps = {
  title: string;
  hideTitleAndAuthor?: boolean;
  cover?: string;
  coverAspectRatio?: number;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  progressStatus?: MediaProgressStatus;
};

export const BookCard = ({
  title,
  hideTitleAndAuthor = false,
  cover,
  coverAspectRatio,
  publisher,
  publishedDate,
  pageCount,
  progressStatus,
}: BookCardProps) => {
  const [aspectRatio, setAspectRatio] = useState<number>(coverAspectRatio ?? 2 / 3);

  const cleanTitle = title ? decodeHTML(title) : 'Untitled Book';

  // Extract year from publishedDate (e.g., '2008-08-01' -> '2008')
  const publishedYear = publishedDate ? publishedDate.split('-')[0] : undefined;

  const metaParts: string[] = [];
  if (publishedYear) metaParts.push(publishedYear);
  if (pageCount) metaParts.push(`${pageCount} pgs`);
  if (!publishedYear && !pageCount && publisher) metaParts.push(decodeHTML(publisher));

  return (
    <View className="w-full overflow-hidden">
      <BookCover
        cover={cover}
        title={cleanTitle}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
      />

      {!hideTitleAndAuthor && (
        <View className="w-full gap-1.5 my-3 items-center">
          <Text
            className="font-sans-medium text-sm leading-[1.4] text-theme-foreground"
            numberOfLines={3}
          >
            {cleanTitle}
          </Text>

          <ProgressStatus type="book" status={progressStatus} />
        </View>
      )}
    </View>
  );
};
