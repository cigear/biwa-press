import type { TokenizerAndRendererExtension } from 'marked';

export const poetryExtension: TokenizerAndRendererExtension = {
  name: 'poetry',
  level: 'block',
  start(src: string) { return src.match(/^:::poetry/)?.index; },
  tokenizer(src: string) {
    const rule = /^:::poetry([^\n]*)\n([\s\S]*?)\n:::(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const header = match[1].trim();
      const parts = header.split('|');
      const content = match[2].trim();
      return {
        type: 'poetry',
        raw: match[0],
        title: parts[0]?.trim() || '',
        author: parts[1]?.trim() || '',
        mode: parts[2]?.trim() || 'h', // 'v' for vertical, 'h' for horizontal
        content: content,
        tokens: []
      };
    }
  },
  renderer(token) {
    const t = token as any;
    const isVertical = t.mode === 'v';
    // 竖排模式保持不换行。横排模式允许自动折行以适配容器宽度。
    const lineClass = isVertical ? 'whitespace-nowrap' : '!m-0 whitespace-normal break-all';
    const lines = t.content.split(/\r?\n/).map((l: string) => `<div class="${lineClass}">${l.trim() || '&nbsp;'}</div>`).join('');
    
    const containerClass = `poetry-container my-6 md:my-10 ml-auto mr-auto self-center justify-self-center font-serif bg-secondary/5 text-foreground shadow-xl rounded-3xl w-fit max-w-full flex flex-col transition-all hover:shadow-2xl overflow-x-auto ${isVertical ? 'px-6 py-6 md:px-20 md:py-16' : 'px-6 py-6 md:px-16 md:py-12'}`;
    
    const layoutClass = isVertical 
      ? 'items-center justify-center min-h-[120px] md:min-h-[200px] gap-4 md:gap-8' 
      : 'items-center justify-center gap-4'; // Horizontal mode stays centered

    const writingMode = isVertical ? 'writing-mode: vertical-rl; text-orientation: upright;' : '';

    const authorHtml = t.author
      ? `<div class="flex items-center flex-row gap-2 ${isVertical ? '' : 'justify-center'}">
          <div class="text-sm md:text-base font-bold opacity-60">${t.author}</div>
          <div class="w-5 h-5 flex items-center justify-center border border-red-800/30 text-red-800/40 text-[10px] font-serif font-bold rounded-sm bg-red-500/5 select-none" style="writing-mode: horizontal-tb;">印</div>
        </div>`
      : '';

    return `
      <div class="${containerClass} ${layoutClass}" style="${writingMode}">
        <div class="text-xl md:text-3xl font-bold m-0 tracking-tighter text-primary ${isVertical ? '' : 'text-center'}">${t.title}</div>
        ${authorHtml}
        <div class="poetry-content flex flex-col ${isVertical ? 'gap-2 md:gap-5' : 'gap-4 md:gap-5'} text-lg md:text-2xl leading-tight tracking-[0.2em] md:tracking-[0.4em] ${isVertical ? '' : 'text-left'}">
          ${lines}
        </div>
      </div>`;
  }
};