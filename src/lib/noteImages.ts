export const NOTE_IMAGE_PATTERN = /!\[([^\]\n]*)\]\(([^\s)]+)(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\)/g;

export function isNoteImageUri(uri: string) {
  return (
    /^(https?:\/\/|data:image\/(?:png|jpeg|gif|webp|avif|heic|heif);base64,)/i.test(uri) ||
    /^images\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(uri)
  );
}
