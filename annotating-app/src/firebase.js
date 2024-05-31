import { firebaseConfig } from "./firebaseConfig";
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);
  
export { storage };