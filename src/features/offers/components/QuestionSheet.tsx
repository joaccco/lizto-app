import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { askQuestionSchema } from '../schemas/offerSchema';
import { GlassSheet, GlassButton, Input, Text } from '@/components/ui';

interface QuestionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (questionText: string) => Promise<void>;
  loading?: boolean;
}

export const QuestionSheet: React.FC<QuestionSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [questionText, setQuestionText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!askQuestionSchema.safeParse({ question_text: questionText }).success) {
      setError(t('questions.required'));
      return;
    }

    setError(null);
    try {
      await onSubmit(questionText.trim());
      setQuestionText('');
      onClose();
    } catch {
      setError(t('questions.sendError'));
    }
  };

  return (
    <GlassSheet visible={visible} onClose={onClose}>
      <Text variant="h2" weight="bold" className="mb-2">
        {t('questions.title')}
      </Text>
      <Text variant="caption" muted className="mb-4">
        {t('questions.description')}
      </Text>

      {error ? (
        <View className="bg-danger/15 border border-danger/30 rounded-2xl p-3 mb-4">
          <Text variant="caption" className="text-danger">
            {error}
          </Text>
        </View>
      ) : null}

      <Input
        label={t('questions.label')}
        placeholder={t('questions.placeholder')}
        value={questionText}
        onChangeText={setQuestionText}
        multiline
        numberOfLines={3}
        className="min-h-[80px]"
        containerClassName="mb-6"
        testID="question-input"
      />

      <GlassButton
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        testID="send-question-button"
      >
        {t('questions.submit')}
      </GlassButton>
    </GlassSheet>
  );
};
