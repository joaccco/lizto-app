import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';

export function Screen({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-xl self-center px-6 pt-8 pb-10">
          <Text accessibilityRole="header" variant="h1" weight="extrabold">{title}</Text>
          {subtitle ? <Text muted className="mt-2 mb-2 leading-6">{subtitle}</Text> : null}
          <View className="mt-7 gap-5">{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
