import { apiClient } from '@/services/apiClient';
import type { ResourceResponse } from '@/types/api';

export interface LegalDocument {
  id: number;
  slug: string;
  title: string;
  content: string;
  version: number;
  created_at: string | null;
  updated_at: string | null;
}

export function getLegalDocument(slug = 'terms-of-use') {
  return apiClient.get<ResourceResponse<LegalDocument>>(`/legal-documents/${slug}`, {
    auth: false,
  });
}

export function legalHtmlToText(content: string): string {
  return content
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|li|h2|h3|h4|blockquote|ol|ul)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
