import {
  calcAspectRatio,
  cleanRedditDescription,
  decodeHtmlEntities,
  resolveUrlMetadata,
} from '@/lib/library/metadata';

describe('metadata helpers', () => {
  it('resolves TikTok links to video metadata and falls back when oEmbed fails', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'A TikTok clip',
        thumbnail_url: 'https://example.com/cover.jpg',
      }),
    } as Response);
    await expect(
      resolveUrlMetadata('https://www.tiktok.com/@person/video/123')
    ).resolves.toMatchObject({
      type: 'tiktok',
      title: 'A TikTok clip',
      thumbnail: 'https://example.com/cover.jpg',
    });

    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(resolveUrlMetadata('https://vm.tiktok.com/short')).resolves.toMatchObject({
      type: 'tiktok',
      title: 'TikTok Video',
      thumbnail: 'https://www.google.com/s2/favicons?domain=tiktok.com&sz=128',
    });
    fetchMock.mockRestore();
  });

  it('calculates only valid positive aspect ratios', () => {
    expect(calcAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
    expect(calcAspectRatio(0, 10)).toBeUndefined();
    expect(calcAspectRatio(10, undefined)).toBeUndefined();
  });

  it('decodes HTML entities', () => {
    expect(decodeHtmlEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(decodeHtmlEntities('')).toBe('');
  });

  it('removes Reddit counters and drops empty boilerplate', () => {
    expect(cleanRedditDescription('107 votos, 38 comentários. Texto útil')).toBe('Texto útil');
    expect(cleanRedditDescription('12 comments')).toBeUndefined();
    expect(cleanRedditDescription('')).toBeUndefined();
  });
});

describe('TikTok metadata', () => {
  const url = 'https://www.tiktok.com/@person/video/123';
  const cover = 'https://example.com/cover.jpg?signature=a&expires=123';
  let fetchMock: jest.SpyInstance;

  const jsonResponse = (data: unknown) => ({ ok: true, json: async () => data }) as Response;
  const pageResponse = (html: string, finalUrl = url) =>
    ({ ok: true, url: finalUrl, text: async () => html }) as Response;
  const hydration = (item: unknown) =>
    `<script type="application/json" id="__UNIVERSAL_DATA_FOR_REHYDRATION__">${JSON.stringify({
      __DEFAULT_SCOPE__: { 'webapp.video-detail': { itemInfo: { itemStruct: item } } },
    })}</script>`;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  });

  afterEach(() => {
    fetchMock.mockRestore();
    jest.useRealTimers();
  });

  it('extracts the video description and cover when the new oEmbed response omits both', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ type: 'video', html: '<iframe></iframe>' }))
      .mockResolvedValueOnce(
        pageResponse(hydration({ id: '123', desc: 'My video & its caption', video: { cover } }))
      );

    await expect(resolveUrlMetadata(url)).resolves.toEqual({
      type: 'tiktok',
      url,
      title: 'My video & its caption',
      thumbnail: cover,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    'https://vm.tiktok.com/ABC/',
    'https://vt.tiktok.com/ABC/',
    'https://www.tiktok.com/t/ABC/',
  ])('expands %s and reuses its HTML if oEmbed fails', async (shortUrl) => {
    fetchMock
      .mockResolvedValueOnce(
        pageResponse(
          hydration({ id: '123', desc: 'Shared video', video: { originCover: cover } }),
          `${url}?is_from_webapp=1`
        )
      )
      .mockResolvedValueOnce({ ok: false });

    await expect(resolveUrlMetadata(shortUrl)).resolves.toMatchObject({
      url,
      title: 'Shared video',
      thumbnail: cover,
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('preserves available oEmbed fields and fills only missing data from the page', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ title: '  Tom &amp; Jerry  ', thumbnail_url: '' }))
      .mockResolvedValueOnce(
        pageResponse(hydration({ id: '123', desc: 'Other caption', video: { cover } }))
      );
    await expect(resolveUrlMetadata(url)).resolves.toMatchObject({
      title: 'Tom & Jerry',
      thumbnail: cover,
    });
  });

  it('supports legacy SIGI_STATE without using recommended videos', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null)).mockResolvedValueOnce(
      pageResponse(
        `<script id='SIGI_STATE'>${JSON.stringify({
          ItemModule: {
            '456': {
              id: '456',
              desc: 'Recommendation',
              video: { cover: 'https://example.com/wrong.jpg' },
            },
            '123': { id: '123', desc: 'Correct video', video: { cover } },
          },
        })}</script>`
      )
    );
    await expect(resolveUrlMetadata(url)).resolves.toMatchObject({
      title: 'Correct video',
      thumbnail: cover,
    });
  });

  it('falls back to HTML metadata after malformed JSON and preserves apostrophes', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({})).mockResolvedValueOnce(
      pageResponse(`<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">{broken</script>
        <meta content="It's a video &amp; more" property="og:description">
        <meta property="og:title" content="Author on TikTok">
        <meta property="og:image" content="https://example.com/cover.jpg?a=1&amp;b=2">`)
    );
    await expect(resolveUrlMetadata(url)).resolves.toMatchObject({
      title: "It's a video & more",
      thumbnail: 'https://example.com/cover.jpg?a=1&b=2',
    });
  });

  it('ignores mismatched video data and invalid image URLs', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ title: {}, thumbnail_url: 'javascript:alert(1)' }))
      .mockResolvedValueOnce(
        pageResponse(
          hydration({ id: '456', desc: 'Wrong video', video: { cover } }) +
            '<meta name="twitter:title" content="Video title"><meta name="twitter:image" content="data:image/png;base64,invalid">'
        )
      );
    await expect(resolveUrlMetadata(url)).resolves.toMatchObject({
      title: 'Video title',
      thumbnail: 'https://www.google.com/s2/favicons?domain=tiktok.com&sz=128',
    });
  });

  it('keeps complete oEmbed metadata without another request', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Video', thumbnail_url: cover }));
    await expect(resolveUrlMetadata(`${url}?tracking=1`)).resolves.toMatchObject({
      url,
      title: 'Video',
      thumbnail: cover,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the original share URL when redirected outside TikTok', async () => {
    const shortUrl = 'https://vm.tiktok.com/ABC/';
    fetchMock.mockResolvedValueOnce(pageResponse('', 'https://example.com/@person/video/123'));
    await expect(resolveUrlMetadata(shortUrl)).resolves.toMatchObject({
      url: shortUrl,
      title: 'TikTok Video',
    });
  });

  it('aborts stalled requests and keeps a usable card offline', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })
    );
    const result = resolveUrlMetadata(url);
    await jest.advanceTimersByTimeAsync(16000);
    await expect(result).resolves.toMatchObject({ type: 'tiktok', url, title: 'TikTok Video' });
    expect(jest.getTimerCount()).toBe(0);
  });
});
