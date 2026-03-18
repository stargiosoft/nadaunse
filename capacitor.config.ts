import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stargiosoft.nadaunse',
  appName: '나다운세',
  webDir: 'dist',

  server: {
    allowNavigation: [
      'https://*.iamport.kr',
      'https://*.kakaopay.com',
      'https://*.kakao.com',
      'https://*.inicis.com',
      'https://*.tosspayments.com',
      'https://*.supabase.co',
      'https://nadaunse.com'
    ],
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // 개발 중 true, 출시 시 false
  },

  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
