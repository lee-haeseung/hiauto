# API 문서

## 응답 형식

모든 API는 다음과 같은 표준 응답 형식을 사용합니다:

### 성공 응답
```json
{
  "success": true,
  "data": { ... }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 인증

API는 JWT 토큰 기반 인증을 사용합니다. 요청 헤더에 다음과 같이 포함:

```
Authorization: Bearer {token}
```

### 토큰 종류
- **관리자 토큰**: 관리자 로그인 시 발급
  - role: 'admin'
  - payload: { userId, username, role: 'admin' }
- **사용자 토큰**: 접근 코드 입력 시 발급  
  - role: 'access-key'
  - payload: { keyId, postId, role: 'access-key' }

---

## 인증 API

### POST /auth/admin-login
관리자 로그인

**요청**
```json
{
  "username": "admin",
  "password": "password"
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "role": "admin",
    "username": "admin"
  }
}
```

---

### POST /auth/access-key
접근 코드 입력

**요청**
```json
{
  "key": "access-key-string"
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "role": "access-key",
    "postId": 1
  }
}
```

**JWT Payload 구조**
```json
{
  "keyId": 1,
  "postId": 1,
  "role": "access-key",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 관리자 API

### GET /admin/boards
게시판 목록 조회

**인증**: 관리자

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "공지사항",
      "order": 0,
      "createdAt": "2026-01-12T00:00:00.000Z"
    }
  ]
}
```

---

### POST /admin/boards
게시판 생성

**인증**: 관리자

**요청**
```json
{
  "name": "새 게시판"
}
```

---

### PATCH /admin/boards/{boardId}
게시판 이름 수정

**인증**: 관리자

**요청**
```json
{
  "name": "수정된 이름"
}
```

---

### PATCH /admin/boards
게시판 순서 수정

**인증**: 관리자

**요청**
```json
{
  "boards": [
    { "id": 1, "order": 0 },
    { "id": 2, "order": 1 }
  ]
}
```

---

### GET /admin/sub-boards
하위 게시판 목록 조회

**인증**: 관리자

---

### POST /admin/sub-boards
하위 게시판 생성

**인증**: 관리자

**요청**
```json
{
  "boardId": 1,
  "name": "새 하위 게시판"
}
```

---

### PATCH /admin/sub-boards/{subBoardId}
하위 게시판 이름 수정

**인증**: 관리자

**요청**
```json
{
  "name": "수정된 이름"
}
```

---

### PATCH /admin/sub-boards
하위 게시판 순서 수정

**인증**: 관리자

**요청**
```json
{
  "subBoards": [
    { "id": 1, "order": 0 },
    { "id": 2, "order": 1 }
  ]
}
```

---

## 게시글 API (관리자)

### GET /admin/posts
게시글 목록 조회 (필터링)

**인증**: 관리자

**쿼리 파라미터**
- `subBoardId` (optional): 하위 게시판 ID
- `search` (optional): 검색어
- `page` (optional, default: 1): 페이지 번호
- `pageSize` (optional, default: 20): 페이지 크기

**응답**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

### POST /admin/posts
게시글 생성

**인증**: 관리자

**요청**
```json
{
  "subBoardId": 1,
  "title": "제목",
  "content": "내용"
}
```

---

### PUT /admin/posts/{postId}
게시글 수정

**인증**: 관리자

**요청**
```json
{
  "subBoardId": 1,
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

---

## 접근 코드 API (관리자)

### GET /admin/access-keys
접근 코드 목록 조회 (필터링)

**인증**: 관리자

**쿼리 파라미터**
- `postId` (optional): 게시글 ID
- `search` (optional): 검색어
- `page` (optional, default: 1): 페이지 번호
- `pageSize` (optional, default: 20): 페이지 크기

---

### POST /admin/access-keys
접근 코드 생성

**인증**: 관리자

**요청**
```json
{
  "postId": 1,
  "memo": "메모",
  "expiresAt": "2026-12-31T23:59:59.999Z"
}
```

---

### PATCH /admin/access-keys/{keyId}
접근 코드 수정 (메모/만료일)

**인증**: 관리자

**요청**
```json
{
  "memo": "수정된 메모",
  "expiresAt": "2027-12-31T23:59:59.999Z"
}
```

---

### DELETE /admin/access-keys/{keyId}
접근 코드 삭제

**인증**: 관리자

---

## 피드백 API (관리자)

### GET /admin/feedbacks
피드백 목록 조회

**인증**: 관리자

**쿼리 파라미터**
- `postId` (optional): 게시글 ID
- `isSolved` (optional): 해결 여부 (true/false)
- `search` (optional): 검색어
- `page` (optional, default: 1): 페이지 번호
- `pageSize` (optional, default: 20): 페이지 크기

---

### GET /admin/feedbacks/summary
게시물 문제 해결 비율 조회

**인증**: 관리자

**쿼리 파라미터**
- `postId` (optional): 게시글 ID (없으면 전체)

**응답**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "solved": 75,
    "unsolved": 25,
    "solveRate": 75.00
  }
}
```

---

## 게시글 API (사용자)

### GET /posts/{postId}
게시글 조회

**인증**: 필수 (관리자 또는 사용자)

**권한**
- 관리자: 모든 게시글 조회 가능
- 사용자: 본인의 접근 코드에 등록된 게시글만 조회 가능
- 비로그인: 접근 불가

**응답 (성공)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "subBoardId": 1,
    "title": "게시글 제목",
    "content": "게시글 내용",
    "createdAt": "2026-01-12T00:00:00.000Z",
    "updatedAt": "2026-01-12T00:00:00.000Z"
  }
}
```

**응답 (권한 없음)**
```json
{
  "success": false,
  "error": "로그인이 필요합니다"
}
```

또는

```json
{
  "success": false,
  "error": "이 게시글에 접근할 권한이 없습니다"
}
```

---

## 피드백 API (사용자)

### POST /posts/{postId}/feedbacks
피드백 생성

**인증**: 사용자 (접근 코드 필수)

**권한**
- 본인의 접근 코드에 등록된 게시글에만 피드백 작성 가능
- 접근 코드당 1개의 피드백만 작성 가능

**요청**
```json
{
  "phone": "010-1234-5678",
  "description": "피드백 내용"
}
```

**응답 (성공)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "postId": 1,
    "accessKeyId": 1,
    "accessKeyMemo": "메모",
    "phone": "010-1234-5678",
    "isSolved": false,
    "description": "피드백 내용",
    "createdAt": "2026-01-12T00:00:00.000Z",
    "updatedAt": "2026-01-12T00:00:00.000Z"
  }
}
```

**응답 (권한 없음)**
```json
{
  "success": false,
  "error": "이 게시글에 피드백을 작성할 권한이 없습니다"
}
```

**응답 (중복 작성)**
```json
{
  "success": false,
  "error": "이미 피드백을 작성하셨습니다. 수정을 이용해주세요"
}
```

---

### PUT /posts/{postId}/feedbacks/{feedbackId}
피드백 수정

**인증**: 사용자 (본인만)

**요청**
```json
{
  "phone": "010-1234-5678",
  "description": "수정된 피드백 내용",
  "isSolved": true
}
```

---

### GET /feedbacks/{feedbackId}
피드백 조회

**인증**: 관리자 또는 사용자 (본인만)

---

## 파일 업로드 API

### POST /upload
파일 업로드

**인증**: 관리자 또는 사용자

**요청** (multipart/form-data)
- `file`: 업로드할 파일

**제약**
- 사용자: 이미지만 가능 (jpg, png, gif, webp), 최대 5MB
- 관리자: 모든 파일 타입 가능, 최대 50MB

**응답**
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "fileName": "image.jpg",
    "filePath": "uploads/123456-image.jpg",
    "fileSize": 102400,
    "mimeType": "image/jpeg"
  }
}
```
