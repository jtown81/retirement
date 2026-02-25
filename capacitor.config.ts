import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fedplan.retire',
  appName: 'Federal Retirement Planner',
  webDir: 'app/dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      showSpinner: false,
      autoHide: true,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.web', 'apple.web'],
    },
  },
  ios: {
    scheme: 'FedRetirePlanner',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },
};

export default config;
