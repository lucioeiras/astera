import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { useState } from 'react';
import { Text, View } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

type NoteProps = {
  url: string;
  title?: string;
  onAspectRatioChange?: (ratio: number) => void;
};

export const ImageCard = ({ url, title, onAspectRatioChange }: NoteProps) => {
  const [aspectRatio, setAspectRatio] = useState(1); // Default to a square until loaded

  return (
    <View className="w-full">
      <ExpoImage
        source={{ uri: url }}
        className="w-full rounded-xl"
        style={{
          aspectRatio,
        }}
        contentFit="cover"
        onLoad={(e) => {
          if (e.source.width && e.source.height) {
            setAspectRatio(e.source.width / e.source.height);
            onAspectRatioChange?.(e.source.width / e.source.height);
          }
        }}
      />

      {title && (
        <Text
          className="font-sans-medium text-center text-xs text-theme-secondary leading-[1.6] mt-3"
          numberOfLines={2}
        >
          {title}
        </Text>
      )}
    </View>
  );
};
