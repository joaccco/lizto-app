import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from './Text';

export interface GlassButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'fluor' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  activeOpacity = 0.8,
  style,
  className = '',
  ...props
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-3 rounded-xl';
      case 'lg':
        return 'py-4 px-6 rounded-2xl';
      case 'md':
      default:
        return 'py-3 px-5 rounded-2xl';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary border border-primary/50 shadow-md shadow-primary/20';
      case 'fluor':
        return 'bg-fluor border border-fluor/50 shadow-md shadow-fluor/20';
      case 'danger':
        return 'bg-danger border border-danger/50 shadow-md shadow-danger/20';
      case 'outline':
        return 'bg-transparent border border-border';
      case 'secondary':
      default:
        return 'bg-card/70 border border-border overflow-hidden';
    }
  };

  const getTextColor = () => {
    if (variant === 'fluor') return '#08080A'; // Dark text on fluor background
    if (variant === 'primary' || variant === 'danger') return '#F4F3F7';
    return '#F4F3F7';
  };

  const getTextWeight = () => {
    return variant === 'fluor' ? 'bold' : 'semibold';
  };

  const isInteractive = !disabled && !loading;
  const opacityClass = disabled ? 'opacity-50' : '';

  const buttonContent = (
    <View className="flex-row items-center justify-center space-x-2">
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : typeof children === 'string' ? (
        <Text
          variant={size === 'sm' ? 'caption' : 'body'}
          weight={getTextWeight()}
          style={{ color: getTextColor() }}
          className="text-center"
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );

  const containerClasses = `relative items-center justify-center ${getSizeClasses()} ${getVariantClasses()} ${opacityClass} ${className}`.trim();

  if (variant === 'secondary' && Platform.OS !== 'android') {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        disabled={!isInteractive}
        className={containerClasses}
        style={style}
        {...props}
      >
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
        <View className="relative z-10 w-full">{buttonContent}</View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      disabled={!isInteractive}
      className={containerClasses}
      style={style}
      {...props}
    >
      {buttonContent}
    </TouchableOpacity>
  );
};
