import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ConversationNameField } from '@/core/navigation/ConversationPresentation';
import { HttpError } from '@/core/api/httpClient';
import { useTranslation } from 'react-i18next';
import { useConversation, useSendMessage } from '@/features/chat/api/useChat';
import { GlassNav, GlassButton, Input, Text, Badge, Skeleton, ErrorState } from '@/components/ui';
import { formatTimeAgo } from '@/core/domain/time';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  const { data: conversation, isLoading, isError, refetch } = useConversation(id as string);
  const sendMessageMutation = useSendMessage(id as string);

  const [messageText, setMessageText] = useState('');
  const [guardError, setGuardError] = useState<string | null>(null);

  const nameField = useContext(ConversationNameField);
  const counterpartName = (nameField && conversation?.[nameField]) || t('chat.title');

  // Autoscroll al mensaje más reciente al cargar mensajes por primera vez o recibir nuevos
  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation?.messages?.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setGuardError(null);
    const contentToSend = messageText;

    try {
      await sendMessageMutation.mutateAsync({ content: contentToSend });
      // Si el envío fue exitoso, limpiar la caja de texto
      setMessageText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      // Si el servidor rechaza por Anti-Contact Guard o falla de red:
      // Conservar el texto en el input para que el usuario edite y reintente (Criterio 2 y 4)
      const serverMessage = err instanceof HttpError ? err.message : t('chat.sendError');
      setGuardError(serverMessage);
    }
  };

  if (isLoading && !conversation) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-background">
        <GlassNav title={t('common.loading')} />
        <View className="p-6 space-y-4">
          <Skeleton width="100%" height={60} borderRadius={16} />
          <Skeleton width="70%" height={80} borderRadius={16} />
          <Skeleton width="70%" height={80} borderRadius={16} style={{ alignSelf: 'flex-end' }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-background justify-center px-6">
        <ErrorState
          title={t('chat.errorTitle')}
          message={t('chat.errorDescription')}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-background" testID="chat-screen">
      {/* Header Fijo en Cristal Líquido */}
      <GlassNav
        title={counterpartName}
        leftAction={
          <Pressable onPress={() => router.back()} className="p-2">
            <Text variant="body" weight="bold" className="text-primary">
              {t('common.back')}
            </Text>
          </Pressable>
        }
      >
        <View className="items-center">
          <Text variant="subtitle" weight="bold" numberOfLines={1}>
            {counterpartName}
          </Text>
          <View className="flex-row items-center space-x-2 mt-0.5">
            <Badge variant="category" label={conversation.category_name} />
            {conversation.is_closed && (
              <Badge variant="high" label={t('chat.closedLabel')} />
            )}
          </View>
        </View>
      </GlassNav>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Banner de Trabajo / Solicitud */}
        <View className="bg-card/90 px-4 py-2 border-b border-border">
          <Text variant="caption" muted numberOfLines={1}>
            {t('chat.request', { prompt: conversation.raw_prompt })}
          </Text>
        </View>

        {/* Lista de Mensajes (Sin Blur para alto rendimiento) */}
        <FlatList
          ref={flatListRef}
          data={conversation.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.is_me;
            return (
              <View
                className={`mb-3 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}
                testID={`chat-message-${item.id}`}
              >
                {/* Contenido con fondo sólido #131318 */}
                <View
                  className={`p-3.5 rounded-2xl border ${
                    isMe
                      ? 'bg-primary/20 border-primary/40 rounded-tr-none'
                      : 'bg-[#131318] border-border rounded-tl-none'
                  }`}
                >
                  {!isMe && (
                    <Text variant="caption" weight="semibold" className="text-fluor mb-1">
                      {item.sender_name}
                    </Text>
                  )}
                  <Text variant="body" className="leading-5">
                    {item.content}
                  </Text>
                  <Text
                    variant="caption"
                    muted
                    className={`text-[10px] mt-1 ${isMe ? 'text-right' : 'text-left'}`}
                  >
                    {formatTimeAgo(item.created_at)}
                  </Text>
                </View>
              </View>
            );
          }}
          testID="chat-messages-list"
        />

        {isError ? <Text variant="caption" accessibilityRole="alert">{t('chat.refreshError')}</Text> : null}
        {/* Banner Informativo / Anti-Contact Guard Error */}
        {guardError ? (
          <View className="bg-danger/15 border-t border-b border-danger/30 px-4 py-3" testID="anti-contact-error-banner">
            <Text variant="caption" weight="bold" className="text-danger">
              {guardError}
            </Text>
            <Text variant="caption" className="text-danger/80 text-xs mt-1">
              {t('chat.retryHint')}
            </Text>
          </View>
        ) : null}

        {/* Composición Fija / Estado Cerrado (Criterio 3) */}
        {conversation.is_closed ? (
          <View className="p-4 bg-muted/40 border-t border-border items-center">
            <Text variant="caption" weight="semibold" className="text-muted-foreground text-center">
              {t('chat.closedDescription')}
            </Text>
          </View>
        ) : (
          <View className="p-3 bg-background/95 border-t border-border flex-row items-center space-x-2">
            <View className="flex-1">
              <Input
                placeholder={t('chat.placeholder')}
                value={messageText}
                onChangeText={(txt) => {
                  setMessageText(txt);
                  if (guardError) setGuardError(null);
                }}
                multiline
                numberOfLines={2}
                className="max-h-24 min-h-[44px]"
                containerClassName="mb-0"
                testID="chat-input"
              />
            </View>

            <GlassButton
              variant="primary"
              size="md"
              onPress={handleSendMessage}
              loading={sendMessageMutation.isPending}
              disabled={sendMessageMutation.isPending || !messageText.trim()}
              testID="chat-send-button"
            >
              {t('chat.submit')}
            </GlassButton>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
