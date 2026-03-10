# 💕 커플 다이어리

둘만의 소중한 기록을 남기는 커플 다이어리 웹앱

## 기능
- 💑 커플 연결 (초대 코드)
- 📆 D-day 카운터 & 기념일 알림
- 📔 다이어리 (글+사진, 타임라인 뷰)
- 📅 캘린더 & 일정 관리
- 💬 오늘의 한마디

## 시작하기

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. **Authentication** → 로그인 방법 → **익명(Anonymous)** 활성화
3. **Firestore Database** 생성 (테스트 모드로 시작)
4. **Storage** 활성화
5. 프로젝트 설정 → 일반 → 웹 앱 추가 → Firebase SDK 설정 복사

### 2. Firebase 설정 적용

`src/firebase.js`에서 `firebaseConfig` 값을 실제 값으로 교체:

```js
const firebaseConfig = {
  apiKey: "실제_API_KEY",
  authDomain: "프로젝트.firebaseapp.com",
  projectId: "프로젝트_ID",
  storageBucket: "프로젝트.appspot.com",
  messagingSenderId: "실제_SENDER_ID",
  appId: "실제_APP_ID"
}
```

### 3. Firestore 보안 규칙

Firebase Console → Firestore → 규칙에 아래 내용 적용:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /codes/{code} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /couples/{coupleId} {
      allow read, write: if request.auth != null
        && resource.data.users.hasAny([request.auth.uid]);
      allow create: if request.auth != null;
    }
    match /couples/{coupleId}/{sub=**} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/couples/$(coupleId)).data.users.hasAny([request.auth.uid]);
    }
  }
}
```

### 4. 실행

```bash
npm install
npm run dev
```

### 5. GitHub Pages 배포

```bash
npm run build
# dist 폴더를 gh-pages 브랜치에 배포
npx gh-pages -d dist
```

## 기술 스택
- React 18 + Vite
- Firebase v9+ (Auth, Firestore, Storage)
- react-router-dom v6 (HashRouter)
