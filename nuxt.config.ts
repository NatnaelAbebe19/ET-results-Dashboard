// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  // Vercel serverless deployment preset
  nitro: {
    preset: 'vercel'
  },

  runtimeConfig: {
    // Private keys (server-only)
    databaseUrl: process.env.DATABASE_URL || '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    renderAppUrl: process.env.RENDER_APP_URL || 'https://et-results.onrender.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin12345',
    adminSessionSecret: process.env.ADMIN_SESSION_SECRET || 'et_results_secure_secret_2026',

    // Public keys (accessible on client)
    public: {
      renderAppUrl: process.env.RENDER_APP_URL || 'https://et-results.onrender.com',
      botUsername: 'et_results_bot'
    }
  },

  app: {
    head: {
      title: 'Ethiopian Airlines Results — Admin Dashboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Admin dashboard for ET Results Telegram Bot, Scraper & Candidate Viewer' },
        { name: 'theme-color', content: '#080c14' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  css: ['~/assets/css/main.css']
})
