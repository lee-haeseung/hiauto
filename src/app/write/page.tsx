'use client';

import AdminLayout from '@/components/AdminLayout';
import { File } from '@/lib/editor/File';
import { Video } from '@/lib/editor/Video';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Video,
      File,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content: '<p>내용을 입력해주세요.</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[500px] p-6',
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

      // 파일 타입에 따라 적절한 방식으로 삽입
      if (fileType.startsWith('image/')) {
        editor.chain().focus().setImage({ src: data.url }).run();
      } else if (fileType.startsWith('video/')) {
        editor.chain().focus().setVideo({ src: data.url }).run();
      } else {
        editor.chain().focus().setFile({ src: data.url, fileName: file.name }).run();
      }

      alert('파일이 업로드되었습니다!');
      
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL을 입력하세요:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">글쓰기</h1>

        <div className="space-y-6">
          {/* 게시판 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">게시판 선택 *</label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="제목을 입력하세요"
            />
          </div>

          {/* 에디터 */}
          <div>
            <label className="block text-sm font-medium mb-2">내용 *</label>
            <div className="border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden">
              {/* 툴바 */}
              {editor && (
                <div className="border-b bg-gray-50 p-3 flex flex-wrap gap-1 sticky top-0 z-10">
                  {/* 텍스트 서식 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="굵게"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="기울임"
                    >
                      <em>I</em>
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('underline') ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="밑줄"
                    >
                      <u>U</u>
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="취소선"
                    >
                      <s>S</s>
                    </button>
                  </div>

                  {/* 제목 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="제목 1"
                    >
                      H1
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="제목 2"
                    >
                      H2
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="제목 3"
                    >
                      H3
                    </button>
                  </div>

                  {/* 정렬 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <button
                      onClick={() => editor.chain().focus().setTextAlign('left').run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="왼쪽 정렬"
                    >
                      ≡
                    </button>
                    <button
                      onClick={() => editor.chain().focus().setTextAlign('center').run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="가운데 정렬"
                    >
                      ≣
                    </button>
                    <button
                      onClick={() => editor.chain().focus().setTextAlign('right').run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="오른쪽 정렬"
                    >
                      ≡
                    </button>
                  </div>

                  {/* 목록 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <button
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="글머리 기호"
                    >
                      • 목록
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="번호 매기기"
                    >
                      1. 목록
                    </button>
                  </div>

                  {/* 인용 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <button
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('blockquote') ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="인용"
                    >
                      &quot; 인용
                    </button>
                  </div>

                  {/* 링크 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <button
                      onClick={setLink}
                      className={`px-3 py-2 rounded hover:bg-gray-200 transition ${
                        editor.isActive('link') ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title="링크"
                    >
                      🔗 링크
                    </button>
                  </div>

                  {/* 파일 업로드 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-2 rounded bg-green-100 text-green-700 hover:bg-green-200 transition disabled:opacity-50"
                      title="파일 업로드"
                    >
                      {uploading ? '업로드 중...' : '📎 파일'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                    />
                  </div>

                  {/* 기타 */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => editor.chain().focus().setHorizontalRule().run()}
                      className="px-3 py-2 rounded hover:bg-gray-200 transition"
                      title="구분선"
                    >
                      ―
                    </button>
                    <button
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="px-3 py-2 rounded hover:bg-gray-200 transition disabled:opacity-30"
                      title="실행취소"
                    >
                      ↶
                    </button>
                    <button
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="px-3 py-2 rounded hover:bg-gray-200 transition disabled:opacity-30"
                      title="다시실행"
                    >
                      ↷
                    </button>
                  </div>
                </div>
              )}
              {/* 에디터 컨텐츠 */}
              <EditorContent editor={editor} className="min-h-[500px]" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              💡 이미지, 동영상, PDF 등 다양한 파일을 업로드하여 글에 삽입할 수 있습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
              disabled={submitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {submitting ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
