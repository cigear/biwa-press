import { type Token, type Tokens } from 'marked';

export interface GalleryToken extends Tokens.Generic {
  type: 'gallery';
  raw: string;
  text: string;
  tokens: Token[];
}

export const galleryExtension = {
  name: 'gallery',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^:::(gallery)/)?.index;
  },
  tokenizer(this: any, src: string): GalleryToken | undefined {
    const match = src.match(/^(:{3,})(gallery)[ \t]*\n/);
    if (match) {
      const fence = match[1];
      const lines = src.split('\n');
      let depth = 0;
      let endLine = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith(fence) && line.length > fence.length) depth++;
        else if (line === fence) {
          depth--;
          if (depth === 0) {
            endLine = i;
            break;
          }
        }
      }

      if (endLine === -1) return undefined;

      const raw = lines.slice(0, endLine + 1).join('\n');
      const text = lines.slice(1, endLine).join('\n').trim();

      return {
        type: 'gallery',
        raw,
        text,
        // 使用空的 tokens 数组作为起点，解析块内的图片列表等内容
        tokens: this.lexer.blockTokens(text, [])
      };
    }
    return undefined;
  },
  renderer(this: any, token: Tokens.Generic) {
    const t = token as GalleryToken;
    // 渲染内部内容并包裹在具有 gallery 类名的容器中
    return `<div class="vp-gallery">\n${this.parser.parse(t.tokens)}\n</div>\n`;
  }
};