import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 28,
  tint = 'dark',
  style,
  className = '',
  ...props
}) => {
  const baseContainerClasses = 'rounded-2xl border border-border overflow-hidden bg-card/60';

  if (Platform.OS === 'android') {
    // Android fallback for optimal performance without blur artifacting
    return (
      <View
        className={`${baseContainerClasses} bg-[#131318]/90 ${className}`.trim()}
        style={style}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <View className={`${baseContainerClasses} ${className}`.trim()} style={style} {...props}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      <View className="p-4 relative z-10">{children}</View>
    </View>
  );
};
