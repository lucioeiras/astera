import { createContext } from 'react';

/** Base URI for relative attachments in the currently open library. */
export const LibraryAssetContext = createContext<string | null>(null);
