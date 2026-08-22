import React from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';

export interface CardProps extends ViewProps {
  onPress?: TouchableOpacityProps['onPress'];
  activeOpacity?: number;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  activeOpacity = 0.7,
  style,
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-card border border-border rounded-2xl p-4 overflow-hidden shadow-sm';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        className={combinedClasses}
        style={style}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={combinedClasses} style={style} {...props}>
      {children}
    </View>
  );
};
