import type { ImagePickerAsset } from 'expo-image-picker';
import { apiClient } from '@/services/apiClient';
import type {
  Amenity,
  CollectionResponse,
  Property,
  PropertyCategory,
  ResourceResponse,
} from '@/types/api';

export interface PropertyMutationResponse extends ResourceResponse<Property> {
  message?: string;
}

export interface PreparedPropertyImage {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export function getProperty(propertyId: number) {
  return apiClient.get<ResourceResponse<Property>>(`/properties/${propertyId}`);
}

export function getPropertyCategories() {
  return apiClient.get<CollectionResponse<PropertyCategory>>('/property-categories', {
    auth: false,
  });
}

export function getAmenities() {
  return apiClient.get<CollectionResponse<Amenity>>('/amenities', { auth: false });
}

export function createProperty(payload: Record<string, unknown>) {
  return apiClient.post<PropertyMutationResponse>('/properties', payload);
}

export function updateProperty(propertyId: number, payload: Record<string, unknown>) {
  return apiClient.patch<PropertyMutationResponse>(`/properties/${propertyId}`, payload);
}

export function requestPropertyPublication(propertyId: number) {
  return apiClient.post<PropertyMutationResponse>(
    `/properties/${propertyId}/request-publication`,
    {},
  );
}

export function removePropertyPhoto(propertyId: number, photoId: number) {
  return apiClient.delete<PropertyMutationResponse>(
    `/properties/${propertyId}/photos/${photoId}`,
  );
}

export function reorderPropertyPhotos(propertyId: number, photoIds: number[]) {
  return apiClient.patch<PropertyMutationResponse>(`/properties/${propertyId}/photos/order`, {
    photo_ids: photoIds,
  });
}

export function imageAssetName(asset: ImagePickerAsset, index: number): string {
  const extension = asset.mimeType === 'image/png' ? 'png' : 'jpg';
  return asset.fileName?.trim() || `imovel-${Date.now()}-${index}.${extension}`;
}

export async function uploadPropertyPhotos(
  propertyId: number,
  images: PreparedPropertyImage[],
) {
  const form = new FormData();

  images.forEach((image) => {
    const nativeFile = {
      uri: image.uri,
      name: image.name,
      type: image.type,
    } as unknown as Blob;

    form.append('photos[]', nativeFile);
  });

  return apiClient.post<PropertyMutationResponse>(`/properties/${propertyId}/photos`, form);
}
