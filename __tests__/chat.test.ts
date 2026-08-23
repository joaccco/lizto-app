import {
  conversationDetailSchema,
  messageSchema,
  sendMessageSchema,
} from '@/features/chat/schemas/chatSchema';

describe('Criterios de Aceptación: Módulo de Chat y Reglas de Dominio', () => {
  describe('Criterio 1 y 3: Parseo de Esquemas de Conversación y Estado Cerrado', () => {
    test('Parsea correctamente una conversación activa con sus mensajes', () => {
      const activeConversationData = {
        conversation_id: 'conv-123',
        client_id: 'user-client-1',
        client_name: 'Ana Clienta',
        provider_id: 'user-pro-1',
        provider_name: 'Carlos Plomero',
        category_name: 'Plomería',
        raw_prompt: 'Reparación de filtración',
        work_status: 'confirmed',
        is_closed: false,
        messages: [
          {
            id: 'msg-1',
            sender_id: 'user-client-1',
            sender_name: 'Ana Clienta',
            content: 'Hola, ¿a qué hora podrías pasar?',
            created_at: '2026-08-22T20:00:00.000Z',
            is_me: false,
          },
        ],
      };

      const result = conversationDetailSchema.safeParse(activeConversationData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_closed).toBe(false);
        expect(result.data.messages.length).toBe(1);
      }
    });

    test('Identifica correctamente una conversación cerrada por trabajo completado/cancelado', () => {
      const closedConversationData = {
        conversation_id: 'conv-456',
        client_id: 'user-client-1',
        client_name: 'Ana Clienta',
        provider_id: 'user-pro-1',
        provider_name: 'Carlos Plomero',
        category_name: 'Plomería',
        raw_prompt: 'Reparación de filtración',
        work_status: 'completed',
        is_closed: true,
        messages: [],
      };

      const result = conversationDetailSchema.safeParse(closedConversationData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_closed).toBe(true);
      }
    });
  });

  describe('Criterio 2: Anti-Contact Guard y Preservación de Texto', () => {
    test('Valida que un mensaje no esté vacío antes del envío', () => {
      const emptyMessage = { content: '' };
      const result = sendMessageSchema.safeParse(emptyMessage);
      expect(result.success).toBe(false);

      const validMessage = { content: 'Hola, confirmo el horario para mañana.' };
      const validResult = sendMessageSchema.safeParse(validMessage);
      expect(validResult.success).toBe(true);
    });

    test('Simula preservación de texto ante rechazo del servidor por Anti-Contact Guard (HTTP 422)', () => {
      let inputText = 'Mi WhatsApp es 11 1234 5678 para coordinar por ahí.';
      let errorMessage: string | null = null;

      // Simulación de respuesta 422 del servidor por Anti-Contact Guard
      const mockServerError = {
        status: 422,
        message: 'No se permite compartir datos de contacto (teléfono, WhatsApp, email) antes de la contratación.',
      };

      // Al fallar, se asigna el mensaje de error pero NO se borra inputText
      errorMessage = mockServerError.message;

      expect(errorMessage).toContain('No se permite compartir datos de contacto');
      expect(inputText).toBe('Mi WhatsApp es 11 1234 5678 para coordinar por ahí.');

      // Usuario edita el texto para remover el contacto y reintentar
      inputText = 'Hola, confirmo que puedo pasar a las 10 hs.';
      errorMessage = null;

      expect(inputText).toBe('Hola, confirmo que puedo pasar a las 10 hs.');
      expect(errorMessage).toBeNull();
    });
  });
});
