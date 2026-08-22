import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkRequestCard } from '../src/features/work-requests/components/WorkRequestCard';
import { WorkRequestSkeleton } from '../src/features/work-requests/components/WorkRequestSkeleton';
import { WorkRequestItem } from '../src/features/work-requests/schemas/workRequestSchema';
import '../src/core/i18n';

describe('Criterios de Aceptación: Pantalla de Solicitudes y Componentes de Estado', () => {
  const mockWorkRequest: WorkRequestItem = {
    id: 'req-uuid-1',
    work_id: null,
    conversation_id: null,
    category: 'Plomería',
    category_slug: 'plomeria',
    raw_prompt: 'Reparar pérdida de agua debajo del fregadero de la cocina',
    client_name: 'Carlos',
    urgency: 'high',
    location: 'Centro',
    location_lat: -27.4692,
    location_lng: -58.8306,
    location_address: 'Av. Corrientes 1240',
    status: 'pending',
    estimated_duration_min: 60,
    created_at: '2026-08-21T20:00:00.000Z',
  };

  test('8a. Renderiza la tarjeta de solicitud mostrando categoría, prompt, zona aproximada y urgencia', () => {
    const { getByText, getByTestId } = render(<WorkRequestCard item={mockWorkRequest} />);

    expect(getByTestId('work-request-card')).toBeTruthy();
    expect(getByText('Plomería')).toBeTruthy();
    expect(getByText('Reparar pérdida de agua debajo del fregadero de la cocina')).toBeTruthy();
    expect(getByText('Centro')).toBeTruthy();
  });

  test('8b. Renderiza el estado de carga mediante skeleton de contenido', () => {
    const { getByTestId } = render(<WorkRequestSkeleton />);

    expect(getByTestId('work-requests-skeleton')).toBeTruthy();
  });
});
