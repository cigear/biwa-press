module.exports = {
  apps: [
    {
      name: 'biwa-press',
      script: 'build/ssr/index.js',
      cwd: '/var/www/biwa-press',
      max_memory_restart: "500M",
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '127.0.0.1',
        ORIGIN: 'https://biwa.dev',
        BIWA_RENDER_MODE: 'ssr',
        REVALIDATE_TOKEN: '123456789'
      }
    }
  ]
};
