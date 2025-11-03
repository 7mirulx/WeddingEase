// Centralized Firebase setup. Safe placeholder until the SDK is installed.
// To enable, install the Web SDK or React Native Firebase and follow the notes below.

export type FirebaseConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
};

// 1) Copy your Firebase project's config here
//    Find it in the Firebase Console > Project Settings > Your apps > Config
export const firebaseConfig: FirebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

// 2) Choose one SDK path and follow the corresponding instructions:
//
// A) Using Firebase Web SDK (works for many services on React Native)
//    npm i firebase
//    Then replace the implementation of getFirebaseApp below with:
//
//    import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
//    let cachedApp: FirebaseApp | undefined;
//    export function getFirebaseApp(): FirebaseApp {
//      if (cachedApp) return cachedApp;
//      cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
//      return cachedApp;
//    }
//
// B) Using React Native Firebase (recommended for full native support)
//    npm i @react-native-firebase/app
//    npx pod-install (iOS)
//    Then replace with:
//
//    import { firebase } from '@react-native-firebase/app';
//    export function getFirebaseApp() {
//      return firebase.app();
//    }

// Safe placeholder to avoid build errors before SDK installation.
// Calling this will throw until you install and wire one of the SDKs above.
export function getFirebaseApp(): never {
  throw new Error(
    'Firebase is not configured yet. Install an SDK and update src/firebase.ts.'
  );
}


