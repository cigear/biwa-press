import { type Token, type Tokens } from 'marked';

export interface DetailsToken extends Tokens.Generic {
  type: 'details';
  raw: string;
  title: string;
  tokens: Token[];
}

export const collapseExtension = {
  name: 'details',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^:::(details)/)?.index;
  },
  tokenizer(this: any, src: string): DetailsToken | undefined {
    const match = src.match(/^(:{3,})(details)([ \t]+.*)?\n/);
    if (match) {
      const fence = match[1];
      const title = (match[3] || '').trim() || 'Details';
      
      const lines = src.split('\n');
      let depth = 0;
      let endLine = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith(fence) && line.length > fence.length) {
          depth++;
        } else if (line === fence) {
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
        type: 'details',
        raw,
        title,
        tokens: this.lexer.blockTokens(text, [])
      };
    }
    return undefined;
  },
  renderer(this: any, token: Tokens.Generic) {
    const t = token as DetailsToken;
    // 利用 HTML5 原生 <details> 和 <summary> 标签
    return `<details class="vp-details">\n<summary class="vp-details-summary">${t.title}</summary>\n<div class="vp-details-content">\n${this.parser.parse(t.tokens)}\n</div>\n</details>\n`;
  }
};