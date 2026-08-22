import React from 'react';
import { View } from 'react-native';
import { Card, Skeleton } from '@/components/ui';

export const WorkRequestSkeleton: React.FC = () => {
  return (
    <View className="space-y-4 p-4" testID="work-requests-skeleton">
      {[1, 2, 3].map((index) => (
        <Card key={index} className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Skeleton width={96} height={24} borderRadius={999} />
            <Skeleton width={64} height={20} borderRadius={999} />
          </View>

          <Skeleton width="100%" height={20} borderRadius={6} className="mb-2" />
          <Skeleton width="75%" height={20} borderRadius={6} className="mb-4" />

          <View className="flex-row justify-between pt-3 border-t border-border">
            <Skeleton width={112} height={16} borderRadius={4} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </View>
        </Card>
      ))}
    </View>
  );
};
