import type { Tokens } from 'marked';

// 定义自定义视频 Token 的类型，扩展 Tokens.Generic 以符合 marked 的扩展规范
export interface VideoEmbedToken extends Tokens.Generic {
  type: 'videoEmbed';
  videoType: 'video' | 'youtube' | 'bilibili';
  altOrTitle: string;
  urlOrId: string;
  width?: string;
  ratio?: string;
  poster?: string;
  lazy?: boolean; // Add a new property for lazy loading
  tokens: []; // 这种简单的嵌入不需要嵌套解析
}

/* ------------------------------------------------------------------
 * [Interface Adapter Layer] - MediaRenderer (Media Rendering Adapter)
 * Handles video HTML construction specifically, decoupling the rendering logic of marked.
 * ------------------------------------------------------------------ */
export const MediaRenderer = {
  renderVideo(t: VideoEmbedToken): string {
    const styles = t.width ? [`max-width: ${t.width}px`, 'width: 100%'] : ['width: 100%'];
    if (t.ratio) styles.push(`aspect-ratio: ${t.ratio.replace(':', ' / ')}`);
    const containerStyle = `style="${styles.join('; ')}; overflow: hidden; position: relative;"`;
    const innerStyle = t.ratio ? `style="width: 100%; height: 100%; object-fit: cover; display: block;"` : `style="width: 100%; height: auto; display: block;"`;
    const posterAttr = t.poster ? `poster="${t.poster}"` : '';
    const dataPosterAttr = t.poster ? `data-poster="${t.poster}"` : '';
    const lazyClass = t.lazy ? 'js-lazy-video' : '';
    const autoplayMuted = 'autoplay muted';

    if (t.videoType === 'video') {
      const videoSrc = t.urlOrId.includes('#') ? t.urlOrId : `${t.urlOrId}#t=0.001`;
      const srcAttr = t.lazy ? `data-src="${videoSrc}"` : `src="${videoSrc}"`;
      return `<div class="video-embed-container ${lazyClass}" data-video-type="video" ${dataPosterAttr} ${containerStyle}>
                <video controls playsinline preload="metadata" ${autoplayMuted} ${posterAttr} title="${t.altOrTitle}" ${innerStyle}>
                  <source ${srcAttr}>
                  您的浏览器不支持视频标签。
                </video>
              </div>`;
    }
    
    if (t.videoType === 'youtube') {
      const base = `https://www.youtube.com/embed/${t.urlOrId}`;
      const final = t.lazy ? base : `${base}?autoplay=1&mute=1`;
      const srcAttr = t.lazy ? `data-src="${final}"` : `src="${final}"`;
      return `<div class="video-embed-container ${lazyClass}" data-video-type="youtube" ${dataPosterAttr} ${containerStyle}>
                <iframe ${srcAttr} title="${t.altOrTitle}" style="width: 100%; height: 100%; border: 0;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
              </div>`;
    }

    if (t.videoType === 'bilibili') {
      const base = `//player.bilibili.com/player.html?bvid=${t.urlOrId}&page=1`;
      const srcAttr = t.lazy ? `data-src="${base}"` : `src="${base}"`;
      return `<div class="video-embed-container ${lazyClass}" data-video-type="bilibili" ${dataPosterAttr} ${containerStyle}>
                <iframe ${srcAttr} style="width: 100%; height: 100%; border: 0;" scrolling="no" allowfullscreen="true" title="${t.altOrTitle}"></iframe>
              </div>`;
    }
    return '';
  }
};