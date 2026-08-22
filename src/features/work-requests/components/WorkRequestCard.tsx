import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { WorkRequestItem } from '../schemas/workRequestSchema';
import { formatTimeAgo } from '@/core/domain/time';
import { useTranslation } from 'react-i18next';

interface WorkRequestCardProps {
  item: WorkRequestItem;
  onPress?: (item: WorkRequestItem) => void;
}

export const WorkRequestCard: React.FC<WorkRequestCardProps> = ({ item, onPress }) => {
  const { t } = useTranslation();

  const getUrgencyBadgeStyle = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'urgent':
      case 'urgente':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'high':
      case 'alta':
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    }
  };

  const urgencyKey = `workRequests.urgency.${item.urgency.toLowerCase()}`;
  const urgencyLabel = t(urgencyKey, { defaultValue: item.urgency });

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-slate-200 dark:border-slate-700 active:opacity-90"
      testID="work-request-card"
    >
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-sky-100 dark:bg-sky-900/40 px-3 py-1 rounded-full">
          <Text className="text-sky-800 dark:text-sky-300 text-xs font-semibold">
            {item.category}
          </Text>
        </View>
        
        <View className={`px-2.5 py-0.5 rounded-full border ${getUrgencyBadgeStyle(item.urgency)}`}>
          <Text className="text-xs font-medium">
            {urgencyLabel}
          </Text>
        </View>
      </View>

      <Text className="text-slate-900 dark:text-slate-100 font-bold text-base mb-2 leading-6" numberOfLines={2}>
        {item.raw_prompt}
      </Text>

      <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <View className="flex-row items-center space-x-1">
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            📍 Zona: <Text className="text-slate-700 dark:text-slate-300 font-semibold">{item.location}</Text>
          </Text>
        </View>

        <Text className="text-slate-400 dark:text-slate-500 text-xs font-medium">
          {formatTimeAgo(item.created_at)}
        </Text>
      </View>
    </Pressable>
  );
};
