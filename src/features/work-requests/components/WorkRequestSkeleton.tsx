import React from 'react';
import { View } from 'react-native';

export const WorkRequestSkeleton: React.FC = () => {
  return (
    <View className="space-y-4 p-4" testID="work-requests-skeleton">
      {[1, 2, 3].map((index) => (
        <View
          key={index}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse"
        >
          <View className="flex-row justify-between items-center mb-3">
            <View className="bg-slate-200 dark:bg-slate-700 w-24 h-6 rounded-full" />
            <View className="bg-slate-200 dark:bg-slate-700 w-16 h-5 rounded-full" />
          </View>
          <View className="bg-slate-200 dark:bg-slate-700 w-full h-5 rounded mb-2" />
          <View className="bg-slate-200 dark:bg-slate-700 w-3/4 h-5 rounded mb-4" />
          <View className="flex-row justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
            <View className="bg-slate-200 dark:bg-slate-700 w-28 h-4 rounded" />
            <View className="bg-slate-200 dark:bg-slate-700 w-20 h-4 rounded" />
          </View>
        </View>
      ))}
    </View>
  );
};
