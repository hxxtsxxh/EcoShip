import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDzcRSjDWHX5yhWY2VCd3HCJBa5vvelJ_s",
  authDomain: "carbonimpac.firebaseapp.com",
  projectId: "carbonimpac",
  storageBucket: "carbonimpac.firebasestorage.app",
  messagingSenderId: "876989878825",
  appId: "1:876989878825:web:877e8072a6660247508238",
  measurementId: "G-JWBSBKG80W"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const storage = getStorage(app);

// Initialize analytics only if supported
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {
  // Analytics not supported in this environment
});

export { analytics };
export default app;
