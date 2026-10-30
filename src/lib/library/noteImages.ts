import { Buffer } from 'buffer';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import {
  generateId,
  getImagesDirectory,
  type LibrarySource,
  type PickedImageAsset,
} from './storage';

/** Store an attachment without creating a separate image card. */
export async function saveNoteImage(
  source: LibrarySource,
  asset: PickedImageAsset
): Promise<string> {
  const data =
    /^data:image\/(png|jpeg|gif|webp|avif|heic|heif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      asset.uri
    );
  if (asset.uri.startsWith('data:') && !data) throw new Error('Invalid image');
  // The browser has no Expo filesystem. Embed bytes rather than keeping a
  // temporary blob URL that would break when the editor is reopened.
  if (Platform.OS === 'web') {
    if (data) return asset.uri;
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error('Could not read image');
    const contentType = response.headers.get('content-type')?.split(';')[0];
    if (!contentType || !/^image\/(png|jpeg|gif|webp|avif|heic|heif)$/.test(contentType)) {
      throw new Error('Invalid image');
    }
    const bytes = await response.arrayBuffer();
    return `data:${contentType};base64,${Buffer.from(bytes).toString('base64')}`;
  }
  const mime = asset.mimeType?.split('/')[1];
  const extension =
    data?.[1] ??
    mime ??
    asset.fileName?.split('.').pop() ??
    asset.uri.split('.').pop()?.split('?')[0];
  const ext =
    extension && /^(png|jpe?g|gif|webp|heic|heif|avif)$/i.test(extension)
      ? extension.toLowerCase()
      : 'jpg';
  const directory = getImagesDirectory(source);
  directory.create({ intermediates: true, idempotent: true });
  const path = `${generateId()}.${ext}`;
  const target = new File(directory, path);
  try {
    if (data) {
      target.create({ overwrite: false });
      target.write(new Uint8Array(Buffer.from(data[2], 'base64')));
    } else {
      const original = new File(asset.uri);
      try {
        await original.copy(target);
      } catch {
        const bytes = await original.arrayBuffer();
        target.create({ overwrite: true });
        target.write(new Uint8Array(bytes));
      }
    }
    return `images/${path}`;
  } catch (error) {
    if (target.exists) target.delete();
    throw error;
  }
}
