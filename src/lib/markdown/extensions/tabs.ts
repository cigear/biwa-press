import { type Token, type Tokens } from 'marked';

export interface TabsToken extends Tokens.Generic {
  type: 'tabs';
  raw: string;
  tabs: { label: string; tokens: Token[]; id: string }[];
}

export const tabsExtension = {
  name: 'tabs',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^:::(tabs)/)?.index;
  },
  tokenizer(this: any, src: string): TabsToken | undefined {
    const rule = /^:::(tabs)[ \t]*\n([\s\S]*?)\n[ \t]*:::[ \t]*(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const raw = match[0];
      const text = match[2];
      
      // 使用正则表达式拆分标签页，查找以 == 开头的行
      const sections = text.split(/^==[ \t]+/m).filter(Boolean);
      const groupId = Math.random().toString(36).substring(2, 9);
      
      const tabs = sections.map((section, index) => {
        const lines = section.split('\n');
        const label = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        return {
          label,
          id: `tab-${groupId}-${index}`,
          tokens: this.lexer.blockTokens(content, [])
        };
      });

      return {
        type: 'tabs',
        raw,
        tabs
      };
    }
    return undefined;
  },
  renderer(this: any, token: Tokens.Generic) {
    const t = token as TabsToken;
    const groupId = t.tabs[0]?.id.split('-')[1];

    const tabElements = t.tabs.map((tab, i) => `
      <input type="radio" id="${tab.id}" name="group-${groupId}" class="vp-tab-input" ${i === 0 ? 'checked' : ''}>
      <label for="${tab.id}" class="vp-tab-label">${tab.label}</label>
      <div class="vp-tab-content" id="content-${tab.id}">${this.parser.parse(tab.tokens)}</div>
    `).join('');

    return `<div class="vp-tabs">${tabElements}</div>`;
  }
};