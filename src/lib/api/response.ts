import { NextResponse } from 'next/server';

// 표준 성공 응답
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

// 표준 에러 응답
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// 인증 실패 응답
export function unauthorizedResponse(message: string = '인증이 필요합니다') {
  return errorResponse(message, 401);
}

// 권한 없음 응답
export function forbiddenResponse(message: string = '권한이 없습니다') {
  return errorResponse(message, 403);
}

// Not Found 응답
export function notFoundResponse(message: string = '리소스를 찾을 수 없습니다') {
  return errorResponse(message, 404);
}

// 서버 에러 응답
export function serverErrorResponse(message: string = '서버 오류가 발생했습니다') {
  return errorResponse(message, 500);
}
