'use client';

import AdminSidebar from '@/components/AdminSidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      console.log('AdminLayout 인증 체크:', { token, role });

      if (!token || role !== 'admin') {
        console.log('인증 실패, /admin/login으로 리다이렉트');
        router.push('/admin/login');
        return;
      }

      console.log('인증 성공');
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">로딩중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-white">{children}</main>
    </div>
  );
}
