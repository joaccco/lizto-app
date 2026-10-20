import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWorkRequestDetail } from '@/features/work-requests/api/useWorkRequestDetail';
import { useCreateOffer, useAskQuestion, useDeclineWorkRequest } from '@/features/offers/api/useOffers';
import { GlassNav, GlassCard, GlassButton, Badge, Text, Skeleton, ErrorState } from '@/components/ui';
import { CreateOfferFormData } from '@/features/offers/schemas/offerSchema';
import { OfferSheet } from '@/features/offers/components/OfferSheet';
import { QuestionSheet } from '@/features/offers/components/QuestionSheet';

export default function ProWorkRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkRequestDetail key={id} id={id} />;
}

function WorkRequestDetail({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: request, isLoading, isError, refetch } = useWorkRequestDetail(id);
  const createOfferMutation = useCreateOffer(id);
  const offerId = createOfferMutation.data?.data.id ?? null;
  const askQuestionMutation = useAskQuestion(offerId, id);
  const declineMutation = useDeclineWorkRequest(id);

  const [offerSheetVisible, setOfferSheetVisible] = useState(false);
  const [questionSheetVisible, setQuestionSheetVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleCreateOffer = async (payload: CreateOfferFormData) => {
    try {
      await createOfferMutation.mutateAsync(payload);
      setOfferSheetVisible(false);
      setFeedbackMessage(t('detail.offerSent'));
      refetch();
    } catch {
      throw new Error(t('offers.sendError'));
    }
  };

  const handleAskQuestion = async (questionText: string) => {
    try {
      await askQuestionMutation.mutateAsync({ question_text: questionText });
      setQuestionSheetVisible(false);
      setFeedbackMessage(t('detail.questionSent'));
      refetch();
    } catch {
      throw new Error(t('questions.sendError'));
    }
  };

  const handleDeclineRequest = () => {
    Alert.alert(
      t('detail.declineTitle'),
      t('detail.declineDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('detail.decline'),
          style: 'destructive',
          onPress: async () => {
            try { await declineMutation.mutateAsync(); router.back(); }
            catch { setFeedbackMessage(t('detail.declineError')); }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-background">
        <GlassNav title={t('common.loading')} />
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
      <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-background justify-center px-6">
        <ErrorState
          title={t('detail.errorTitle')}
          message={t('detail.errorDescription')}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const locationText = request.location_address ?? t('detail.locationUnavailable');
  const radiusText = request.is_approximate && request.location_radius_meters ? t('detail.radius', { radius: request.location_radius_meters }) : '';

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-background" testID="work-request-detail-screen">
      {/* Header Bar */}
      <GlassNav
        title={t('detail.title')}
        leftAction={
          <Pressable onPress={() => router.back()} className="p-2">
            <Text variant="body" weight="bold" className="text-primary">
              {t('common.back')}
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
            <Badge variant="category" label={request.category?.name ?? t('detail.categoryUnavailable')} />
            <Badge
              variant={request.urgency.toLowerCase().includes('urgent') ? 'high' : 'medium'}
              label={t('detail.urgency', { urgency: t(`workRequests.urgency.${request.urgency}`, { defaultValue: t('workRequests.urgency.unknown') }) })}
            />
          </View>

          <Text variant="h2" weight="bold" className="mb-3 leading-7">
            {request.raw_prompt}
          </Text>

          <View className="pt-3 border-t border-border space-y-2">
            <Text variant="caption">
              {t('detail.schedule')}
              <Text variant="caption" weight="semibold" className="text-foreground">
                {request.formatted_schedule ?? t('detail.scheduleUnavailable')}
              </Text>
            </Text>

            {/* REGLA DE UBICACIÓN SERVIDOR: Renderiza zona y radio indicativo cuando es aproximada */}
            <Text variant="caption">
              {t('detail.location')}
              <Text variant="caption" weight="bold" className="text-fluor" testID="approximate-zone-text">
                {locationText}{radiusText}
              </Text>
            </Text>
          </View>
        </GlassCard>

        {request.privacy_violation ? <Text variant="caption" className="mb-4">{t('detail.locationHidden')}</Text> : null}
        <Text variant="caption" className="mb-4">{t('detail.declineUnavailable')}</Text>
        {!offerId ? <Text variant="caption" className="mb-4">{t('questions.offerRequired')}</Text> : null}
        {/* Preguntas Aclaratorias / Brief */}
        {request.brief?.attributes && Object.keys(request.brief.attributes).length > 0 ? (
          <GlassCard className="mb-4">
            <Text variant="h3" weight="bold" className="mb-3">
              {t('detail.answers')}
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
            {t('detail.disclaimer')}
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
              {t('detail.offer')}
            </GlassButton>
          </View>

          <View className="flex-1">
            <GlassButton
              variant="secondary"
              size="lg"
              onPress={() => setQuestionSheetVisible(true)}
              disabled={!offerId}
              testID="open-question-sheet-button"
            >
              {t('detail.question')}
            </GlassButton>
          </View>

          <GlassButton
            variant="danger"
            size="lg"
            onPress={handleDeclineRequest}
            loading={declineMutation.isPending}
            disabled
            testID="decline-request-button"
          >
            {t('detail.decline')}
          </GlassButton>
        </View>
      </View>

      {/* Modal Sheet Composición de Oferta */}
      <OfferSheet
        key={offerSheetVisible ? 'open' : 'closed'}
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
