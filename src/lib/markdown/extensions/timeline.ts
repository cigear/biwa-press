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
    const match = src.match(/^(:{3,})(timeline)[ \t]*\n/);
    if (match) {
      const fence = match[1];
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