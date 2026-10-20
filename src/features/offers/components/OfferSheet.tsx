import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GlassSheet, GlassButton, Input, Text } from '@/components/ui';
import { parseMoneyInput } from '@/core/domain/money';
import { argentinaLocalToInstant, isInstantWithinWindow } from '@/core/domain/time';
import { CreateOfferFormData, PricingMode, createOfferSchema } from '../schemas/offerSchema';

interface OfferSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOfferFormData) => Promise<void>;
  windowStart?: string | null;
  windowEnd?: string | null;
  scheduledDate?: string | null;
  loading?: boolean;
}

export const OfferSheet: React.FC<OfferSheetProps> = ({ visible, onClose, onSubmit, windowStart, windowEnd, scheduledDate, loading = false }) => {
  const { t } = useTranslation();
  const [pricingMode, setPricingMode] = useState<PricingMode>('quoted');
  const [exactPrice, setExactPrice] = useState('');
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');
  const [date, setDate] = useState(scheduledDate ?? '');
  const [proposedTime, setProposedTime] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    setFormError(null);
    let payload: CreateOfferFormData;
    try {
      // Una fecha sin hora puede ser el día solicitado; no constituye un instante propuesto.
      const instant = proposedTime.trim() ? argentinaLocalToInstant(date.trim(), proposedTime.trim()) : undefined;
      if (instant && (windowStart || windowEnd)) {
        if (!windowStart || !windowEnd || !scheduledDate || !isInstantWithinWindow(instant, scheduledDate, windowStart, windowEnd)) {
          setFormError(t('offers.outsideWindow')); return;
        }
      }
      if (durationMin.trim() && !/^\d+$/.test(durationMin.trim())) {
        setFormError(t('offers.invalidDuration')); return;
      }
      payload = createOfferSchema.parse({
        pricing_mode: pricingMode,
        currency_code: 'ARS',
        ...(pricingMode === 'quoted'
          ? { proposed_price: parseMoneyInput(exactPrice) }
          : { price_min: parseMoneyInput(rangeMin), price_max: parseMoneyInput(rangeMax) }),
        proposed_start_at: instant,
        estimated_duration_min: durationMin.trim() ? Number(durationMin) : undefined,
        notes: notes.trim() || undefined,
      });
    } catch {
      setFormError(t('offers.invalidForm')); return;
    }
    try { await onSubmit(payload); onClose(); }
    catch { setFormError(t('offers.sendError')); }
  };

  return <GlassSheet visible={visible} onClose={onClose}>
    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }} keyboardShouldPersistTaps="handled">
      <Text variant="h2" weight="bold">{t('offers.title')}</Text>
      <Text variant="caption" muted className="mb-4">{t('offers.description')}</Text>
      <Text variant="caption" className="mb-4">{t('offers.disclaimer')}</Text>
      {formError ? <Text variant="caption" color="#FF5A5A" className="mb-4" accessibilityRole="alert">{formError}</Text> : null}
      <View className="flex-row gap-2 mb-4">
        {(['quoted', 'requires_visit'] as const).map(mode => <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ selected: pricingMode === mode }} onPress={() => setPricingMode(mode)} className="flex-1 p-3 rounded-xl border border-border">
          <Text weight={pricingMode === mode ? 'bold' : 'regular'}>{t(`offers.mode.${mode}`)}</Text>
        </Pressable>)}
      </View>
      {pricingMode === 'quoted' ? <Input label={t('offers.price')} placeholder={t('offers.pricePlaceholder')} keyboardType="decimal-pad" value={exactPrice} onChangeText={setExactPrice} testID="offer-price-input" containerClassName="mb-4" /> : <>
        <Input label={t('offers.minPrice')} keyboardType="decimal-pad" value={rangeMin} onChangeText={setRangeMin} testID="offer-range-min-input" containerClassName="mb-3" />
        <Input label={t('offers.maxPrice')} keyboardType="decimal-pad" value={rangeMax} onChangeText={setRangeMax} testID="offer-range-max-input" containerClassName="mb-4" />
      </>}
      {windowStart && windowEnd ? <Text variant="caption" className="mb-3">{t('offers.window', { start: windowStart, end: windowEnd, date: scheduledDate ?? t('offers.missingDate') })}</Text> : null}
      <Input label={t('offers.date')} placeholder={t('offers.datePlaceholder')} value={date} onChangeText={setDate} testID="offer-date-input" containerClassName="mb-3" />
      <Input label={t('offers.time')} placeholder={t('offers.timePlaceholder')} value={proposedTime} onChangeText={setProposedTime} testID="offer-time-input" containerClassName="mb-3" />
      <Input label={t('offers.duration')} keyboardType="number-pad" value={durationMin} onChangeText={setDurationMin} testID="offer-duration-input" containerClassName="mb-3" />
      <Input label={t('offers.notes')} value={notes} onChangeText={setNotes} multiline maxLength={1000} testID="offer-note-input" containerClassName="mb-4" />
      <GlassButton size="lg" onPress={() => void submit()} loading={loading} disabled={loading} testID="send-offer-submit-button">{t('offers.submit')}</GlassButton>
    </ScrollView>
  </GlassSheet>;
};
