// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API 호출 옵션
interface FetchOptions extends RequestInit {
  token?: string;
}

// 공통 API 호출 함수
export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers, ...restOptions } = options;

  // 헤더 구성
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  } as Record<string, string>;

  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // API 호출
  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });

  // 응답 파싱
  const result: ApiResponse<T> = await response.json();

  // 에러 처리
  if (!response.ok || !result.success) {
    throw new Error(result.error || `API 요청 실패: ${response.status}`);
  }

  // successResponse 구조에서 data 추출
  if (result.data === undefined) {
    throw new Error('응답 데이터가 없습니다.');
  }

  return result.data;
}

// GET 요청
export async function apiGet<T>(url: string, token?: string): Promise<T> {
  return apiFetch<T>(url, { method: 'GET', token });
}

// POST 요청
export async function apiPost<T>(
  url: string,
  body?: unknown,
  token?: string
): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    token,
  });
}

// PUT 요청
export async function apiPut<T>(
  url: string,
  body?: unknown,
  token?: string
): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    token,
  });
}

// DELETE 요청
export async function apiDelete<T>(url: string, token?: string): Promise<T> {
  return apiFetch<T>(url, { method: 'DELETE', token });
}
