import { useAppTheme } from '@/lib/theme';
import { FlashList, type FlashListRef, type ListRenderItemInfo } from '@shopify/flash-list';
import { BlurTargetView } from 'expo-blur';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { PlusIcon, WarningIcon } from 'phosphor-react-native';
import Sortable from 'react-native-sortables';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoardAddModals } from '@/components/board/BoardAddModals';
import { BoardPinnedItems } from '@/components/board/BoardPinnedItems';
import { BoardTypeFilters } from '@/components/board/BoardTypeFilters';
import { Button } from '@/components/Button';
import { ItemCard } from '@/components/cards/ItemCard';
import { CardSelectionBar } from '@/components/menus/CardSelectionBar';
import {
  clearOverlayIfCurrent,
  useFloatingTabOverlay,
} from '@/components/menus/FloatingTabOverlay';
import { RestoreToast } from '@/components/menus/RestoreToast';
import { SearchBar } from '@/components/menus/SearchBar';
import { useLibrary } from '@/hooks/useLibrary';
import { CARD_TYPE_LABELS, matchesAddedDay, parseDayKey } from '@/lib/library/activity';
import { parseAudioWaveform } from '@/lib/library/audioWaveform';
import { isLinkableItem, type LinkableItem } from '@/lib/library/links';
import { matchesStatus, STATUS_FOLDERS } from '@/lib/library/organize';
import { getPinnedItems, MAX_PINNED_ITEMS, movePinnedItem } from '@/lib/library/pinned';
import type {
  DeletedItemBackup,
  PickedAudioAsset,
  PickedImageAsset,
  PickedPdfAsset,
  PickedVideoAsset,
} from '@/lib/library/storage';
import type { MediaProgressStatus } from '@/lib/library/types';
import { type LibraryItem, type LibraryItemType } from '@/lib/library/types';
import { LocalizedText } from '@/components/LocalizedText';
import { translate, useLocalization } from '@/lib/i18n';

type BoardGridContextType = {
  lastIndices: { col0: number; col1: number };
  totalItems: number;
  reportItemCol: (index: number, col: number) => void;
};

type AddControlItem =
  | 'note'
  | 'link'
  | 'book'
  | 'music'
  | 'movie'
  | 'tvshow'
  | 'game'
  | 'image'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'all';

type AddControlAction = {
  item: AddControlItem;
  token?: string;
  imageAsset?: PickedImageAsset;
  pdfAsset?: PickedPdfAsset;
};

const BoardGridContext = createContext<BoardGridContextType>({
  lastIndices: { col0: -1, col1: -1 },
  totalItems: 0,
  reportItemCol: () => {},
});

export default function BoardScreen() {
  const { colors: themeColors } = useAppTheme();
  const { language } = useLocalization();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const boardListRef = useRef<FlashListRef<LibraryItem>>(null);
  const {
    state,
    refresh,
    refreshing,
    deleteItems,
    restoreItems,
    searchItems,
    searchQuery,
    searchTag,
    searchType,
    setSearchQuery,
    clearSearchTag,
    updateItem,
    updateItems,
    setItemsPinned,
  } = useLibrary();
  const searchBlurTargetRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const setFloatingTabOverlay = useFloatingTabOverlay();
  const {
    newNote,
    newLink,
    newBook,
    newMusic,
    newMovie,
    newTvShow,
    newGame,
    newEntertainment,
    newImageUri,
    newImageFileName,
    newImageMimeType,
    newImageTimestamp,
    newPdfUri,
    newPdfFileName,
    newPdfTimestamp,
    newVideoUri,
    newVideoFileName,
    newVideoFileSize,
    newVideoTimestamp,
    newAudioUri,
    newAudioDuration,
    newAudioWaveform,
    newAudioTimestamp,
    controlAddItem,
    controlToken,
    folderKind,
    folderKey,
    addedOn,
    activityToken,
  } = useLocalSearchParams<{
    newNote?: string;
    newLink?: string;
    newBook?: string;
    newMusic?: string;
    newMovie?: string;
    newTvShow?: string;
    newGame?: string;
    newEntertainment?: string;
    newImageUri?: string;
    newImageFileName?: string;
    newImageMimeType?: string;
    newImageTimestamp?: string;
    newPdfUri?: string;
    newPdfFileName?: string;
    newPdfTimestamp?: string;
    newVideoUri?: string;
    newVideoFileName?: string;
    newVideoFileSize?: string;
    newVideoTimestamp?: string;
    newAudioUri?: string;
    newAudioDuration?: string;
    newAudioWaveform?: string;
    newAudioTimestamp?: string;
    controlAddItem?: AddControlItem;
    controlToken?: string;
    addedOn?: string;
    activityToken?: string;
    folderKind?: 'status' | 'tag';
    folderKey?: string;
  }>();
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [isTvShowModalOpen, setIsTvShowModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isEntertainmentModalOpen, setIsEntertainmentModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<PickedImageAsset | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pendingPdf, setPendingPdf] = useState<PickedPdfAsset | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<PickedVideoAsset | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<PickedAudioAsset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [optimisticPinnedOrder, setOptimisticPinnedOrder] = useState<string[] | null>(null);
  const [restoreBackup, setRestoreBackup] = useState<DeletedItemBackup[] | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<{
    type: LibraryItemType;
    folderId: string;
  } | null>(null);
  const addedDate = parseDayKey(addedOn);
  const activeDay = addedDate ? addedOn : null;
  const clearDateFilter = useCallback(() => router.setParams({ addedOn: '' }), []);
  const activeFolderKind =
    folderKey && (folderKind === 'status' || folderKind === 'tag') ? folderKind : null;
  const activeFolderKey = activeFolderKind ? folderKey : null;
  const folderLabel =
    activeFolderKind === 'status'
      ? translate(STATUS_FOLDERS.find((folder) => folder.key === activeFolderKey)?.title ?? '')
      : activeFolderKey;

  const clearFolderFilter = useCallback(() => {
    setSelectedType(null);
    router.setParams({ folderKind: '', folderKey: '' });
  }, []);
  const handleSearchChange = useCallback((text: string) => setSearchQuery(text), [setSearchQuery]);
  const itemColsRef = useRef<Map<number, number>>(new Map());
  const [lastIndices, setLastIndices] = useState<{
    col0: number;
    col1: number;
  }>({
    col0: -1,
    col1: -1,
  });
  const lastOpenedNoteRef = useRef<string | null>(null);
  const lastOpenedLinkRef = useRef<string | null>(null);
  const lastOpenedBookRef = useRef<string | null>(null);
  const lastOpenedMusicRef = useRef<string | null>(null);
  const lastOpenedMovieRef = useRef<string | null>(null);
  const lastOpenedTvShowRef = useRef<string | null>(null);
  const lastOpenedGameRef = useRef<string | null>(null);
  const lastOpenedEntertainmentRef = useRef<string | null>(null);
  const lastOpenedImageRef = useRef<string | null>(null);
  const lastOpenedPdfRef = useRef<string | null>(null);
  const lastOpenedVideoRef = useRef<string | null>(null);
  const lastOpenedAudioRef = useRef<string | null>(null);
  const lastOpenedControlRef = useRef<string | null>(null);

  const activeAddModalRef = useRef<Exclude<AddControlItem, 'all'> | null>(null);
  const queuedControlActionRef = useRef<AddControlAction | null>(null);

  const openControlAction = useCallback((action: AddControlAction) => {
    if (action.item === 'all') {
      activeAddModalRef.current = null;
      router.replace('/add');
      return;
    }

    activeAddModalRef.current = action.item;
    switch (action.item) {
      case 'note':
        setIsNoteDrawerOpen(true);
        break;
      case 'link':
        setIsLinkModalOpen(true);
        break;
      case 'book':
        setIsBookModalOpen(true);
        break;
      case 'music':
        setIsMusicModalOpen(true);
        break;
      case 'movie':
        setIsMovieModalOpen(true);
        break;
      case 'tvshow':
        setIsTvShowModalOpen(true);
        break;
      case 'game':
        setIsGameModalOpen(true);
        break;
      case 'image':
        if (!action.imageAsset) {
          activeAddModalRef.current = null;
          router.replace({
            pathname: '/add',
            params: {
              controlItem: 'image',
              controlToken: action.token ?? Date.now().toString(),
            },
          });
          break;
        }
        setPendingImage(action.imageAsset ?? null);
        setIsImageModalOpen(true);
        break;
      case 'pdf':
        if (!action.pdfAsset) {
          activeAddModalRef.current = null;
          router.replace({
            pathname: '/add',
            params: {
              controlItem: 'pdf',
              controlToken: action.token ?? Date.now().toString(),
            },
          });
          break;
        }
        setPendingPdf(action.pdfAsset ?? null);
        setIsPdfModalOpen(true);
        break;
      case 'video':
        activeAddModalRef.current = null;
        router.replace({
          pathname: '/add',
          params: {
            controlItem: 'video',
            controlToken: action.token ?? Date.now().toString(),
          },
        });
        break;
      case 'audio':
        activeAddModalRef.current = null;
        router.replace({
          pathname: '/add',
          params: {
            controlItem: 'audio',
            controlToken: action.token ?? Date.now().toString(),
          },
        });
        break;
    }
  }, []);

  const requestControlAction = useCallback(
    (action: AddControlAction) => {
      if (!activeAddModalRef.current) {
        openControlAction(action);
        return;
      }

      queuedControlActionRef.current = action;
      setIsNoteDrawerOpen(false);
      setIsLinkModalOpen(false);
      setIsBookModalOpen(false);
      setIsMusicModalOpen(false);
      setIsMovieModalOpen(false);
      setIsGameModalOpen(false);
      setIsEntertainmentModalOpen(false);
      setIsImageModalOpen(false);
      setIsPdfModalOpen(false);
      setIsVideoModalOpen(false);
      setIsAudioModalOpen(false);
    },
    [openControlAction]
  );

  const handleAddModalDismiss = useCallback(() => {
    activeAddModalRef.current = null;
    const queuedAction = queuedControlActionRef.current;
    if (!queuedAction) return;

    queuedControlActionRef.current = null;
    openControlAction(queuedAction);
  }, [openControlAction]);

  const closeAddModal = useCallback((item: Exclude<AddControlItem, 'all'>) => {
    if (!queuedControlActionRef.current) {
      activeAddModalRef.current = null;
    }

    switch (item) {
      case 'note':
        setIsNoteDrawerOpen(false);
        break;
      case 'link':
        setIsLinkModalOpen(false);
        break;
      case 'book':
        setIsBookModalOpen(false);
        break;
      case 'music':
        setIsMusicModalOpen(false);
        break;
      case 'movie':
        setIsMovieModalOpen(false);
        break;
      case 'tvshow':
        setIsTvShowModalOpen(false);
        break;
      case 'game':
        setIsGameModalOpen(false);
        break;
      case 'image':
        setIsImageModalOpen(false);
        setPendingImage(null);
        break;
      case 'pdf':
        setIsPdfModalOpen(false);
        setPendingPdf(null);
        break;
      case 'video':
        setIsVideoModalOpen(false);
        setPendingVideo(null);
        break;
      case 'audio':
        setIsAudioModalOpen(false);
        setPendingAudio(null);
        break;
    }
  }, []);

  useEffect(() => {
    const token = newAudioTimestamp || newAudioUri;
    if (!newAudioUri || !token || token === lastOpenedAudioRef.current) return;
    lastOpenedAudioRef.current = token;
    activeAddModalRef.current = 'audio';
    let waveform: number[] | undefined;
    try {
      waveform = parseAudioWaveform(newAudioWaveform ? JSON.parse(newAudioWaveform) : undefined);
    } catch {
      waveform = undefined;
    }
    setPendingAudio({
      uri: newAudioUri,
      durationMs: Number(newAudioDuration) || undefined,
      waveform,
    });
    setIsAudioModalOpen(true);
  }, [newAudioUri, newAudioDuration, newAudioWaveform, newAudioTimestamp]);

  useEffect(() => {
    if (!controlAddItem || !controlToken) return;
    const requestKey = `${controlAddItem}:${controlToken}`;
    if (requestKey === lastOpenedControlRef.current) return;
    lastOpenedControlRef.current = requestKey;
    requestControlAction({ item: controlAddItem, token: controlToken });
  }, [controlAddItem, controlToken, requestControlAction]);

  useEffect(() => {
    if (newNote && newNote !== lastOpenedNoteRef.current) {
      lastOpenedNoteRef.current = newNote;
      requestControlAction({ item: 'note' });
    }
  }, [newNote, requestControlAction]);

  useEffect(() => {
    if (newLink && newLink !== lastOpenedLinkRef.current) {
      lastOpenedLinkRef.current = newLink;
      requestControlAction({ item: 'link' });
    }
  }, [newLink, requestControlAction]);

  useEffect(() => {
    if (newBook && newBook !== lastOpenedBookRef.current) {
      lastOpenedBookRef.current = newBook;
      requestControlAction({ item: 'book' });
    }
  }, [newBook, requestControlAction]);

  useEffect(() => {
    if (newMusic && newMusic !== lastOpenedMusicRef.current) {
      lastOpenedMusicRef.current = newMusic;
      requestControlAction({ item: 'music' });
    }
  }, [newMusic, requestControlAction]);

  useEffect(() => {
    if (newMovie && newMovie !== lastOpenedMovieRef.current) {
      lastOpenedMovieRef.current = newMovie;
      requestControlAction({ item: 'movie' });
    }
  }, [newMovie, requestControlAction]);

  useEffect(() => {
    if (newTvShow && newTvShow !== lastOpenedTvShowRef.current) {
      lastOpenedTvShowRef.current = newTvShow;
      requestControlAction({ item: 'tvshow' });
    }
  }, [newTvShow, requestControlAction]);

  useEffect(() => {
    if (newGame && newGame !== lastOpenedGameRef.current) {
      lastOpenedGameRef.current = newGame;
      requestControlAction({ item: 'game' });
    }
  }, [newGame, requestControlAction]);

  useEffect(() => {
    if (newEntertainment && newEntertainment !== lastOpenedEntertainmentRef.current) {
      lastOpenedEntertainmentRef.current = newEntertainment;
      activeAddModalRef.current = 'book';
      setIsEntertainmentModalOpen(true);
    }
  }, [newEntertainment]);

  useEffect(() => {
    const pdfToken = newPdfTimestamp || newPdfUri;
    if (newPdfUri && pdfToken && pdfToken !== lastOpenedPdfRef.current) {
      lastOpenedPdfRef.current = pdfToken;
      requestControlAction({
        item: 'pdf',
        pdfAsset: { uri: newPdfUri, fileName: newPdfFileName },
      });
    }
  }, [newPdfUri, newPdfFileName, newPdfTimestamp, requestControlAction]);

  useEffect(() => {
    const imageToken = newImageTimestamp || newImageUri;
    if (newImageUri && imageToken && imageToken !== lastOpenedImageRef.current) {
      lastOpenedImageRef.current = imageToken;
      requestControlAction({
        item: 'image',
        imageAsset: {
          uri: newImageUri,
          fileName: newImageFileName,
          mimeType: newImageMimeType,
        },
      });
    }
  }, [newImageUri, newImageFileName, newImageMimeType, newImageTimestamp, requestControlAction]);

  useEffect(() => {
    const token = newVideoTimestamp || newVideoUri;
    if (!newVideoUri || !token || token === lastOpenedVideoRef.current) return;
    lastOpenedVideoRef.current = token;
    activeAddModalRef.current = 'video';
    setPendingVideo({
      uri: newVideoUri,
      fileName: newVideoFileName,
      fileSize: Number(newVideoFileSize) || undefined,
    });
    setIsVideoModalOpen(true);
  }, [newVideoUri, newVideoFileName, newVideoFileSize, newVideoTimestamp]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const toggleCardSelection = useCallback((itemId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleCardLongPress = useCallback(
    (item: LibraryItem) => {
      if (!isEditing) {
        setIsEditing(true);
        setSelectedCardIds(new Set([item.id]));
      } else {
        toggleCardSelection(item.id);
      }
    },
    [isEditing, toggleCardSelection]
  );

  const handleCardPress = useCallback(
    (item: LibraryItem) => {
      if (isEditing) {
        toggleCardSelection(item.id);
      } else {
        router.push({
          pathname: '/card/[id]',
          params: { id: item.id },
        });
      }
    },
    [isEditing, toggleCardSelection]
  );

  const handleCancelEdition = useCallback(() => {
    setIsEditing(false);
    setSelectedCardIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const idsToDelete = Array.from(selectedCardIds);
    if (idsToDelete.length === 0) return;

    try {
      setIsEditing(false);
      setSelectedCardIds(new Set());

      const backups = await deleteItems(idsToDelete);

      if (backups.length > 0) {
        setRestoreBackup(backups);
        setIsToastVisible(true);
      }
    } catch (error) {
      console.error('Failed to delete cards:', error);
      Alert.alert(
        translate('Error'),
        error instanceof Error ? error.message : 'Failed to delete cards'
      );
    }
  }, [deleteItems, selectedCardIds]);

  const handleRestore = useCallback(async () => {
    if (!restoreBackup || restoreBackup.length === 0) return;
    try {
      const backups = restoreBackup;
      setIsToastVisible(false);
      setRestoreBackup(null);
      await restoreItems(backups);
    } catch (error) {
      console.error('Failed to restore cards:', error);
      Alert.alert(
        translate('Error'),
        error instanceof Error ? error.message : 'Failed to restore cards'
      );
    }
  }, [restoreBackup, restoreItems]);

  const handleDismissToast = useCallback(() => {
    setIsToastVisible(false);
    setRestoreBackup(null);
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const folderId = `${activeFolderKind ? `${activeFolderKind}:${activeFolderKey}` : ''}:${activityToken ?? ''}`;
  const activeType = searchType ?? (selectedType?.folderId === folderId ? selectedType.type : null);
  const hasActiveFilter =
    isSearching ||
    activeType !== null ||
    activeFolderKind !== null ||
    searchTag !== null ||
    activeDay !== null;

  const handleTypeFilter = useCallback(
    (type: LibraryItemType) => {
      if (searchType) setSearchQuery('');
      setSelectedType(activeType === type ? null : { type, folderId });
    },
    [activeType, folderId, searchType, setSearchQuery]
  );

  const displayedItems = useMemo(() => {
    if (state.status !== 'ready') return [];
    if (!hasActiveFilter) return state.result.items;
    const matches =
      activeType || (isSearching && !searchType)
        ? searchItems({
            ...(activeType ? { type: activeType } : {}),
            ...(isSearching && !searchType ? { searchQuery } : {}),
          })
        : state.result.items;
    return matches.filter(
      (item) =>
        (!activeDay || matchesAddedDay(item, activeDay)) &&
        (!searchTag || item.tags?.some((tag) => tag.trim() === searchTag)) &&
        (activeFolderKind !== 'status' ||
          matchesStatus(item, activeFolderKey as MediaProgressStatus)) &&
        (activeFolderKind !== 'tag' || item.tags?.some((tag) => tag.trim() === activeFolderKey))
    );
  }, [
    state,
    hasActiveFilter,
    activeDay,
    activeType,
    isSearching,
    searchQuery,
    searchType,
    searchTag,
    searchItems,
    activeFolderKind,
    activeFolderKey,
  ]);

  const selectedItems = useMemo(
    () =>
      state.status === 'ready'
        ? state.result.items.filter((item) => selectedCardIds.has(item.id))
        : [],
    [state, selectedCardIds]
  );

  const persistedPinnedItems = useMemo(
    () => (state.status === 'ready' ? getPinnedItems(state.result.items) : []),
    [state]
  );
  const pinnedItems = useMemo(() => {
    if (!optimisticPinnedOrder) return persistedPinnedItems;
    const itemsById = new Map(persistedPinnedItems.map((item) => [item.id, item]));
    const reordered = optimisticPinnedOrder
      .map((itemId) => itemsById.get(itemId))
      .filter((item): item is LibraryItem => Boolean(item));
    const includedIds = new Set(reordered.map((item) => item.id));
    return [...reordered, ...persistedPinnedItems.filter((item) => !includedIds.has(item.id))];
  }, [optimisticPinnedOrder, persistedPinnedItems]);

  const selectedPinnedCount = selectedItems.filter((item) => item.pinnedAt).length;
  const selectedUnpinnedCount = selectedItems.length - selectedPinnedCount;
  const canPinSelected =
    selectedUnpinnedCount > 0 && pinnedItems.length + selectedUnpinnedCount <= MAX_PINNED_ITEMS;
  const pinActionLabel = canPinSelected
    ? 'Pin selected cards'
    : selectedPinnedCount > 0
      ? 'Unpin selected cards'
      : undefined;

  const handleToggleSelectedPins = useCallback(async () => {
    if (!pinActionLabel) return;
    try {
      const succeeded = await setItemsPinned(
        Array.from(selectedCardIds),
        pinActionLabel === 'Pin selected cards'
      );
      if (!succeeded) Alert.alert(translate('Could not update pinned cards'));
      else if (pinActionLabel === 'Pin selected cards') {
        handleCancelEdition();
        boardListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      Alert.alert(
        translate('Error'),
        error instanceof Error ? error.message : 'Could not update pinned cards'
      );
    }
  }, [handleCancelEdition, pinActionLabel, selectedCardIds, setItemsPinned]);

  const handleReorderPinnedItem = useCallback(
    async (itemId: string, targetIndex: number) => {
      const reordered = movePinnedItem(pinnedItems, itemId, targetIndex);
      if (reordered.every((item, index) => item.id === pinnedItems[index]?.id)) return;
      setOptimisticPinnedOrder(reordered.map((item) => item.id));
      const firstPinnedAt = Date.now();
      try {
        await updateItems(
          reordered.map((item, index) => ({
            itemId: item.id,
            updates: {
              pinnedAt: new Date(firstPinnedAt + index).toISOString(),
            },
          }))
        );
      } catch (error) {
        Alert.alert(
          translate('Error'),
          error instanceof Error ? error.message : 'Could not reorder pinned cards'
        );
      } finally {
        setOptimisticPinnedOrder(null);
      }
    },
    [pinnedItems, updateItems]
  );

  const handleRemovePinnedItem = useCallback(
    async (itemId: string) => {
      try {
        const succeeded = await setItemsPinned([itemId], false);
        if (!succeeded) Alert.alert(translate('Could not remove pinned card'));
      } catch (error) {
        Alert.alert(
          translate('Error'),
          error instanceof Error ? error.message : 'Could not remove pinned card'
        );
      }
    },
    [setItemsPinned]
  );

  const reportItemCol = useCallback(
    (index: number, col: number) => {
      itemColsRef.current.set(index, col);
      const total = displayedItems.length;
      if (total === 0) return;

      if (index >= total - 2) {
        let col0 = -1;
        let col1 = -1;
        for (let i = total - 1; i >= 0; i--) {
          const c = itemColsRef.current.get(i);
          if (c === 0 && col0 === -1) col0 = i;
          if (c === 1 && col1 === -1) col1 = i;
          if (col0 !== -1 && col1 !== -1) break;
        }

        setLastIndices((prev) => {
          if (prev.col0 === col0 && prev.col1 === col1) return prev;
          return { col0, col1 };
        });
      }
    },
    [displayedItems.length]
  );

  const gridContextValue = useMemo(
    () => ({
      lastIndices,
      totalItems: displayedItems.length,
      reportItemCol,
    }),
    [lastIndices, displayedItems.length, reportItemCol]
  );

  const extraData = useMemo(
    () => ({
      isEditing,
      selectedCardIds,
      searchQuery,
      libraryState: state,
      lastIndices,
      totalItems: displayedItems.length,
    }),
    [isEditing, selectedCardIds, searchQuery, lastIndices, displayedItems.length, state]
  );

  const linkableItems = useMemo(() => {
    const linkedItems = new Map<string, LinkableItem>();
    if (state.status === 'ready') {
      for (const item of state.result.items) {
        if (isLinkableItem(item)) linkedItems.set(item.id, item);
      }
    }
    return linkedItems;
  }, [state]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LibraryItem>) => (
      <View style={styles.cardWrapper}>
        <ItemCard
          item={item}
          compactAudioWaveform
          linkedItem={
            (item.type === 'note' || item.type === 'quote') && item.linkedItemId
              ? linkableItems.get(item.linkedItemId)
              : undefined
          }
          isEditing={isEditing}
          onNoteTextChange={(itemId, text) => {
            updateItem(itemId, { text } as Partial<LibraryItem>).catch((error) => {
              Alert.alert(
                translate('Error'),
                error instanceof Error ? error.message : 'Could not update note'
              );
            });
          }}
          isSelected={selectedCardIds.has(item.id)}
          onPress={handleCardPress}
          onLongPress={handleCardLongPress}
        />
      </View>
    ),
    [isEditing, selectedCardIds, handleCardPress, handleCardLongPress, linkableItems, updateItem]
  );

  const renderHeader = useCallback(() => {
    if (state.status !== 'ready') return null;
    const hasIssues = state.result.issues.length > 0;
    const hasDownloads = state.result.pendingDownloads > 0;

    return (
      <View className="pb-2" style={{ zIndex: 100, elevation: 100 }}>
        <BoardTypeFilters selectedType={activeType} onSelect={handleTypeFilter} />

        {!hasActiveFilter && pinnedItems.length > 0 && (
          <BoardPinnedItems
            items={pinnedItems}
            isEditing={isEditing}
            onPress={handleCardPress}
            onReorder={handleReorderPinnedItem}
            onRemove={handleRemovePinnedItem}
          />
        )}

        {hasIssues && (
          <View className="mb-4 flex-row gap-2 rounded-xl bg-theme-amber/10 p-3">
            <WarningIcon size={16} color={themeColors.amber} weight="fill" />
            <Text className="flex-1 font-sans text-xs text-theme-amber">
              {state.result.issues.length} <LocalizedText>file(s) skipped:</LocalizedText>{' '}
              {state.result.issues.map((i) => `${i.file} (${i.reason})`).join(', ')}
            </Text>
          </View>
        )}

        {hasDownloads && (
          <Text className="mb-4 font-sans text-xs text-theme-muted">
            {state.result.pendingDownloads}{' '}
            <LocalizedText>item(s) still downloading from iCloud…</LocalizedText>
          </Text>
        )}
      </View>
    );
  }, [
    state,
    activeType,
    handleTypeFilter,
    hasActiveFilter,
    pinnedItems,
    isEditing,
    handleCardPress,
    handleReorderPinnedItem,
    handleRemovePinnedItem,
    themeColors.amber,
  ]);

  const renderEmpty = useCallback(() => {
    if (hasActiveFilter) {
      const typeLabel = activeType ? translate(CARD_TYPE_LABELS[activeType]).toLowerCase() : null;
      const queryLabel = isSearching && !searchType ? searchQuery.trim() : null;
      return (
        <Centered
          title={translate('No results found')}
          message={
            activeDay
              ? translate('No cards added on %{date} match your filters', {
                  date: parseDayKey(activeDay)?.toLocaleDateString(locale) ?? '',
                })
              : typeLabel
                ? translate(queryLabel ? 'No %{type} matching "%{query}"' : 'No %{type}', {
                    type: typeLabel,
                    query: queryLabel ?? '',
                  })
                : activeFolderKind
                  ? translate(
                      searchTag && queryLabel
                        ? 'No cards in %{folder} with tag #%{tag} matching "%{query}"'
                        : searchTag
                          ? 'No cards in %{folder} with tag #%{tag}'
                          : queryLabel
                            ? 'No cards in %{folder} matching "%{query}"'
                            : 'No cards in %{folder}',
                      {
                        folder: folderLabel ?? translate('this folder'),
                        tag: searchTag ?? '',
                        query: queryLabel ?? '',
                      }
                    )
                  : searchTag
                    ? translate(
                        queryLabel
                          ? 'No cards with tag #%{tag} matching "%{query}"'
                          : 'No cards with tag #%{tag}',
                        { tag: searchTag, query: queryLabel ?? '' }
                      )
                    : translate('No cards matching "%{query}"', {
                        query: queryLabel ?? '',
                      })
          }
        >
          <Pressable
            onPress={() => {
              setSearchQuery('');
              clearSearchTag();
              setSelectedType(null);
              clearFolderFilter();
              clearDateFilter();
            }}
            className="mt-6 rounded-full bg-theme-raised px-5 py-2.5 active:opacity-80"
          >
            <Text className="font-sans-medium text-sm text-theme-heading">
              <LocalizedText>Clear filters</LocalizedText>
            </Text>
          </Pressable>
        </Centered>
      );
    }

    return (
      <Centered
        title={translate('You can add anything here')}
        message={translate('This board is yours to save anything you want')}
      >
        <Pressable
          onPress={() => router.push('/add')}
          className="mt-8 flex-row items-center justify-center gap-2 rounded-full bg-theme-foreground px-5 py-3"
        >
          <PlusIcon size={18} color={themeColors.inverse} />
          <Text className="font-sans-semibold text-base text-theme-inverse">
            <LocalizedText>Add new item</LocalizedText>
          </Text>
        </Pressable>
      </Centered>
    );
  }, [
    hasActiveFilter,
    activeDay,
    activeType,
    isSearching,
    searchType,
    searchQuery,
    searchTag,
    setSearchQuery,
    clearSearchTag,
    activeFolderKind,
    folderLabel,
    clearFolderFilter,
    clearDateFilter,
    locale,
    themeColors.inverse,
  ]);

  useFocusEffect(
    useCallback(() => {
      const overlay = (
        <>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            blurTarget={searchBlurTargetRef}
            bottomOffset={48 + insets.bottom}
            trailingAction={
              <Button
                accessibilityLabel={translate('Add new item')}
                variant="primary"
                shadowColor={themeColors.foreground}
                shadowOpacity={0.24}
                icon={<PlusIcon size={24} color={themeColors.canvas} weight="bold" />}
                onPress={() => router.push('/add')}
              />
            }
            filters={[
              ...(activeDay
                ? [
                    {
                      kind: 'date' as const,
                      label: parseDayKey(activeDay)!.toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'numeric',
                      }),
                      onRemove: clearDateFilter,
                    },
                  ]
                : []),
              ...(activeFolderKind
                ? [
                    {
                      kind: 'folder' as const,
                      label: folderLabel ?? activeFolderKey ?? '',
                      status:
                        activeFolderKind === 'status'
                          ? (activeFolderKey as MediaProgressStatus)
                          : undefined,
                      onRemove: clearFolderFilter,
                    },
                  ]
                : []),
              ...(searchTag
                ? [
                    {
                      kind: 'tag' as const,
                      label: searchTag,
                      onRemove: clearSearchTag,
                    },
                  ]
                : []),
            ]}
            visible={state.status === 'ready' && !isEditing}
          />
          <CardSelectionBar
            visible={isEditing}
            selectedCount={selectedCardIds.size}
            bottomOffset={60 + insets.bottom}
            onDelete={handleDeleteSelected}
            onAddToFolder={() => setIsFolderPickerOpen(true)}
            pinActionLabel={pinActionLabel}
            onTogglePin={handleToggleSelectedPins}
            onCancel={handleCancelEdition}
          />
          <RestoreToast
            visible={isToastVisible && !isEditing}
            count={restoreBackup?.length ?? 0}
            bottomOffset={130 + insets.bottom}
            onRestore={handleRestore}
            onDismiss={handleDismissToast}
          />
        </>
      );
      setFloatingTabOverlay(overlay);

      return () => setFloatingTabOverlay((current) => clearOverlayIfCurrent(current, overlay));
    }, [
      setFloatingTabOverlay,
      searchQuery,
      handleSearchChange,
      insets.bottom,
      activeFolderKind,
      locale,
      folderLabel,
      activeFolderKey,
      clearFolderFilter,
      clearDateFilter,
      activeDay,
      searchTag,
      clearSearchTag,
      state.status,
      isEditing,
      selectedCardIds.size,
      pinActionLabel,
      handleToggleSelectedPins,
      handleDeleteSelected,
      handleCancelEdition,
      handleRestore,
      handleDismissToast,
      isToastVisible,
      restoreBackup?.length,
      themeColors.foreground,
      themeColors.canvas,
    ])
  );

  return (
    <View style={{ flex: 1 }} collapsable={false}>
      <Sortable.PortalProvider>
        <View className="flex-1 bg-theme-canvas">
          {state.status === 'loading' && (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={themeColors.secondary} />
            </View>
          )}

          {state.status === 'error' && (
            <Centered title={translate("Couldn't open the library")} message={state.error}>
              <Pressable
                onPress={goBack}
                className="mt-6 rounded-full bg-theme-raised px-5 py-2.5 active:opacity-80"
              >
                <Text className="font-sans-medium text-sm text-theme-heading">
                  <LocalizedText>Choose another folder</LocalizedText>
                </Text>
              </Pressable>
            </Centered>
          )}

          {state.status === 'ready' && (
            <View className="flex-1">
              <View className="flex-1">
                <BlurTargetView ref={searchBlurTargetRef} style={{ flex: 1 }}>
                  <BoardGridContext.Provider value={gridContextValue}>
                    <FlashList<LibraryItem>
                      ref={boardListRef}
                      data={displayedItems}
                      renderItem={renderItem}
                      keyExtractor={keyExtractor}
                      numColumns={2}
                      masonry
                      optimizeItemArrangement
                      maintainVisibleContentPosition={{ disabled: true }}
                      extraData={extraData}
                      CellRendererComponent={CellRenderer}
                      contentContainerStyle={styles.contentContainer}
                      showsVerticalScrollIndicator={false}
                      keyboardDismissMode="on-drag"
                      keyboardShouldPersistTaps="handled"
                      refreshControl={
                        <RefreshControl
                          refreshing={refreshing}
                          onRefresh={refresh}
                          tintColor={themeColors.secondary}
                        />
                      }
                      ListHeaderComponent={renderHeader}
                      ListEmptyComponent={renderEmpty}
                    />
                  </BoardGridContext.Provider>
                </BlurTargetView>
              </View>
            </View>
          )}

          <BoardAddModals
            isNoteDrawerOpen={isNoteDrawerOpen}
            isLinkModalOpen={isLinkModalOpen}
            isBookModalOpen={isBookModalOpen}
            isMusicModalOpen={isMusicModalOpen}
            isMovieModalOpen={isMovieModalOpen}
            isTvShowModalOpen={isTvShowModalOpen}
            isGameModalOpen={isGameModalOpen}
            isEntertainmentModalOpen={isEntertainmentModalOpen}
            isImageModalOpen={isImageModalOpen}
            isPdfModalOpen={isPdfModalOpen}
            isVideoModalOpen={isVideoModalOpen}
            isAudioModalOpen={isAudioModalOpen}
            isFolderPickerOpen={isFolderPickerOpen}
            pendingImage={pendingImage}
            pendingPdf={pendingPdf}
            pendingVideo={pendingVideo}
            pendingAudio={pendingAudio}
            selectedItems={selectedItems}
            onClose={closeAddModal}
            onDismiss={handleAddModalDismiss}
            onCloseEntertainment={() => {
              if (!queuedControlActionRef.current) activeAddModalRef.current = null;
              setIsEntertainmentModalOpen(false);
            }}
            onCloseFolderPicker={() => setIsFolderPickerOpen(false)}
            onAddedToFolder={handleCancelEdition}
          />
        </View>
      </Sortable.PortalProvider>
    </View>
  );
}

type CellRendererProps = {
  style?: {
    left?: number;
    [key: string]: any;
  };
  children?: React.ReactNode;
  index?: number;
  [key: string]: any;
};

const CellRenderer = forwardRef<View, CellRendererProps>((props, ref) => {
  const { style, children, index, ...rest } = props;
  const { reportItemCol } = useContext(BoardGridContext);
  const isLeftColumn = !style?.left || style.left < 1;

  useEffect(() => {
    if (typeof index === 'number') {
      reportItemCol(index, isLeftColumn ? 0 : 1);
    }
  }, [index, isLeftColumn, reportItemCol]);

  return (
    <View ref={ref} {...rest} style={[style]}>
      {children}
    </View>
  );
});

CellRenderer.displayName = 'CellRenderer';

function Centered({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="font-sans-medium text-lg text-theme-bright">{title}</Text>
      <Text className="mt-2 text-center font-sans text-base text-theme-muted">{message}</Text>
      {children}
    </View>
  );
}

function keyExtractor(item: LibraryItem): string {
  return item.id;
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 4,
    paddingTop: 64,
    paddingBottom: 200,
    flexGrow: 1,
  },
  cardWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
});
