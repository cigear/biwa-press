<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';

  let observer: IntersectionObserver | null = null;

  function initObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    // 1. 获取所有带有懒加载类且尚未被观察的容器
    const containers = document.querySelectorAll('.js-lazy-video:not([data-observed])');
    if (containers.length === 0) return;

    // 2. 初始化观察器（单例）
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const container = entry.target as HTMLElement;
            loadAndPlay(container);
            observer?.unobserve(container);
          }
        });
      }, {
        rootMargin: '0px 0px 200px 0px', // 提前 200px 开始加载
        threshold: 0.01
      });
    }

    // 3. 开始观察新元素
    containers.forEach(el => {
      el.setAttribute('data-observed', 'true');
      observer?.observe(el);
    });
  }

  function loadAndPlay(container: HTMLElement) {
    const video = container.querySelector('video');
    const iframe = container.querySelector('iframe');

    if (video) {
      const sourceElement = video.querySelector('source');
      if (sourceElement && sourceElement.dataset.src) {
        sourceElement.src = sourceElement.dataset.src;
        video.load(); // Trigger video loading. Autoplay/muted attributes in HTML should handle playback.
      }
    } else if (iframe && iframe.dataset.src) {
      iframe.src = iframe.dataset.src; // Setting src should trigger loading and autoplay if params are in data-src
    }
  }

  onMount(() => {
    initObserver();
  });

  // 关键：在 SPA 路由跳转后重新运行脚本
  afterNavigate(() => {
    initObserver();
  });
</script>