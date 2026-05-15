import { type Token, type Tokens } from 'marked';

export interface ButtonToken extends Tokens.Generic {
  type: 'button';
  raw: string;
  tokens: Token[];
}

export const buttonExtension = {
  name: 'button',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^:::(button)/)?.index;
  },
  tokenizer(this: any, src: string): ButtonToken | undefined {
    // 匹配 :::button \n 内容 \n :::
    const rule = /^:::(button)[ \t]*\n([\s\S]*?)\n[ \t]*:::[ \t]*(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const raw = match[0];
      const text = match[2].trim();

      return {
        type: 'button',
        raw: raw,
        tokens: this.lexer.blockTokens(text, [])
      };
    }
    return undefined;
  },
  renderer(this: any, token: Tokens.Generic) {
    const t = token as ButtonToken;
    // 将内部链接包裹在具有按钮样式的容器中
    return `<div class="vp-button-container">\n${this.parser.parse(t.tokens)}\n</div>\n`;
  }
};