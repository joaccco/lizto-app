import React, { useState } from 'react';
import { View } from 'react-native';
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
  const [questionText, setQuestionText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!questionText.trim() || questionText.trim().length < 5) {
      setError('La pregunta debe contener al menos 5 caracteres.');
      return;
    }

    setError(null);
    try {
      await onSubmit(questionText.trim());
      setQuestionText('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al enviar la pregunta. Reintente.');
    }
  };

  return (
    <GlassSheet visible={visible} onClose={onClose}>
      <Text variant="h2" weight="bold" className="mb-2">
        Hacer una Pregunta
      </Text>
      <Text variant="caption" muted className="mb-4">
        Consultá detalles sobre el trabajo antes de enviar tu oferta formal.
      </Text>

      {error ? (
        <View className="bg-danger/15 border border-danger/30 rounded-2xl p-3 mb-4">
          <Text variant="caption" className="text-danger">
            {error}
          </Text>
        </View>
      ) : null}

      <Input
        label="Tu pregunta para el cliente"
        placeholder="Ej: ¿El lugar cuenta con acceso para estacionar o escalera?"
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
        Enviar Pregunta
      </GlassButton>
    </GlassSheet>
  );
};
