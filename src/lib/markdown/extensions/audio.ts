import type { TokenizerAndRendererExtension } from 'marked';

export const audioExtension: TokenizerAndRendererExtension = {
  name: 'audio',
  level: 'inline',
  start(src: string) { return src.match(/::audio/)?.index; },
  tokenizer(src: string) {
    const rule = /^::audio\[([^\]]+)\]/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'audio',
        raw: match[0],
        src: match[1]
      };
    }
  },
  renderer(token) {
    const t = token as any;
    return `<div class="audio-wrapper my-4">
      <audio controls class="w-full h-10"><source src="${t.src}">Your browser does not support the audio element.</audio>
    </div>`;
  }
};