import { type Token, type Tokens } from 'marked';

export interface TimelineToken extends Tokens.Generic {
  type: 'timeline';
  raw: string;
  text: string;
  tokens: Token[];
}

export const timelineExtension = {
  name: 'timeline',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^:::(timeline)/)?.index;
  },
  tokenizer(this: any, src: string): TimelineToken | undefined {
    const rule = /^:::(timeline)[ \t]*\n([\s\S]*?)\n[ \t]*:::[ \t]*(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const raw = match[0];
      const text = match[2];

      return {
        type: 'timeline',
        raw: raw,
        text: text,
        // marked 内部会将 lexer 绑定到当前上下文
        tokens: this.lexer.blockTokens(text, [])
      };
    }
    return undefined;
  },
  renderer(this: any, token: Tokens.Generic) {
    const t = token as TimelineToken;
    // marked 内部会将 parser 绑定到当前上下文
    return `<div class="vp-timeline">\n${this.parser.parse(t.tokens)}\n</div>\n`;
  }
};