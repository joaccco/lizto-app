import {
  conversationDetailSchema,
  messageSchema,
  sendMessageSchema,
} from '@/features/chat/schemas/chatSchema';

describe('Criterios de Aceptación: Módulo de Chat y Reglas de Dominio', () => {
  describe('Criterio 1 y 3: Parseo de Esquemas de Conversación y Estado Cerrado', () => {
    test('Parsea correctamente una conversación activa con sus mensajes', () => {
      const activeConversationData = {
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
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
            id: '550e8400-e29b-41d4-a716-446655440002',
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
        conversation_id: '550e8400-e29b-41d4-a716-446655440001',
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

    // La conservación real del texto se verifica interactuando con ChatScreen en chat-screen.test.tsx.

  });
});
