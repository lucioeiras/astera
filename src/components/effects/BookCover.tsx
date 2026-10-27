import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import { BookOpen } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

cssInterop(ExpoImage, { className: 'style' });

export type BookCoverProps = {
  cover?: string;
  title?: string;
  aspectRatio?: number;
  onAspectRatioChange?: (ratio: number) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  roundedCorners?: boolean;
};

export const BookCover = ({
  cover,
  aspectRatio: externalRatio,
  onAspectRatioChange,
  className,
  style,
  roundedCorners = false,
}: BookCoverProps) => {
  const [internalRatio, setInternalRatio] = useState<number>(externalRatio ?? 2 / 3);
  const ratio = externalRatio ?? internalRatio;

  return (
    <View
      className={`relative overflow-hidden bg-zinc-900 rounded-sm ${className || ''}`}
      style={[{ aspectRatio: ratio }, style, roundedCorners ? styles.roundedBook : undefined]}
    >
      {/* Base Cover Artwork or Elegant Fallback */}
      {cover ? (
        <ExpoImage
          source={{ uri: cover }}
          className="w-full h-full bg-zinc-900"
          contentFit="cover"
          transition={200}
          onLoad={(e) => {
            if (e.source.width && e.source.height) {
              const newRatio = e.source.width / e.source.height;
              setInternalRatio(newRatio);
              onAspectRatioChange?.(newRatio);
            }
          }}
        />
      ) : (
        <View className="w-full h-full bg-amber-950/40 items-center justify-center p-6 border-b border-amber-900/30">
          <BookOpen size={36} color="#F59E0B" strokeWidth={2} />
        </View>
      )}

      {/* 3D Realistic Book Lighting & Spine Overlays */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, roundedCorners ? styles.roundedBook : undefined]}
      >
        {/* 1. Spine 3D Cylinder Lighting (left edge curvature) */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.55)',
            'rgba(0, 0, 0, 0.20)',
            'rgba(255, 255, 255, 0.32)',
            'rgba(255, 255, 255, 0.12)',
            'rgba(0, 0, 0, 0.45)',
          ]}
          locations={[0, 0.15, 0.45, 0.7, 1.0]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.spineCylinder}
        />

        {/* 2. Spine Hinge Crease Groove (dark groove line + highlight ridge) */}
        <View style={styles.hingeCreaseContainer}>
          <View style={styles.hingeCreaseDark} />
          <View style={styles.hingeCreaseHighlight} />
        </View>

        {/* 3. Soft Shadow Falloff from hinge crease onto front cover */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.32)',
            'rgba(0, 0, 0, 0.14)',
            'rgba(0, 0, 0, 0.04)',
            'transparent',
          ]}
          locations={[0, 0.35, 0.7, 1.0]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hingeFalloff}
        />

        {/* 4. Overall Surface Sheen / Gloss (satin paperback finish) */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.09)',
            'rgba(255, 255, 255, 0.02)',
            'transparent',
            'rgba(0, 0, 0, 0.04)',
            'rgba(0, 0, 0, 0.22)',
          ]}
          locations={[0, 0.2, 0.55, 0.82, 1.0]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 5. Right Outer Edge Paper Thickness & Shadow */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.35)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.rightEdgeShadow}
        />
        <View style={styles.rightEdgeRim} />

        {/* 6. Top & Bottom Trimmed Paper Edge Highlights */}
        <View style={styles.topEdgeHighlight} />
        <View style={styles.bottomEdgeShadow} />

        {/* 7. Subtle Inset Border Frame */}
        <View style={styles.innerBorder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  roundedBook: {
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  spineCylinder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '7.5%',
  },
  hingeCreaseContainer: {
    position: 'absolute',
    left: '7.5%',
    top: 0,
    bottom: 0,
    width: 3,
    flexDirection: 'row',
  },
  hingeCreaseDark: {
    width: 1.5,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  hingeCreaseHighlight: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  hingeFalloff: {
    position: 'absolute',
    left: '7.5%',
    top: 0,
    bottom: 0,
    width: '11%',
  },
  rightEdgeShadow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '4%',
  },
  rightEdgeRim: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  topEdgeHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  bottomEdgeShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  innerBorder: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
});
