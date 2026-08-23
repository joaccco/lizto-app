import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { GlassSheet, GlassButton, Input, Text, Badge } from '@/components/ui';
import { PricingMode, isTimeWithinWindow } from '../schemas/offerSchema';

interface OfferSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    pricing_mode: PricingMode;
    proposed_price?: number | null;
    price_range_min?: number | null;
    price_range_max?: number | null;
    proposed_start_at?: string | null;
    estimated_duration_min?: number;
    note?: string;
  }) => Promise<void>;
  windowStart?: string | null;
  windowEnd?: string | null;
  scheduledDate?: string | null;
  loading?: boolean;
}

export const OfferSheet: React.FC<OfferSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  windowStart,
  windowEnd,
  scheduledDate,
  loading = false,
}) => {
  const [pricingMode, setPricingMode] = useState<PricingMode>('quoted');
  const [exactPrice, setExactPrice] = useState('');
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');
  const [proposedTime, setProposedTime] = useState(windowStart || '10:00');
  const [durationMin, setDurationMin] = useState('60');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleFormSubmit = async () => {
    setFormError(null);

    // 1. Validar precio según modalidad
    let parsedPrice: number | null = null;
    let parsedMin: number | null = null;
    let parsedMax: number | null = null;

    if (pricingMode === 'quoted') {
      parsedPrice = parseFloat(exactPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        setFormError('Ingresá un importe válido mayor a $0.');
        return;
      }
    } else {
      parsedMin = parseFloat(rangeMin);
      parsedMax = parseFloat(rangeMax);
      if (isNaN(parsedMin) || isNaN(parsedMax) || parsedMin <= 0 || parsedMax <= 0) {
        setFormError('Ingresá valores de rango estimativo válidos mayor a $0.');
        return;
      }
      if (parsedMin > parsedMax) {
        setFormError('El valor mínimo del rango no puede ser mayor que el máximo.');
        return;
      }
    }

    // 2. Validar ventana horaria (Criterio de Aceptación 3)
    if (windowStart && windowEnd && proposedTime) {
      const isWithin = isTimeWithinWindow(
        `2026-08-25T${proposedTime}:00`,
        windowStart,
        windowEnd
      );
      if (!isWithin) {
        setFormError(
          `El horario propuesto (${proposedTime} hs) está fuera de la ventana solicitada por el cliente (${windowStart} hs - ${windowEnd} hs).`
        );
        return;
      }
    }

    // 3. Formatear timestamp de fecha propuesta
    const targetDateStr = scheduledDate || new Date().toISOString().split('T')[0];
    const proposedIsoDate = `${targetDateStr}T${proposedTime}:00.000Z`;

    try {
      await onSubmit({
        pricing_mode: pricingMode,
        proposed_price: parsedPrice,
        price_range_min: parsedMin,
        price_range_max: parsedMax,
        proposed_start_at: proposedIsoDate,
        estimated_duration_min: parseInt(durationMin, 10) || 60,
        note: note.trim(),
      });
      onClose();
    } catch (err: any) {
      // Preserva los valores ingresados y muestra el error (Criterio de Aceptación 5)
      setFormError(err?.message || 'Ocurrió un error al enviar la oferta. Reintentá.');
    }
  };

  return (
    <GlassSheet visible={visible} onClose={onClose}>
      <ScrollView className="max-h-[80vh]" showsVerticalScrollIndicator={false}>
        <Text variant="h2" weight="bold" className="mb-1">
          Componer Oferta
        </Text>
        <Text variant="caption" muted className="mb-4">
          Propone tus condiciones económicas y estimación para el servicio.
        </Text>

        {/* Banners Informativos de Dominio */}
        <View className="bg-primary/10 border border-primary/30 rounded-2xl p-3 mb-4 space-y-1">
          <Text variant="caption" className="text-primary font-medium">
            💡 Esta oferta es una propuesta estimada y no constituye un acuerdo vinculante hasta ser confirmada.
          </Text>
          <Text variant="caption" muted className="text-xs mt-1">
            📅 El horario propuesto no bloquea tu agenda hasta la reserva mutua.
          </Text>
        </View>

        {/* Form Error Banner */}
        {formError ? (
          <View className="bg-danger/15 border border-danger/30 rounded-2xl p-3 mb-4">
            <Text variant="caption" className="text-danger font-semibold">
              {formError}
            </Text>
          </View>
        ) : null}

        {/* Modalidad de Precio */}
        <View className="mb-5">
          <Text variant="caption" weight="semibold" className="uppercase tracking-wider mb-2">
            Modalidad de Cotización
          </Text>
          <View className="flex-row bg-muted rounded-2xl p-1 border border-border">
            <Pressable
              onPress={() => setPricingMode('quoted')}
              className={`flex-1 py-3 rounded-xl items-center ${
                pricingMode === 'quoted' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                variant="body"
                weight="bold"
                className={pricingMode === 'quoted' ? 'text-foreground' : 'text-muted-foreground'}
              >
                Monto Fijo
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPricingMode('requires_visit')}
              className={`flex-1 py-3 rounded-xl items-center ${
                pricingMode === 'requires_visit' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                variant="body"
                weight="bold"
                className={pricingMode === 'requires_visit' ? 'text-foreground' : 'text-muted-foreground'}
              >
                Visita Técnica
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Campos de Precio según Modalidad */}
        {pricingMode === 'quoted' ? (
          <Input
            label="Importe Propuesto ($ ARS)"
            placeholder="Ej: 18000"
            keyboardType="numeric"
            value={exactPrice}
            onChangeText={setExactPrice}
            containerClassName="mb-4"
            testID="offer-price-input"
          />
        ) : (
          <View className="mb-4">
            <View className="mb-2">
              <Badge variant="warning" label="REQUIERE VISITA TÉCNICA Y DIAGNÓSTICO IN SITU" />
            </View>
            <Text variant="caption" muted className="mb-3">
              Al requerir visita técnica, se comunica al cliente un rango estimado y no un precio cerrado.
            </Text>
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Input
                  label="Estimado Mínimo ($)"
                  placeholder="10000"
                  keyboardType="numeric"
                  value={rangeMin}
                  onChangeText={setRangeMin}
                  testID="offer-range-min-input"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Estimado Máximo ($)"
                  placeholder="25000"
                  keyboardType="numeric"
                  value={rangeMax}
                  onChangeText={setRangeMax}
                  testID="offer-range-max-input"
                />
              </View>
            </View>
          </View>
        )}

        {/* Horario y Duración */}
        <View className="mb-4">
          <Input
            label={`Horario Propuesto (Ventana pedida: ${windowStart || '09:00'} - ${windowEnd || '18:00'} hs)`}
            placeholder="HH:mm (ej: 10:30)"
            value={proposedTime}
            onChangeText={setProposedTime}
            containerClassName="mb-3"
            testID="offer-time-input"
          />

          <Input
            label="Duración Estimada (minutos)"
            placeholder="60"
            keyboardType="numeric"
            value={durationMin}
            onChangeText={setDurationMin}
            containerClassName="mb-4"
            testID="offer-duration-input"
          />
        </View>

        {/* Nota / Condiciones */}
        <Input
          label="Nota o Condiciones (Opcional)"
          placeholder="Ej: Incluye mano de obra y materiales estándar."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
          containerClassName="mb-6"
          testID="offer-note-input"
        />

        {/* Botón de Envío con Protección contra Doble Toque */}
        <GlassButton
          variant={pricingMode === 'requires_visit' ? 'fluor' : 'primary'}
          size="lg"
          onPress={handleFormSubmit}
          loading={loading}
          disabled={loading}
          testID="send-offer-submit-button"
        >
          {pricingMode === 'requires_visit' ? 'Enviar Propuesta con Visita' : 'Enviar Oferta Formal'}
        </GlassButton>
      </ScrollView>
    </GlassSheet>
  );
};
