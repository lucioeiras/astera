import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { File } from 'expo-file-system';
import NoteEditorDOM, { type NoteEditorDOMHandle } from './NoteEditor.dom';
import type { NoteRichTextInputHandle, NoteRichTextInputProps } from './NoteRichTextInput.types';
import { NoteEditorBridge, type EditorRequest } from '@/lib/noteEditor/bridge';
import { externalLink } from '@/lib/noteEditor/images';
import { loadEditorFonts } from '@/lib/noteEditor/fonts';
import { LibraryAssetContext } from '@/lib/library/assetContext';
import { isNoteImageUri } from '@/lib/noteImages';
import { useAppTheme } from '@/lib/theme';
import { translate } from '@/lib/i18n';

export const NoteRichTextInput = forwardRef<NoteRichTextInputHandle, NoteRichTextInputProps>(
  function NoteRichTextInput(props, ref) {
    const { colors } = useAppTheme();
    const root = useContext(LibraryAssetContext);
    const bridge = useRef(
      new NoteEditorBridge(30000, () => {
        setReady(false);
        setFailed(true);
      })
    ).current;
    const snapshot = useRef(props.value);
    // Only send the seed document on mount/recovery. Echoing each edit back
    // through Expo DOM serializes the entire note (including embedded images).
    const [initialMarkdown, setInitialMarkdown] = useState(props.value);
    const previousValue = useRef(props.value);
    const pendingReplacement = useRef<string | null>(null);
    const currentProps = useRef(props);
    currentProps.current = props;
    const [request, setRequest] = useState<EditorRequest | null>(null);
    const [ready, setReady] = useState(false);
    const readyRef = useRef(false);
    const domRef = useRef<NoteEditorDOMHandle>(null);
    const [failed, setFailed] = useState(false);
    const [generation, setGeneration] = useState(0);
    const imageCache = useRef(new Map<string, Promise<string>>());
    const documentUrl = useRef<string | null>(null);

    const reportError = useCallback(() => {
      currentProps.current.onError?.();
    }, []);
    const restart = useCallback(() => {
      bridge.disconnect();
      readyRef.current = false;
      setInitialMarkdown(snapshot.current);
      setReady(false);
      setFailed(false);
      setRequest(null);
      setGeneration((value) => value + 1);
    }, [bridge]);
    useEffect(() => () => bridge.disconnect('Editor was closed'), [bridge]);
    useEffect(() => {
      // Read packaged fonts in parallel with WebView startup. The DOM request
      // reuses this cached promise when its JavaScript is ready.
      if (Platform.OS !== 'web') void loadEditorFonts().catch(() => undefined);
    }, []);
    useEffect(() => {
      if (props.value !== previousValue.current) {
        previousValue.current = props.value;
        if (props.value !== snapshot.current) {
          snapshot.current = props.value;
          pendingReplacement.current = props.value;
        }
      }
      if (ready && pendingReplacement.current !== null) {
        const markdown = pendingReplacement.current;
        pendingReplacement.current = null;
        void bridge.request({ method: 'setMarkdown', markdown }).catch(reportError);
      }
    }, [props.value, ready, bridge, reportError]);

    useImperativeHandle(
      ref,
      () => ({
        focus: async (start) => {
          await bridge.request({ method: 'focus', start });
        },
        blur: async () => {
          await bridge.request({ method: 'blur' });
          Keyboard.dismiss();
        },
        getMarkdown: () => bridge.request({ method: 'getMarkdown' }),
        setMarkdown: async (markdown) => {
          await bridge.request({ method: 'setMarkdown', markdown });
        },
        captureSelection: async () => {
          await bridge.request({ method: 'captureSelection' });
        },
        insertImage: async (uri) => {
          await bridge.request({ method: 'insertImage', uri });
        },
        format: async (action) => {
          await bridge.request({ method: 'format', action });
        },
      }),
      [bridge]
    );

    const resolveImage = useCallback(
      async (uri: string) => {
        if (!isNoteImageUri(uri)) return '';
        if (!uri.startsWith('images/')) return uri;
        if (!root || Platform.OS === 'web') return '';
        const key = `${root}/${uri}`;
        let result = imageCache.current.get(key);
        if (!result) {
          result = (async () => {
            const file = new File(root, uri);
            const extension = uri.split('.').pop()?.toLowerCase();
            const mime = extension === 'jpg' ? 'jpeg' : extension;
            return `data:image/${mime};base64,${await file.base64()}`;
          })();
          imageCache.current.set(key, result);
          void result.catch(() => imageCache.current.delete(key));
        }
        return result;
      },
      [root]
    );

    const editor = useMemo(
      () => (
        <NoteEditorDOM
          key={generation}
          ref={domRef}
          value={initialMarkdown}
          request={request}
          colors={{
            strong: colors.foreground,
            secondary: colors.secondary,
            bright: colors.bright,
            inverse: colors.inverse,
            background: colors.canvas,
            foreground: colors.heading,
            muted: props.placeholderTextColor,
            border: colors.strongBorder,
            link: colors.blueSoft,
          }}
          placeholder={props.placeholder}
          onReady={async () => {
            readyRef.current = true;
            setReady(true);
            setFailed(false);
            bridge.connect((next) => {
              if (next.command.method === 'focus') {
                domRef.current!.focus(next.id, Boolean(next.command.start));
              } else {
                setRequest(next);
              }
            });
            currentProps.current.onReady?.();
          }}
          onChange={async (markdown) => {
            snapshot.current = markdown;
            currentProps.current.onChangeMarkdown(markdown);
          }}
          onResult={async (result) => {
            bridge.receive(result);
          }}
          onImportImage={async (asset) => currentProps.current.onImportImage(asset)}
          onResolveImage={resolveImage}
          onLoadFonts={async () => (Platform.OS === 'web' ? null : loadEditorFonts())}
          onReadClipboardImage={async () =>
            Platform.OS === 'web'
              ? null
              : ((await Clipboard.getImageAsync({ format: 'png' }))?.data ?? null)
          }
          onOpenLink={async (url) => {
            if (externalLink(url)) await Linking.openURL(url).catch(() => undefined);
          }}
          onError={async () => {
            if (!readyRef.current) {
              setFailed(true);
              bridge.disconnect('Editor could not be loaded');
            }
            reportError();
          }}
          dom={{
            style: { flex: 1, backgroundColor: colors.canvas },
            containerStyle: { flex: 1, backgroundColor: colors.canvas },
            matchContents: false,
            scrollEnabled: false,
            bounces: false,
            hideKeyboardAccessoryView: true,
            onError: () => {
              bridge.disconnect('Editor could not be loaded');
              readyRef.current = false;
              setReady(false);
              setFailed(true);
              reportError();
            },
            onContentProcessDidTerminate: restart,
            onRenderProcessGone: restart,
            onShouldStartLoadWithRequest: (event: { url: string }) => {
              if (event.url === 'about:blank') return true;
              if (!documentUrl.current) {
                documentUrl.current = event.url;
                return true;
              }
              if (event.url === documentUrl.current) return true;
              if (externalLink(event.url)) void Linking.openURL(event.url).catch(() => undefined);
              return false;
            },
          }}
        />
      ),
      [
        generation,
        initialMarkdown,
        request,
        colors.foreground,
        colors.secondary,
        colors.bright,
        colors.inverse,
        colors.canvas,
        colors.heading,
        colors.strongBorder,
        colors.blueSoft,
        props.placeholderTextColor,
        props.placeholder,
        bridge,
        resolveImage,
        reportError,
        restart,
      ]
    );

    return (
      <View
        style={{ flex: 1, width: '100%', backgroundColor: colors.canvas }}
        testID="note-visual-editor"
      >
        {/* Keep the native WebView visible when it is asked to become first responder. */}
        {editor}
        {!ready && (
          <View
            testID="note-editor-loading"
            pointerEvents={failed ? 'auto' : 'none'}
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }]}
          >
            <View style={{ position: 'absolute', top: 60, alignSelf: 'center' }}>
              {failed ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={translate('Retry editor')}
                  onPress={restart}
                >
                  <Text style={{ color: colors.heading }}>{translate('Retry editor')}</Text>
                </Pressable>
              ) : (
                <ActivityIndicator color={colors.muted} />
              )}
            </View>
          </View>
        )}
      </View>
    );
  }
);
