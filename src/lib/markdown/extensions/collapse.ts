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
    // 匹配 :::details [标题] \n 内容 \n :::
    const rule = /^:::(details)([ \t]+.*)?\n([\s\S]*?)\n[ \t]*:::[ \t]*(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const raw = match[0];
      const title = (match[2] || '').trim() || 'Details';
      const text = match[3].trim();

      return {
        type: 'details',
        raw: raw,
        title: title,
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