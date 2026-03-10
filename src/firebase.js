/**
 * Firebase 설정 파일
 *
 * 사용 방법:
 * 1. https://console.firebase.google.com 에서 프로젝트 생성
 * 2. Authentication → 익명(Anonymous) 로그인 활성화
 * 3. Firestore Database 생성
 * 4. Storage 활성화
 * 5. 프로젝트 설정 → 웹 앱 추가 → Firebase SDK 설정 복사
 * 6. 아래 firebaseConfig 값을 실제 값으로 교체
 */

import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAvnf6Sl_9CGBx2daS3KiIW-Ul62_3L6YA",
  authDomain: "couple-diary-61d56.firebaseapp.com",
  projectId: "couple-diary-61d56",
  storageBucket: "couple-diary-61d56.firebasestorage.app",
  messagingSenderId: "434666098108",
  appId: "1:434666098108:web:0d110b3419299ea31b2fb9",
  measurementId: "G-TS8MTCJHQC"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export const loginAnonymously = () => signInAnonymously(auth)
export { onAuthStateChanged }
