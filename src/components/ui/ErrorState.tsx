import React from 'react';
import { View, ViewProps } from 'react-native';
import { Text } from './Text';
import { GlassButton } from './GlassButton';

export interface ErrorStateProps extends ViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  testID?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocurrió un error',
  message,
  onRetry,
  testID = 'error-state',
  style,
  className = '',
  ...props
}) => {
  return (
    <View
      testID={testID}
      className={`items-center justify-center p-8 bg-danger/10 border border-danger/30 rounded-2xl ${className}`.trim()}
      style={style}
      {...props}
    >
      <Text variant="h3" weight="bold" className="text-danger text-center mb-2">
        {title}
      </Text>
      <Text variant="body" muted className="text-center mb-6 max-w-[280px]">
        {message}
      </Text>
      {onRetry ? (
        <GlassButton variant="danger" size="md" onPress={onRetry}>
          Reintentar
        </GlassButton>
      ) : null}
    </View>
  );
};
