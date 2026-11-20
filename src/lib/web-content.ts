import 'server-only';
import { cache } from 'react';
import { defaultWebContent, type WebContent } from '@/data/web-content';
import { catalogOrigin } from './catalog';
export const getWebContent = cache(async (): Promise<WebContent> => {
  try {
    const response = await fetch(`${catalogOrigin}/api/web-content`, {cache:'no-store', credentials:'omit', signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error('Content unavailable');
    const { content } = await response.json();
    if (content?.version !== 1 || !content.copy || !Array.isArray(content.slides) || !Array.isArray(content.gallery) || !Array.isArray(content.faqs) || !Array.isArray(content.sections)) throw new Error('Invalid content');
    const media = (src: string) => src.startsWith('/api/web-media/') ? `${catalogOrigin}${src}` : src;
    content.images = Object.fromEntries(Object.entries(content.images ?? {}).map(([key,src])=>[key,media(String(src))]));
    content.slides = content.slides.map((item: WebContent['slides'][number])=>({...item,src:media(item.src)}));
    content.gallery = content.gallery.map((item: WebContent['gallery'][number])=>({...item,src:media(item.src)}));
    content.sections = content.sections.map((item: WebContent['sections'][number])=>({...item,image:media(item.image)}));
    return {...content, copy:{...defaultWebContent.copy,...content.copy}, images:{...defaultWebContent.images,...content.images}};
  } catch { return defaultWebContent; }
});
