import type { Tokens } from 'marked';
import { MediaRenderer, type VideoEmbedToken } from '../../adapters/presenters/media-renderer';

export const videoEmbedExtension = {
  name: 'videoEmbed',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^::(video|youtube|bilibili)\[/)?.index;
  },
  tokenizer(src: string): VideoEmbedToken | undefined {
    const rule = /^::(video|youtube|bilibili)\[([^\]]+)\]\(([^)]+)\)(?:\{width=(\d+)\})?(?:\{ratio=([\d/:]+)\})?(?:\{poster=([^}]+)\})?(?:\{lazy\})?/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'videoEmbed',
        raw: match[0],
        videoType: match[1] as 'video' | 'youtube' | 'bilibili',
        altOrTitle: match[2],
        urlOrId: match[3],
        width: match[4],
        ratio: match[5],
        poster: match[6],
        lazy: !!match[7],
        tokens: []
      };
    }
    return undefined;
  },
  renderer(token: Tokens.Generic) {
    return MediaRenderer.renderVideo(token as VideoEmbedToken);
  }
};