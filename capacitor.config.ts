import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.managedpmo.app',
  appName: 'PMO Native App',
  webDir: '.',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#007aff',
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  ios: {
    contentInset: 'always'
  },
  android: {
    // Custom properties can be added using type assertion
  } as any
};

export default config;