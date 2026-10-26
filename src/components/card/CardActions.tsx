import { useAppTheme } from '@/lib/theme';
import {
  ArrowSquareOutIcon,
  BookOpenTextIcon,
  BookmarkSimpleIcon,
  CopyIcon,
  DownloadSimpleIcon,
  ExportIcon,
  FilePdfIcon,
  GameControllerIcon,
  FolderPlusIcon,
  ShareNetworkIcon,
  MicrophoneIcon,
  NotePencilIcon,
  TrashSimpleIcon,
} from 'phosphor-react-native';

import { translate, useLocalization } from '@/lib/i18n';
import { ActionFooter } from '@/components/ActionFooter';
import { Button } from '@/components/Button';

import type { LibraryItem } from '@/lib/library/types';

type CardActionsProps = {
  item: LibraryItem;
  bottomInset?: number;
  onDelete: () => void;
  onAddToFolder: () => void;
  onManageRelatedCards: () => void;
  onAddSource: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onShare: () => void;
  onOpenLink: () => void;
  onOpenPdf: () => void;
  onEditNote: () => void;
  onTranscribeAudio?: () => void;
  isTranscribingAudio?: boolean;
  showTranscribeAudio?: boolean;
  showLogPlay?: boolean;
  onLogPlay?: () => void;
  showLogReading?: boolean;
  onLogReading?: () => void;
};

export function CardActions({
  item,
  bottomInset = 0,
  onDelete,
  onAddToFolder,
  onManageRelatedCards,
  onAddSource,
  onDownload,
  onCopy,
  onShare,
  onOpenLink,
  onOpenPdf,
  onEditNote,
  onTranscribeAudio,
  isTranscribingAudio = false,
  showTranscribeAudio,
  showLogPlay = false,
  onLogPlay,
  showLogReading = false,
  onLogReading,
}: CardActionsProps) {
  const { colors: themeColors } = useAppTheme();
  useLocalization();
  const isLink = ['link', 'article', 'youtube', 'tiktok', 'tweet', 'reddit'].includes(item.type);
  const isImage = item.type === 'image';
  const isPdf = item.type === 'pdf';
  const isMusic = item.type === 'music';
  const isGame = item.type === 'game';
  const isNoteOrQuote = item.type === 'note' || item.type === 'quote';
  const actions = [
    {
      accessibilityLabel: 'Delete',
      icon: <TrashSimpleIcon size={24} color="#EF4444" />,
      onPress: onDelete,
    },
    {
      accessibilityLabel: 'Add to folder',
      icon: <FolderPlusIcon size={24} color={themeColors.foreground} />,
      onPress: onAddToFolder,
    },
    {
      accessibilityLabel: 'Manage related cards',
      icon: <ShareNetworkIcon size={24} color={themeColors.foreground} />,
      onPress: onManageRelatedCards,
    },
    ...(isNoteOrQuote
      ? [
          {
            accessibilityLabel: 'Add source',
            icon: <BookmarkSimpleIcon size={24} color={themeColors.foreground} />,
            onPress: onAddSource,
          },
        ]
      : []),
    ...(isImage
      ? [
          {
            accessibilityLabel: 'Download image',
            icon: <DownloadSimpleIcon size={24} color={themeColors.foreground} />,
            onPress: onDownload,
          },
        ]
      : []),
    ...((showTranscribeAudio ?? (item.type === 'audio' && !item.transcript?.trim())) &&
    item.type === 'audio' &&
    onTranscribeAudio &&
    !isTranscribingAudio
      ? [
          {
            accessibilityLabel: 'Transcribe audio',
            icon: <MicrophoneIcon size={24} color={themeColors.foreground} />,
            onPress: onTranscribeAudio,
          },
        ]
      : []),
    ...(isImage ||
    isNoteOrQuote ||
    isPdf ||
    isMusic ||
    item.type === 'movie' ||
    item.type === 'tvshow'
      ? [
          {
            accessibilityLabel: 'Copy',
            icon: <CopyIcon size={24} color={themeColors.foreground} />,
            onPress: onCopy,
          },
        ]
      : []),
    ...(item.type === 'note'
      ? [
          {
            accessibilityLabel: 'Edit note',
            icon: <NotePencilIcon size={24} color={themeColors.foreground} />,
            onPress: onEditNote,
          },
        ]
      : []),
    ...(isLink ||
    isImage ||
    isPdf ||
    isMusic ||
    isGame ||
    item.type === 'movie' ||
    item.type === 'tvshow' ||
    item.type === 'book'
      ? [
          {
            accessibilityLabel: 'Share',
            icon: <ExportIcon size={24} color={themeColors.foreground} />,
            onPress: onShare,
          },
        ]
      : []),
    ...(isLink ||
    (item.type === 'book' && Boolean(item.url)) ||
    (isMusic && Boolean(item.externalUrl)) ||
    (isGame && Boolean(item.website)) ||
    (item.type === 'movie' && Boolean(item.tmdbId)) ||
    (item.type === 'tvshow' && Boolean(item.tmdbId))
      ? [
          {
            accessibilityLabel: 'Open link',
            icon: <ArrowSquareOutIcon size={24} color={themeColors.foreground} />,
            onPress: onOpenLink,
          },
        ]
      : []),
    ...(isPdf
      ? [
          {
            accessibilityLabel: 'Open PDF',
            icon: <FilePdfIcon size={24} color={themeColors.foreground} weight="duotone" />,
            onPress: onOpenPdf,
          },
        ]
      : []),
    ...(showLogPlay && onLogPlay
      ? [
          {
            accessibilityLabel: translate('Log play'),
            icon: <GameControllerIcon size={24} weight="duotone" />,
            onPress: onLogPlay,
            variant: 'primary' as const,
            backgroundColor: themeColors.amber,
          },
        ]
      : []),
    ...(showLogReading && onLogReading
      ? [
          {
            accessibilityLabel: 'Log reading',
            icon: <BookOpenTextIcon size={24} weight="duotone" />,
            onPress: onLogReading,
            variant: 'primary' as const,
            backgroundColor: themeColors.amber,
          },
        ]
      : []),
  ];

  return (
    <ActionFooter bottomInset={bottomInset} overlay>
      {actions.map((action) => (
        <Button key={action.accessibilityLabel} {...action} />
      ))}
    </ActionFooter>
  );
}
