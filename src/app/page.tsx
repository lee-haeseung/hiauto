import AdminLayout from '@/components/AdminLayout';

export default function Home() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <h1 className="text-2xl font-bold mb-2">환영합니다</h1>
          <p>왼쪽 메뉴에서 게시판을 선택하세요.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
