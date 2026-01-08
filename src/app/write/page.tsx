'use client';

import AdminLayout from '@/components/AdminLayout';
import Image from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Board {
  id: number;
  name: string;
}

interface SubBoard {
  id: number;
  boardId: number;
  name: string;
}

export default function WritePage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [subBoards, setSubBoards] = useState<SubBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedSubBoardId, setSelectedSubBoardId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '<p>내용을 입력해주세요.</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (selectedBoardId) {
      loadSubBoards(parseInt(selectedBoardId));
    } else {
      setSubBoards([]);
      setSelectedSubBoardId('');
    }
  }, [selectedBoardId]);

  const loadBoards = async () => {
    try {
      const response = await fetch('/api/boards');
      const data = await response.json();
      setBoards(data || []);
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const loadSubBoards = async (boardId: number) => {
    try {
      const response = await fetch(`/api/sub-boards?boardId=${boardId}`);
      const data = await response.json();
      setSubBoards(data || []);
    } catch (error) {
      console.error('Failed to load sub-boards:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const fileType = file.type;
      
      // 모든 파일을 이미지처럼 처리 (URL을 에디터에 삽입)
      if (fileType.startsWith('image/')) {
        editor.chain().focus().setImage({ src: data.url }).run();
      } else if (fileType.startsWith('video/')) {
        editor.chain().focus().insertContent(`<video src="${data.url}" controls style="max-width: 100%;"></video>`).run();
      } else if (fileType === 'application/pdf') {
        editor.chain().focus().insertContent(`<iframe src="${data.url}" style="width: 100%; height: 600px;"></iframe>`).run();
      } else {
        editor.chain().focus().insertContent(`<a href="${data.url}" target="_blank">${file.name}</a>`).run();
      }
      
      alert('파일이 업로드되었습니다!');
    } catch (error) {
      console.error('File upload error:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubBoardId) {
      alert('하위 게시판을 선택해주세요.');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!editor) {
      alert('에디터를 초기화하는 중입니다.');
      return;
    }

    const content = editor.getHTML();

    setSubmitting(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subBoardId: parseInt(selectedSubBoardId),
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const post = await response.json();
      alert('게시글이 작성되었습니다!');
      router.push(`/post/${post.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">글쓰기</h1>

        <div className="space-y-4">
          {/* 게시판 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">게시판 선택 *</label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">게시판을 선택하세요</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </div>

          {/* 하위 게시판 선택 */}
          {selectedBoardId && (
            <div>
              <label className="block text-sm font-medium mb-2">하위 게시판 선택 *</label>
              <select
                value={selectedSubBoardId}
                onChange={(e) => setSelectedSubBoardId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">하위 게시판을 선택하세요</option>
                {subBoards.map((subBoard) => (
                  <option key={subBoard.id} value={subBoard.id}>
                    {subBoard.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="제목을 입력하세요"
            />
          </div>

          {/* 파일 업로드 */}
          <div>
            <label className="block text-sm font-medium mb-2">파일 업로드 (이미지, 동영상, PDF 등)</label>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full px-3 py-2 border rounded"
              accept="*/*"
            />
            {uploading && <p className="text-sm text-gray-500 mt-1">업로드 중...</p>}
          </div>

          {/* 에디터 */}
          <div>
            <label className="block text-sm font-medium mb-2">내용 *</label>
            <div className="border rounded bg-white">
              {/* 툴바 */}
              {editor && (
                <div className="border-b p-2 flex flex-wrap gap-1 bg-gray-50">
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('bold') ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('italic') ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    <em>I</em>
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('strike') ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    <s>S</s>
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    H1
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    H2
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    H3
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('bulletList') ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    • 목록
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('orderedList') ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    1. 목록
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`px-3 py-1 border rounded ${editor.isActive('blockquote') ? 'bg-blue-200' : 'bg-white'}`}
                  >
                    " 인용
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    className="px-3 py-1 border rounded bg-white"
                  >
                    ―
                  </button>
                  <button
                    onClick={() => editor.chain().focus().undo().run()}
                    className="px-3 py-1 border rounded bg-white"
                  >
                    ↶ 실행취소
                  </button>
                  <button
                    onClick={() => editor.chain().focus().redo().run()}
                    className="px-3 py-1 border rounded bg-white"
                  >
                    ↷ 다시실행
                  </button>
                </div>
              )}
              {/* 에디터 컨텐츠 */}
              <EditorContent editor={editor} className="min-h-[400px]" />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-400 text-white rounded"
              disabled={submitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded"
            >
              {submitting ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
