import { View, type ViewProps } from 'react-native';

export function AddActionIconSlot({ children, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        props.style,
      ]}
    >
      {children}
    </View>
  );
}
