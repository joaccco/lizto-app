import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
} from 'react-native';
import { Text } from './Text';

export interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  style,
  onFocus,
  onBlur,
  placeholderTextColor = 'rgba(244, 243, 247, 0.4)',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: NonNullable<RNTextInputProps['onFocus']> = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur: NonNullable<RNTextInputProps['onBlur']> = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const borderClass = error
    ? 'border-danger'
    : isFocused
    ? 'border-primary'
    : 'border-border';

  return (
    <View className={`w-full ${containerClassName}`.trim()}>
      {label ? (
        <Text variant="caption" weight="medium" className="mb-1.5 text-muted-foreground">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center px-4 py-3 bg-card/80 border ${borderClass} rounded-2xl overflow-hidden`}
      >
        {leftIcon ? <View className="mr-3">{leftIcon}</View> : null}
        <RNTextInput
          className={`flex-1 text-foreground font-sans text-sm p-0 ${className}`.trim()}
          accessibilityLabel={label}
          placeholderTextColor={placeholderTextColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={style}
          {...props}
        />
        {rightIcon ? <View className="ml-3">{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text variant="caption" className="mt-1 text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
