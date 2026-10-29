import { isNoteImageUri } from '@/lib/noteImages';

export async function imageFileData(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Invalid image');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not read image'));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.onabort = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

export function safeImageSource(uri: string): string {
  return isNoteImageUri(uri) ? uri : '';
}

export function externalLink(url: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(url);
}
