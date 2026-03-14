import { defineConfig } from '@apps-in-toss/web-framework/config'

const appName = process.env.INTOSS_APP_NAME || 'pikamaka'

export default defineConfig({
  appName,
  brand: {
    displayName: process.env.INTOSS_DISPLAY_NAME || '필까말까',
    primaryColor: process.env.INTOSS_PRIMARY_COLOR || '#ff6b35',
    icon: process.env.INTOSS_ICON_URL || '',
  },
  web: {
    host: process.env.INTOSS_WEB_HOST || 'localhost',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'next build',
    },
  },
  outdir: 'out',
  permissions: [],
  webViewProps: {
    type: 'partner',
  },
})
