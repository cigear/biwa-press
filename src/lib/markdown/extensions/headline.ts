import type { TokenizerAndRendererExtension } from 'marked';

export const headlineExtension: TokenizerAndRendererExtension = {
  name: 'headline',
  level: 'block',
  start(src: string) { return src.match(/^:::headline/)?.index; },
  tokenizer(src: string) {
    const rule = /^:::headline([^\n]*)\n([\s\S]*?)\n:::(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const header = match[1].trim();
      const parts = header.split('|');
      const content = match[2].trim();
      return {
        type: 'headline',
        raw: match[0],
        level: parts[0]?.trim() || '1',
        color: parts[1]?.trim() || 'rgb(153 27 27 / 0.4)', // 使用诗词印章的 red-800/40 颜色
        content: content,
        tokens: []
      };
    }
  },
  renderer(token) {
    const t = token as any;
    let level = parseInt(t.level);
    // 确保级别在 1-6 之间，默认为 1
    if (isNaN(level) || level < 1 || level > 6) level = 1;
    
    const tag = `h${level}`;
    const color = t.color;
    
    // 根据级别匹配 Tailwind 字号
    const sizeClasses: Record<number, string> = {
      1: 'text-3xl md:text-4xl font-extrabold',
      2: 'text-2xl md:text-3xl font-bold',
      3: 'text-xl md:text-2xl font-bold',
      4: 'text-lg md:text-xl font-semibold',
      5: 'text-base md:text-lg font-semibold',
      6: 'text-sm md:text-base font-semibold'
    };

    const sizeClass = sizeClasses[level];

    // inline-block 确保边框宽度与文字长度一致
    return `
      <div class="vp-headline my-8">
        <${tag} class="${sizeClass} inline-block border-b-4 pb-1 leading-tight text-foreground" style="border-bottom-color: ${color};">
          ${t.content}
        </${tag}>
      </div>`;
  }
};