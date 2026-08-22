import React from 'react';
import { View } from 'react-native';
import { WorkRequestItem } from '../schemas/workRequestSchema';
import { formatTimeAgo } from '@/core/domain/time';
import { useTranslation } from 'react-i18next';
import { Card, Badge, Text } from '@/components/ui';

interface WorkRequestCardProps {
  item: WorkRequestItem;
  onPress?: (item: WorkRequestItem) => void;
}

export const WorkRequestCard: React.FC<WorkRequestCardProps> = ({ item, onPress }) => {
  const { t } = useTranslation();

  const getUrgencyVariant = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'urgent':
      case 'urgente':
      case 'high':
      case 'alta':
        return 'high';
      case 'medium':
      case 'media':
        return 'medium';
      default:
        return 'low';
    }
  };

  const urgencyKey = `workRequests.urgency.${item.urgency.toLowerCase()}`;
  const urgencyLabel = t(urgencyKey, { defaultValue: item.urgency });

  return (
    <Card
      onPress={() => onPress?.(item)}
      className="mb-4"
      testID="work-request-card"
    >
      <View className="flex-row justify-between items-center mb-3">
        <Badge variant="category" label={item.category} />
        <Badge variant={getUrgencyVariant(item.urgency)} label={urgencyLabel} />
      </View>

      <Text variant="subtitle" weight="bold" className="mb-2 leading-6" numberOfLines={2}>
        {item.raw_prompt}
      </Text>

      <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-border">
        <View className="flex-row items-center">
          <Text variant="caption">
            📍 Zona:{' '}
            <Text variant="caption" weight="semibold" className="text-foreground">
              {item.location}
            </Text>
          </Text>
        </View>

        <Text variant="caption">
          {formatTimeAgo(item.created_at)}
        </Text>
      </View>
    </Card>
  );
};
