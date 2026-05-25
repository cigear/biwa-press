import { type Tokens } from 'marked';

export interface UrlLinkToken extends Tokens.Generic {
  type: 'urllink';
  raw: string;
  text: string;
  href: string;
}

export const urlLinkExtension = {
  name: 'urllink',
  level: 'inline' as const,
  start(src: string) {
    return src.match(/::urllink/)?.index;
  },
  tokenizer(src: string): UrlLinkToken | undefined {
    // 匹配 ::urllink[标题](链接)
    const match = src.match(/^::urllink\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      return {
        type: 'urllink',
        raw: match[0],
        text: match[1],
        href: match[2]
      };
    }
    return undefined;
  },
  renderer(token: Tokens.Generic) {
    const t = token as UrlLinkToken;
    // 使用 target="_blank" 并在新标签页打开，同时增加安全性属性
    return `<a href="${t.href}" target="_blank" rel="noopener noreferrer" class="vp-link-external text-gray-400 hover:text-black hover:font-bold transition-all dark:text-gray-500 dark:hover:text-white">${t.text}</a>`;
  }
};