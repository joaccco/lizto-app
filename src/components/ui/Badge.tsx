import React from 'react';
import { View, ViewProps } from 'react-native';
import { Text } from './Text';

export interface BadgeProps extends ViewProps {
  variant?: 'category' | 'high' | 'medium' | 'low' | 'fluor' | 'warning' | 'default';
  label: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  label,
  style,
  className = '',
  ...props
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'category':
        return {
          container: 'bg-primary/15 border-primary/30',
          text: '#8B6BFF',
        };
      case 'high':
        return {
          container: 'bg-danger/15 border-danger/30',
          text: '#FF5A5A',
        };
      case 'warning':
      case 'medium':
        return {
          container: 'bg-warning/15 border-warning/30',
          text: '#F2B441',
        };
      case 'low':
        return {
          container: 'bg-success/15 border-success/30',
          text: '#3DDC84',
        };
      case 'fluor':
        return {
          container: 'bg-fluor/15 border-fluor/30',
          text: '#A8FF35',
        };
      case 'default':
      default:
        return {
          container: 'bg-muted border-border',
          text: 'rgba(244, 243, 247, 0.7)',
        };
    }
  };

  const badgeStyle = getBadgeStyle();
  const containerClasses = `self-start px-3 py-1 rounded-full border ${badgeStyle.container} ${className}`.trim();

  return (
    <View className={containerClasses} style={style} {...props}>
      <Text
        variant="caption"
        weight="semibold"
        style={{ color: badgeStyle.text }}
      >
        {label}
      </Text>
    </View>
  );
};
