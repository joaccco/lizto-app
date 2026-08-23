import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWorkRequestDetail } from '@/features/work-requests/api/useWorkRequestDetail';
import { useCreateOffer, useAskQuestion, useDeclineWorkRequest } from '@/features/offers/api/useOffers';
import { GlassNav, GlassCard, GlassButton, Badge, Text, Skeleton, ErrorState } from '@/components/ui';
import { OfferSheet } from '@/features/offers/components/OfferSheet';
import { QuestionSheet } from '@/features/offers/components/QuestionSheet';

export default function ProWorkRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: request, isLoading, isError, error, refetch } = useWorkRequestDetail(id as string);
  const createOfferMutation = useCreateOffer(id as string);
  const askQuestionMutation = useAskQuestion(id as string);
  const declineMutation = useDeclineWorkRequest(id as string);

  const [offerSheetVisible, setOfferSheetVisible] = useState(false);
  const [questionSheetVisible, setQuestionSheetVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleCreateOffer = async (payload: any) => {
    try {
      await createOfferMutation.mutateAsync(payload);
      setOfferSheetVisible(false);
      setFeedbackMessage('¡Oferta enviada exitosamente al cliente!');
      refetch();
    } catch (err: any) {
      throw new Error(err?.message || 'Error al enviar oferta.');
    }
  };

  const handleAskQuestion = async (questionText: string) => {
    try {
      await askQuestionMutation.mutateAsync({ question_text: questionText });
      setQuestionSheetVisible(false);
      setFeedbackMessage('Pregunta enviada correctamente.');
      refetch();
    } catch (err: any) {
      throw new Error(err?.message || 'Error al enviar pregunta.');
    }
  };

  const handleDeclineRequest = () => {
    Alert.alert(
      'Descartar Solicitud',
      '¿Estás seguro de que deseas descartar esta solicitud de trabajo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            await declineMutation.mutateAsync();
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <GlassNav title="Cargando Solicitud..." />
        <View className="p-6 space-y-4">
          <Skeleton width="100%" height={120} borderRadius={20} />
          <Skeleton width="100%" height={200} borderRadius={20} />
          <Skeleton width="100%" height={80} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !request) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center px-6">
        <ErrorState
          title="No se pudo cargar la solicitud"
          message={error?.message || 'La solicitud no existe o fue cancelada.'}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const locationText = request.location_address || request.address || 'Zona aproximada';
  const radiusText = request.is_approximate ? ` (Radio aprox. ~${request.location_radius_meters || 500}m)` : '';

  return (
    <SafeAreaView className="flex-1 bg-background" testID="work-request-detail-screen">
      {/* Header Bar */}
      <GlassNav
        title="Detalle de Solicitud"
        leftAction={
          <Pressable onPress={() => router.back()} className="p-2">
            <Text variant="body" weight="bold" className="text-primary">
              ← Volver
            </Text>
          </Pressable>
        }
      />

      <ScrollView className="flex-1 px-5 pt-4 pb-28" showsVerticalScrollIndicator={false}>
        {/* Banner de Feedback Message */}
        {feedbackMessage ? (
          <View className="bg-success/15 border border-success/30 rounded-2xl p-4 mb-4">
            <Text variant="caption" weight="bold" className="text-success text-center">
              {feedbackMessage}
            </Text>
          </View>
        ) : null}

        {/* Encabezado de la Solicitud */}
        <GlassCard className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Badge variant="category" label={request.category?.name || 'Servicio General'} />
            <Badge
              variant={request.urgency.toLowerCase().includes('urgent') ? 'high' : 'medium'}
              label={`Urgencia: ${request.urgency}`}
            />
          </View>

          <Text variant="h2" weight="bold" className="mb-3 leading-7">
            {request.raw_prompt}
          </Text>

          <View className="pt-3 border-t border-border space-y-2">
            <Text variant="caption">
              🕒 Horario solicitado:{' '}
              <Text variant="caption" weight="semibold" className="text-foreground">
                {request.formatted_schedule || 'Fecha a coordinar'}
              </Text>
            </Text>

            {/* REGLA DE UBICACIÓN SERVIDOR: Renderiza zona y radio indicativo cuando es aproximada */}
            <Text variant="caption">
              📍 Ubicación:{' '}
              <Text variant="caption" weight="bold" className="text-fluor" testID="approximate-zone-text">
                {locationText}{radiusText}
              </Text>
            </Text>
          </View>
        </GlassCard>

        {/* Preguntas Aclaratorias / Brief */}
        {request.brief?.attributes && Object.keys(request.brief.attributes).length > 0 ? (
          <GlassCard className="mb-4">
            <Text variant="h3" weight="bold" className="mb-3">
              Respuestas Aclaratorias
            </Text>
            <View className="space-y-2">
              {Object.entries(request.brief.attributes).map(([key, val]) => (
                <View key={key} className="bg-card p-3 rounded-xl border border-border">
                  <Text variant="caption" muted className="capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </Text>
                  <Text variant="body" weight="medium">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        ) : null}

        {/* Estado y Advertencias de Dominio */}
        <View className="bg-card p-4 rounded-2xl border border-border mb-6">
          <Text variant="caption" muted className="text-xs">
            🛡️ Tus ofertas quedan vinculadas a tu perfil profesional verificado. Recordá que la propuesta de horario y costo está sujeta a la confirmación final por el cliente.
          </Text>
        </View>
      </ScrollView>

      {/* Barra de Acciones Fija en Cristal Líquido */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 border-t border-border">
        <View className="flex-row space-x-2">
          <View className="flex-1">
            <GlassButton
              variant="primary"
              size="lg"
              onPress={() => setOfferSheetVisible(true)}
              testID="open-offer-sheet-button"
            >
              Ofertar
            </GlassButton>
          </View>

          <View className="flex-1">
            <GlassButton
              variant="secondary"
              size="lg"
              onPress={() => setQuestionSheetVisible(true)}
              testID="open-question-sheet-button"
            >
              Preguntar
            </GlassButton>
          </View>

          <GlassButton
            variant="danger"
            size="lg"
            onPress={handleDeclineRequest}
            loading={declineMutation.isPending}
            testID="decline-request-button"
          >
            ✕
          </GlassButton>
        </View>
      </View>

      {/* Modal Sheet Composición de Oferta */}
      <OfferSheet
        visible={offerSheetVisible}
        onClose={() => setOfferSheetVisible(false)}
        onSubmit={handleCreateOffer}
        windowStart={request.window_start}
        windowEnd={request.window_end}
        scheduledDate={request.scheduled_date}
        loading={createOfferMutation.isPending}
      />

      {/* Modal Sheet Pregunta Aclaratoria */}
      <QuestionSheet
        visible={questionSheetVisible}
        onClose={() => setQuestionSheetVisible(false)}
        onSubmit={handleAskQuestion}
        loading={askQuestionMutation.isPending}
      />
    </SafeAreaView>
  );
}
