import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.managedpmo.app',
  appName: 'Mandani Bay Community App',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow cleartext traffic for development
    hostname: 'new-app.managedpmo.com', // Custom hostname for production
    allowNavigation: [
      'new-app.managedpmo.com',
      'app.managedpmo.com',
      'api.managedpmo.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#7F126E', // Match the primary color
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#7F126E",
      sound: "beep.wav"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff',
    scheme: 'pmoapp',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true,
    handleApplicationNotifications: true
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: true, // For development only, remove for production
    captureInput: true,
    webContentsDebuggingEnabled: true, // For development only, remove for production
    initialFocus: false,
    useLegacyBridge: false,
    windowSoftInputMode: 'adjustResize'
  } as any
};

export default config;