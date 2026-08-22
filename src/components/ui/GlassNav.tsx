import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface GlassNavProps extends ViewProps {
  title?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  intensity?: number;
  className?: string;
}

export const GlassNav: React.FC<GlassNavProps> = ({
  title,
  leftAction,
  rightAction,
  intensity = 30,
  children,
  style,
  className = '',
  ...props
}) => {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top > 0 ? insets.top : 12;

  const baseContainerClasses = 'w-full border-b border-border bg-card/60 overflow-hidden';

  const content = (
    <View className="px-4 pb-3 flex-row items-center justify-between min-h-[44px]">
      <View className="w-10 items-start">{leftAction}</View>
      <View className="flex-1 items-center px-2">
        {title ? (
          <View className="items-center">
            {children || <View />}
          </View>
        ) : (
          children
        )}
      </View>
      <View className="w-10 items-end">{rightAction}</View>
    </View>
  );

  if (Platform.OS === 'android') {
    return (
      <View
        className={`${baseContainerClasses} bg-[#131318]/95 ${className}`.trim()}
        style={[{ paddingTop }, style]}
        {...props}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      className={`${baseContainerClasses} ${className}`.trim()}
      style={[{ paddingTop }, style]}
      {...props}
    >
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View className="relative z-10">{content}</View>
    </View>
  );
};
