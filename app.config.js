const IS_DEV = process.env.APP_VARIANT === 'development' || process.env.APP_VARIANT === 'preview';
// Set by eas.json's production-apk profile: per-ABI APKs + a universal one.
const ABI_SPLITS = process.env.ANDROID_ABI_SPLITS === '1';

const BASE_BUNDLE_ID = 'com.mkloouo.whatdidieat';
const BASE_NAME = 'What Did I Eat';

module.exports = {
  expo: {
    name: IS_DEV ? `${BASE_NAME} (Dev)` : BASE_NAME,
    slug: 'what-did-i-eat',
    version: '2.5.2',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    backgroundColor: '#E8E3EC',
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? `${BASE_BUNDLE_ID}.dev` : BASE_BUNDLE_ID,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: IS_DEV ? `${BASE_BUNDLE_ID}.dev` : BASE_BUNDLE_ID,
      adaptiveIcon: {
        backgroundColor: '#C9E6EE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          backgroundColor: '#E8E3EC',
          image: './assets/splash-icon.png',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'What Did I Eat uses your photo library to attach food photos to entries.',
          cameraPermission: 'What Did I Eat uses your camera to take food photos for entries.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'What Did I Eat uses your location to note where each food photo was taken.',
        },
      ],
      '@react-native-community/datetimepicker',
      [
        'expo-build-properties',
        {
          android: {
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            useLegacyPackaging: true,
          },
        },
      ],
      ...(ABI_SPLITS ? ['./plugins/withAbiSplits'] : []),
    ],
    extra: {
      eas: {
        projectId: '6b4cc56c-be5b-4e46-bc51-630d756403d8',
      },
    },
  },
};
