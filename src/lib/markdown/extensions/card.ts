import { type Token, type Tokens } from 'marked';

export interface CardToken extends Tokens.Generic {
  type: 'card';
  raw: string;
  title: string;
  href?: string;
  tokens: Token[];
}

export const cardExtension = {
  name: 'card',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^:::(card)/)?.index;
  },
  tokenizer(this: any, src: string): CardToken | undefined {
    // 匹配 :::card [标题] [[链接]] \n 内容 \n :::
    const match = src.match(/^(:{3,})(card)([ \t]+.*)?\n/);
    if (match) {
      const fence = match[1];
      const titleRaw = (match[3] || '').trim();
      
      // 解析标题中的链接，格式如：:::card 标题 [/link/path]
      let title = titleRaw;
      let href = '';
      const hrefMatch = titleRaw.match(/\[(.*?)\]$/);
      if (hrefMatch) {
        href = hrefMatch[1];
        title = titleRaw.replace(/\[(.*?)\]$/, '').trim();
      }

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
        type: 'card',
        raw,
        title,
        href,
        tokens: this.lexer.blockTokens(text, [])
      };
    }
    return undefined;
  },
  renderer(this: any, token: Tokens.Generic) {
    const t = token as CardToken;
    const titleHtml = t.title 
      ? `<div class="vp-card-title">${t.title}</div>` 
      : '';
    
    const tag = t.href ? 'a' : 'div';
    const hrefAttr = t.href ? ` href="${t.href}"` : '';

    return `<${tag}${hrefAttr} class="vp-card">\n${titleHtml}\n<div class="vp-card-content">\n${this.parser.parse(t.tokens)}\n</div>\n</${tag}>\n`;
  }
};