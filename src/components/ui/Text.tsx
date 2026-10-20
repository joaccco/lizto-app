import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'subtitle' | 'body' | 'caption' | 'mono';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  muted?: boolean;
  color?: string;
  className?: string;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  weight = 'regular',
  muted = false,
  color,
  style,
  className = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'h1':
        return 'text-2xl font-sans-extrabold text-foreground tracking-tight';
      case 'h2':
        return 'text-xl font-sans-bold text-foreground tracking-tight';
      case 'h3':
        return 'text-lg font-sans-semibold text-foreground';
      case 'subtitle':
        return 'text-base font-sans-medium text-foreground';
      case 'caption':
        return 'text-xs font-sans text-muted-foreground';
      case 'mono':
        return 'text-sm font-mono text-foreground';
      case 'body':
      default:
        return 'text-sm font-sans text-foreground';
    }
  };

  const getWeightClass = () => {
    if (variant === 'mono') {
      switch (weight) {
        case 'medium':
          return 'font-mono-medium';
        case 'semibold':
        case 'bold':
        case 'extrabold':
          return 'font-mono-semibold';
        default:
          return 'font-mono';
      }
    }

    switch (weight) {
      case 'medium':
        return 'font-sans-medium';
      case 'semibold':
        return 'font-sans-semibold';
      case 'bold':
        return 'font-sans-bold';
      case 'extrabold':
        return 'font-sans-extrabold';
      case 'regular':
      default:
        return 'font-sans';
    }
  };

  const mutedClass = muted ? 'text-muted-foreground' : '';
  const combinedClassName = `${getVariantStyles()} ${getWeightClass()} ${mutedClass} ${className}`.trim();

  return (
    <RNText
      className={combinedClassName}
      style={color ? [{ color }, style] : style}
      {...props}
    >
      {children}
    </RNText>
  );
};
