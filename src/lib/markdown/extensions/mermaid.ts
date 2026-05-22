import type { TokenizerAndRendererExtension } from 'marked';
import { locales, type Locale } from '../../config/locales';

export const mermaidExtension: TokenizerAndRendererExtension = {
  name: 'mermaid',
  level: 'block',
  start(src: string) { return src.match(/^```mermaid/)?.index; },
  tokenizer(src: string) {
    const rule = /^```mermaid\n([\s\S]*?)\n```(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'mermaid',
        raw: match[0],
        text: match[1].trim(),
        tokens: []
      };
    }
  },
  renderer(this: any, token) {
    const code = token.text;
    // 从 marked 的解析器上下文中获取当前语言
    const locale = this.parser.options.renderer?.currentLocale || 'en';

    // 定义翻译助手函数 _t
    const _t = (key: keyof typeof locales['en']) => locales[locale as Locale][key] || locales['en'][key];
    const hint = _t('mermaidFallbackHint');

    return `
      <div class="mermaid-container my-6 flex flex-col items-center" data-mermaid-src="${encodeURIComponent(code)}">
        <div class="mermaid-render-target hidden w-full justify-center bg-secondary rounded-xl p-8 border border-border shadow-inner"></div>
        <div class="mermaid-fallback hidden w-full">
          <pre class="p-4 bg-secondary rounded-xl overflow-x-auto text-sm font-mono text-foreground border border-border shadow-sm">
<code>${code}</code>
          </pre>
          <p class="text-xs text-center opacity-30 mt-2 font-sans text-muted-foreground">${hint}</p>
        </div>
      </div>
    `;
  }
};