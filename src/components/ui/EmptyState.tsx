import React from 'react';
import { View, ViewProps } from 'react-native';
import { Text } from './Text';
import { GlassButton } from './GlassButton';

export interface EmptyStateProps extends ViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  testID = 'empty-state',
  style,
  className = '',
  ...props
}) => {
  return (
    <View
      testID={testID}
      className={`items-center justify-center p-8 bg-card/40 border border-border rounded-2xl ${className}`.trim()}
      style={style}
      {...props}
    >
      {icon ? <View className="mb-4">{icon}</View> : null}
      <Text variant="h3" weight="bold" className="text-center mb-2">
        {title}
      </Text>
      {description ? (
        <Text variant="body" muted className="text-center mb-6 max-w-[280px]">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <GlassButton variant="primary" size="md" onPress={onAction}>
          {actionLabel}
        </GlassButton>
      ) : null}
    </View>
  );
};
