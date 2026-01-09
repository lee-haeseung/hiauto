'use client';

import AdminLayout from '@/components/AdminLayout';
import { File } from '@/lib/editor/File';
import { FontSize } from '@/lib/editor/FontSize';
import { Video } from '@/lib/editor/Video';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import 'tippy.js/dist/tippy.css';

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
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');
  const [boards, setBoards] = useState<Board[]>([]);
  const [subBoards, setSubBoards] = useState<SubBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedSubBoardId, setSelectedSubBoardId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkPopoverPosition, setLinkPopoverPosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState<string | null>(null);
  // rem 또는 다른 단위를 px로 변환
  const normalizeFontSize = (size: string | null): string => {
    if (!size) return '16px';
    
    // 이미 px 단위면 그대로 반환
    if (size.endsWith('px')) return size;
    
    // rem 단위 변환 (1rem = 16px 기준)
    if (size.endsWith('rem')) {
      const remValue = parseFloat(size);
      return `${Math.round(remValue * 16)}px`;
    }
    
    // em 단위 변환 (1em = 16px 기준)
    if (size.endsWith('em')) {
      const emValue = parseFloat(size);
      return `${Math.round(emValue * 16)}px`;
    }
    
    return size;
  };
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
      FontSize,
      Color,
    ],
    content: '<p style="font-size: 16px">내용을 입력해주세요.</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[500px] p-6',
      },
      handleClickOn: (view, pos, node, nodePos, event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'A' && target.closest('.ProseMirror')) {
          event.preventDefault();
          setShowLinkPopover(true);
          const rect = target.getBoundingClientRect();
          setLinkPopoverPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const fontSize = editor.getAttributes('textStyle').fontSize;
      setCurrentFontSize(normalizeFontSize(fontSize));
    },
    onSelectionUpdate: ({ editor }) => {
      const fontSize = editor.getAttributes('textStyle').fontSize;
      setCurrentFontSize(normalizeFontSize(fontSize));
    },
  });

  useEffect(() => {
    loadBoards();
    
    // 수정 모드: postId가 있으면 기존 게시물 데이터 로드
    if (postId) {
      loadPostData(postId);
    }
  }, [postId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showLinkPopover && !target.closest('.link-popover') && !target.closest('a')) {
        setShowLinkPopover(false);
      }
    };

    if (showLinkPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLinkPopover]);

  useEffect(() => {
    if (selectedBoardId) {
      loadSubBoards(parseInt(selectedBoardId));
    } else {
      setSubBoards([]);
      setSelectedSubBoardId('');
    }
  }, [selectedBoardId]);

  // 에디터가 준비되고 postContent가 있으면 내용 설정
  useEffect(() => {
    if (editor && postContent) {
      editor.commands.setContent(postContent);
      setPostContent(null); // 한 번만 설정되도록
    }
  }, [editor, postContent]);

  const loadBoards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/boards', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setBoards(data || []);
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const loadSubBoards = async (boardId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sub-boards?boardId=${boardId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setSubBoards(data || []);
    } catch (error) {
      console.error('Failed to load sub-boards:', error);
    }
  };

  const loadPostData = async (postId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다.');
      }

      const post = await response.json();
      
      // 게시판 정보를 가져오기 위해 subBoardId로 subBoard 조회
      const subBoardResponse = await fetch(`/api/sub-boards?subBoardId=${post.subBoardId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const subBoardData = await subBoardResponse.json();
      
      // 게시판 선택
      if (subBoardData && subBoardData.boardId) {
        setSelectedBoardId(String(subBoardData.boardId));
        // 하위 게시판 목록 로드
        await loadSubBoards(subBoardData.boardId);
        setSelectedSubBoardId(String(post.subBoardId));
      }
      
      // 제목 설정
      setTitle(post.title);
      
      // 에디터 내용을 state에 저장 (editor가 준비되면 useEffect에서 설정)
      setPostContent(post.content);
    } catch (error) {
      console.error('Failed to load post:', error);
      alert('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

  const openLink = () => {
    if (!editor) return;
    const { href } = editor.getAttributes('link');
    if (href) {
      window.open(href, '_blank');
    }
  };

  const copyLink = () => {
    if (!editor) return;
    const { href } = editor.getAttributes('link');
    if (href) {
      navigator.clipboard.writeText(href);
      alert('링크가 복사되었습니다!');
    }
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
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
      const token = localStorage.getItem('token');
      
      // 수정 모드인지 생성 모드인지 구분
      const isEditMode = !!postId;
      const url = isEditMode ? `/api/posts/${postId}` : '/api/posts';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subBoardId: parseInt(selectedSubBoardId),
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error(isEditMode ? 'Failed to update post' : 'Failed to create post');
      }

      const post = await response.json();
      alert(isEditMode ? '게시글이 수정되었습니다!' : '게시글이 작성되었습니다!');
      router.push(`/post/${post.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      alert(postId ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{postId ? '글 수정' : '글쓰기'}</h1>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">게시글을 불러오는 중...</div>
          </div>
        )}

        {!loading && (

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

                  {/* 글자 크기 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <select
                      value={currentFontSize}
                      onChange={(e) => {
                        const size = e.target.value;
                        if (size) {
                          editor.chain().focus().setFontSize(size).run();
                        } else {
                          editor.chain().focus().unsetFontSize().run();
                        }
                      }}
                      className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
                      title="글자 크기"
                    >
                      <option value="">크기</option>
                      <option value="12px">12px</option>
                      <option value="14px">14px</option>
                      <option value="16px">16px</option>
                      <option value="18px">18px</option>
                      <option value="20px">20px</option>
                      <option value="24px">24px</option>
                      <option value="28px">28px</option>
                      <option value="32px">32px</option>
                      <option value="36px">36px</option>
                      {currentFontSize && !['', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'].includes(currentFontSize) && (
                        <option value={currentFontSize}>{currentFontSize}</option>
                      )}
                    </select>
                  </div>

                  {/* 글자 색상 */}
                  <div className="flex gap-1 pr-2 border-r border-gray-300">
                    <input
                      type="color"
                      onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                      className="w-10 h-8 border rounded cursor-pointer"
                      title="글자 색상"
                    />
                    <button
                      onClick={() => editor.chain().focus().unsetColor().run()}
                      className="px-2 py-1 border rounded text-xs hover:bg-gray-200 transition"
                      title="색상 제거"
                    >
                      초기화
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
            
            {/* 링크 팝오버 - 에디터 외부에 배치 */}
            {showLinkPopover && editor && editor.isActive('link') && (
              <div 
                className="link-popover fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-[350px]"
                style={{ top: `${linkPopoverPosition.top + 5}px`, left: `${linkPopoverPosition.left}px` }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <span className="text-xs text-gray-500">링크:</span>
                    <a
                      href={editor.getAttributes('link').href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate flex-1"
                    >
                      {editor.getAttributes('link').href}
                    </a>
                  </div>
                  <div className="flex gap-2 flex-nowrap">
                    <button
                      onClick={() => {
                        setShowLinkPopover(false);
                        setLink();
                      }}
                      className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition whitespace-nowrap"
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => {
                        copyLink();
                        setShowLinkPopover(false);
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition whitespace-nowrap"
                    >
                      📋 복사
                    </button>
                    <button
                      onClick={() => {
                        removeLink();
                        setShowLinkPopover(false);
                      }}
                      className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition whitespace-nowrap"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              </div>
            )}
            
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
              {submitting ? (postId ? '수정 중...' : '작성 중...') : (postId ? '수정하기' : '작성하기')}
            </button>
          </div>
        </div>
        )}
      </div>
    </AdminLayout>
  );
}
