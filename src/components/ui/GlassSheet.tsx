import React from 'react';
import { Modal, ModalProps, View, TouchableWithoutFeedback, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface GlassSheetProps extends ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

export const GlassSheet: React.FC<GlassSheetProps> = ({
  children,
  visible,
  onClose,
  title,
  animationType = 'slide',
  transparent = true,
  className = '',
  ...props
}) => {
  const insets = useSafeAreaInsets();
  const paddingBottom = insets.bottom > 0 ? insets.bottom : 20;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType={animationType}
      transparent={transparent}
      {...props}
    >
      <View className="flex-1 justify-end">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0 bg-black/60" />
        </TouchableWithoutFeedback>

        <View className={`w-full bg-card border-t border-border rounded-t-3xl overflow-hidden shadow-2xl ${className}`.trim()} style={{ paddingBottom }}>
          {Platform.OS !== 'android' ? (
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          ) : null}
          <View className="relative z-10 p-6">
            <View className="w-12 h-1 bg-border rounded-full align-self-center self-center mb-4 opacity-70" />
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
};
