import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FormProvider,
  useForm,
  type FieldPath,
  type UseFormSetError,
} from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ZodError } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { usePainelStore } from '@/stores/usePainelStore';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Amenity, Property, PropertyCategory } from '@/types/api';
import {
  createProperty,
  getAmenities,
  getProperty,
  getPropertyCategories,
  removePropertyPhoto,
  reorderPropertyPhotos,
  requestPropertyPublication,
  updateProperty,
  uploadPropertyPhotos,
  type PreparedPropertyImage,
} from '../propertyService';
import {
  clearPropertyDraft,
  loadPropertyDraft,
  savePropertyDraft,
} from './propertyDraftStorage';
import {
  addressStepSchema,
  amenitiesStepSchema,
  buildAddressPayload,
  buildDetailsPayload,
  defaultPropertyFormValues,
  detailsStepSchema,
  propertyFormSchema,
  propertyToFormValues,
  type PropertyFormValues,
} from './schema';

const DetailsStep = lazy(() =>
  import('./steps/DetailsStep').then((module) => ({ default: module.DetailsStep })),
);
const AddressStep = lazy(() =>
  import('./steps/AddressStep').then((module) => ({ default: module.AddressStep })),
);
const AmenitiesStep = lazy(() =>
  import('./steps/AmenitiesStep').then((module) => ({ default: module.AmenitiesStep })),
);
const PhotosStep = lazy(() =>
  import('./steps/PhotosStep').then((module) => ({ default: module.PhotosStep })),
);
const ReviewStep = lazy(() =>
  import('./steps/ReviewStep').then((module) => ({ default: module.ReviewStep })),
);

interface PropertyWizardScreenProps {
  propertyId?: number;
}

interface FeedbackState {
  message: string;
  tone: 'success' | 'error';
}

const steps = [
  { id: 'details', label: 'Dados' },
  { id: 'address', label: 'Endereço' },
  { id: 'amenities', label: 'Comodidades' },
  { id: 'photos', label: 'Fotos' },
  { id: 'review', label: 'Publicar' },
] as const;

function applyValidationErrors(
  error: ZodError,
  setError: UseFormSetError<PropertyFormValues>,
): void {
  error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (typeof field === 'string') {
      setError(field as FieldPath<PropertyFormValues>, {
        type: 'validate',
        message: issue.message,
      });
    }
  });
}

function coordinatesMatch(expected: number, actual: number | null): boolean {
  return actual !== null && Math.abs(expected - actual) < 0.000001;
}

function firstInvalidStep(error: ZodError): number {
  const field = error.issues[0]?.path[0];
  if (
    field === 'postal_code' ||
    field === 'address_line' ||
    field === 'address_number' ||
    field === 'neighborhood' ||
    field === 'city' ||
    field === 'state' ||
    field === 'latitude' ||
    field === 'longitude'
  ) {
    return 1;
  }
  if (field === 'amenity_ids') return 2;
  return 0;
}

function StepFallback() {
  return (
    <Card>
      <StateView title="Carregando etapa..." loading />
    </Card>
  );
}

export function PropertyWizardScreen({ propertyId }: PropertyWizardScreenProps) {
  const queryClient = useQueryClient();
  const form = useForm<PropertyFormValues>({
    defaultValues: defaultPropertyFormValues,
    mode: 'onBlur',
  });
  const { clearErrors, getValues, reset, setError } = form;

  const [property, setProperty] = useState<Property | null>(null);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(propertyId ? 4 : 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const showFeedback = useCallback(
    (message: string | null, tone: 'success' | 'error' = 'success') => {
      setFeedback(message ? { message, tone } : null);
    },
    [],
  );

  const isEditMode = propertyId !== undefined;
  const publicationLocked = Boolean(
    property?.is_published ||
      property?.publication_status === 'approved' ||
      property?.publication_status === 'pending_review',
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      showFeedback(null);

      const [categoriesResult, amenitiesResult] = await Promise.allSettled([
        getPropertyCategories(),
        getAmenities(),
      ]);

      if (!active) return;
      setCategories(categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : []);
      setAmenities(amenitiesResult.status === 'fulfilled' ? amenitiesResult.value.data : []);

      try {
        if (propertyId) {
          const response = await getProperty(propertyId);
          if (!active) return;
          setProperty(response.data);
          reset(propertyToFormValues(response.data));
          setMaxUnlockedStep(4);
          return;
        }

        const draft = await loadPropertyDraft();
        if (!active || !draft) return;

        reset(draft.values);
        setCurrentStep(Math.min(Math.max(draft.currentStep, 0), steps.length - 1));
        setMaxUnlockedStep(Math.min(Math.max(draft.maxUnlockedStep, 0), steps.length - 1));

        if (draft.propertyId) {
          try {
            const response = await getProperty(draft.propertyId);
            if (!active) return;
            setProperty(response.data);
            showFeedback('Rascunho recuperado. Continue de onde parou.', 'success');
          } catch {
            await clearPropertyDraft();
            if (!active) return;
            reset(defaultPropertyFormValues);
            setCurrentStep(0);
            setMaxUnlockedStep(0);
          }
        }
      } catch (error) {
        if (active) {
          showFeedback(
            error instanceof Error ? error.message : 'Não foi possível carregar o imóvel.',
            'error',
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [propertyId, reset, showFeedback]);

  async function persistLocalDraft(
    nextStep: number,
    nextProperty: Property,
    nextMaxUnlockedStep: number,
  ) {
    if (isEditMode) return;
    await savePropertyDraft({
      propertyId: nextProperty.id,
      currentStep: nextStep,
      maxUnlockedStep: nextMaxUnlockedStep,
      values: getValues(),
    });
  }

  async function saveDetails() {
    clearErrors();
    const values = getValues();
    const parsed = detailsStepSchema.safeParse(values);
    if (!parsed.success) {
      applyValidationErrors(parsed.error, setError);
      showFeedback('Revise os campos destacados antes de continuar.', 'error');
      return;
    }

    setIsSaving(true);
    showFeedback(null);
    try {
      const id = property?.id ?? propertyId;
      const response = id
        ? await updateProperty(id, buildDetailsPayload(values))
        : await createProperty(buildDetailsPayload(values));
      const nextMax = Math.max(maxUnlockedStep, 1);
      setProperty(response.data);
      setMaxUnlockedStep(nextMax);
      setCurrentStep(1);
      await persistLocalDraft(1, response.data, nextMax);
      showFeedback(response.message ?? 'Dados do imóvel salvos como rascunho.', 'success');
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Erro ao salvar o imóvel.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAddress() {
    if (!property?.id) {
      setCurrentStep(0);
      showFeedback('Salve os dados do imóvel antes de informar o endereço.', 'error');
      return;
    }

    clearErrors();
    const values = getValues();
    const parsed = addressStepSchema.safeParse(values);
    if (!parsed.success) {
      applyValidationErrors(parsed.error, setError);
      showFeedback('Revise o endereço e a posição do pino.', 'error');
      return;
    }

    setIsSaving(true);
    showFeedback(null);
    try {
      const payload = buildAddressPayload(values);
      const response = await updateProperty(property.id, payload);
      if (
        !coordinatesMatch(payload.latitude, response.data.latitude) ||
        !coordinatesMatch(payload.longitude, response.data.longitude)
      ) {
        throw new Error(
          'A API não confirmou as coordenadas. O formulário permaneceu nesta etapa para preservar a posição do pino.',
        );
      }

      const nextMax = Math.max(maxUnlockedStep, 2);
      setProperty(response.data);
      setMaxUnlockedStep(nextMax);
      setCurrentStep(2);
      await persistLocalDraft(2, response.data, nextMax);
      showFeedback(response.message ?? 'Endereço e mapa salvos.', 'success');
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Erro ao salvar o endereço.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAmenities() {
    if (!property?.id) {
      setCurrentStep(0);
      showFeedback('Salve os dados do imóvel antes de escolher comodidades.', 'error');
      return;
    }

    clearErrors();
    const values = getValues();
    const parsed = amenitiesStepSchema.safeParse(values);
    if (!parsed.success) {
      applyValidationErrors(parsed.error, setError);
      return;
    }

    setIsSaving(true);
    showFeedback(null);
    try {
      const response = await updateProperty(property.id, {
        amenity_ids: parsed.data.amenity_ids,
      });
      const nextMax = Math.max(maxUnlockedStep, 3);
      setProperty(response.data);
      setMaxUnlockedStep(nextMax);
      setCurrentStep(3);
      await persistLocalDraft(3, response.data, nextMax);
      showFeedback(response.message ?? 'Comodidades salvas.', 'success');
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Erro ao salvar comodidades.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function continueFromPhotos() {
    if (!property) return;
    const nextMax = Math.max(maxUnlockedStep, 4);
    setMaxUnlockedStep(nextMax);
    setCurrentStep(4);
    await persistLocalDraft(4, property, nextMax);
    showFeedback('Revise o anúncio antes de solicitar a publicação.', 'success');
  }

  async function uploadPhotos(images: PreparedPropertyImage[]) {
    if (!property?.id || images.length === 0) return;
    const limit = property.photo_limit;
    const currentCount = property.photos?.length ?? 0;
    if (limit !== null && currentCount + images.length > limit) {
      showFeedback(`Seu plano permite no máximo ${limit} fotos por imóvel.`, 'error');
      return;
    }

    setIsUploading(true);
    showFeedback(null);
    try {
      const response = await uploadPropertyPhotos(property.id, images);
      setProperty(response.data);
      showFeedback(response.message ?? 'Fotos enviadas com sucesso.', 'success');
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Erro ao enviar fotos.', 'error');
    } finally {
      setIsUploading(false);
    }
  }

  async function removePhoto(photoId: number) {
    if (!property?.id) return;
    setBusyPhotoId(photoId);
    showFeedback(null);
    try {
      const response = await removePropertyPhoto(property.id, photoId);
      setProperty(response.data);
      showFeedback(response.message ?? 'Foto removida.', 'success');
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Erro ao remover a foto.', 'error');
    } finally {
      setBusyPhotoId(null);
    }
  }

  async function movePhoto(photoId: number, direction: -1 | 1) {
    if (!property?.id) return;
    const photos = [...property.photos].sort((left, right) => left.sort_order - right.sort_order);
    const currentIndex = photos.findIndex((photo) => photo.id === photoId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= photos.length) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(currentIndex, 1);
    if (!moved) return;
    reordered.splice(nextIndex, 0, moved);

    setBusyPhotoId(photoId);
    showFeedback(null);
    try {
      const response = await reorderPropertyPhotos(
        property.id,
        reordered.map((photo) => photo.id),
      );
      setProperty(response.data);
      showFeedback(response.message ?? 'Ordem das fotos atualizada.', 'success');
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Erro ao reordenar as fotos.', 'error');
    } finally {
      setBusyPhotoId(null);
    }
  }

  async function publish() {
    if (!property?.id) {
      setCurrentStep(0);
      showFeedback('Salve o rascunho antes de solicitar a publicação.', 'error');
      return;
    }
    if (publicationLocked) {
      showFeedback('Este anúncio já está publicado ou aguardando revisão.', 'error');
      return;
    }

    clearErrors();
    const parsed = propertyFormSchema.safeParse(getValues());
    if (!parsed.success) {
      applyValidationErrors(parsed.error, setError);
      setCurrentStep(firstInvalidStep(parsed.error));
      showFeedback('Existem dados obrigatórios pendentes antes da publicação.', 'error');
      return;
    }

    setIsPublishing(true);
    showFeedback(null);
    try {
      const response = await requestPropertyPublication(property.id);
      setProperty(response.data);
      setMaxUnlockedStep(4);
      await clearPropertyDraft();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['properties'] }),
        queryClient.invalidateQueries({ queryKey: ['property', property.id] }),
        usePainelStore.getState().hydrate(),
      ]);
      showFeedback(
        response.message ?? 'Publicação solicitada. O imóvel foi enviado para revisão.',
        'success',
      );
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : 'Erro ao solicitar a publicação.',
        'error',
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function handlePrimaryAction() {
    if (currentStep === 0) return saveDetails();
    if (currentStep === 1) return saveAddress();
    if (currentStep === 2) return saveAmenities();
    if (currentStep === 3) return continueFromPhotos();
    return publish();
  }

  const primaryLabel = useMemo(() => {
    if (currentStep === 0) return 'Salvar dados e continuar';
    if (currentStep === 1) return 'Salvar endereço e continuar';
    if (currentStep === 2) return 'Salvar comodidades e continuar';
    if (currentStep === 3) return 'Revisar anúncio';
    if (publicationLocked) return 'Publicação em andamento';
    return 'Solicitar publicação';
  }, [currentStep, publicationLocked]);

  if (isLoading) {
    return (
      <Screen>
        <StateView title="Carregando cadastro do imóvel..." loading />
      </Screen>
    );
  }

  return (
    <FormProvider {...form}>
      <Screen>
        <PageHeader
          eyebrow={isEditMode ? 'Editar anúncio' : 'Cadastro de imóvel'}
          title={isEditMode ? property?.title || 'Editar imóvel' : 'Novo anúncio'}
          description="Salve cada etapa como rascunho. A publicação só ocorre depois da revisão."
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepBar}
        >
          {steps.map((step, index) => {
            const active = currentStep === index;
            const unlocked = index <= maxUnlockedStep;
            const completed = index < currentStep || index < maxUnlockedStep;
            return (
              <Pressable
                key={step.id}
                disabled={!unlocked}
                onPress={() => {
                  setCurrentStep(index);
                  showFeedback(null);
                }}
                style={[
                  styles.step,
                  active && styles.stepActive,
                  !unlocked && styles.stepLocked,
                ]}
              >
                <View style={[styles.stepNumber, (active || completed) && styles.stepNumberActive]}>
                  <Text
                    style={[
                      styles.stepNumberText,
                      (active || completed) && styles.stepNumberTextActive,
                    ]}
                  >
                    {completed ? '✓' : index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                  {step.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {feedback ? (
          <Card style={feedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess}>
            <Text
              style={
                feedback.tone === 'error' ? styles.feedbackErrorText : styles.feedbackSuccessText
              }
            >
              {feedback.message}
            </Text>
          </Card>
        ) : null}

        <Suspense fallback={<StepFallback />}>
          {currentStep === 0 ? <DetailsStep categories={categories} /> : null}
          {currentStep === 1 ? <AddressStep onFeedback={showFeedback} /> : null}
          {currentStep === 2 ? <AmenitiesStep amenities={amenities} /> : null}
          {currentStep === 3 && property ? (
            <PhotosStep
              property={property}
              isUploading={isUploading}
              busyPhotoId={busyPhotoId}
              onUpload={uploadPhotos}
              onRemove={removePhoto}
              onMove={movePhoto}
              onFeedback={showFeedback}
            />
          ) : null}
          {currentStep === 4 && property ? (
            <ReviewStep values={getValues()} property={property} categories={categories} />
          ) : null}
        </Suspense>

        <View style={styles.footerActions}>
          {currentStep > 0 ? (
            <Button
              label="Voltar"
              variant="secondary"
              disabled={isSaving || isUploading || isPublishing}
              onPress={() => {
                setCurrentStep((value) => Math.max(value - 1, 0));
                showFeedback(null);
              }}
              style={styles.footerButton}
            />
          ) : null}
          <Button
            label={primaryLabel}
            loading={isSaving || isPublishing}
            disabled={isUploading || (currentStep === 4 && publicationLocked)}
            onPress={() => void handlePrimaryAction()}
            style={styles.footerButton}
          />
        </View>

        <Button
          label="Voltar para meus imóveis"
          variant="secondary"
          onPress={() => router.replace('/painel/imoveis')}
        />
      </Screen>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  stepBar: { gap: spacing.sm, paddingRight: spacing.md },
  step: {
    minWidth: 104,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EAF3',
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepActive: { borderColor: '#CAD8FF', backgroundColor: '#F6F9FF' },
  stepLocked: { opacity: 0.45 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberActive: { backgroundColor: colors.brand },
  stepNumberText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  stepNumberTextActive: { color: colors.white },
  stepLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  stepLabelActive: { color: colors.brandDark },
  feedbackSuccess: { borderColor: '#B7E5C9', backgroundColor: '#F3FCF6' },
  feedbackSuccessText: { color: '#027A48', fontSize: 13, fontWeight: '700' },
  feedbackError: { borderColor: '#F5C3BD', backgroundColor: '#FFF7F6' },
  feedbackErrorText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  footerActions: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1, paddingHorizontal: spacing.sm },
});
