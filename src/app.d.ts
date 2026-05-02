declare global {
  namespace App {}
}

declare module '*.md' {
  import type { Component } from 'svelte';

  const component: Component;
  export default component;
  export const metadata: Record<string, string>;
}

export {};
