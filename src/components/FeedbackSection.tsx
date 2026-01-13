'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api/client';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { FontSize } from '@/lib/editor/FontSize';
import { Video } from '@/lib/editor/Video';
import { File } from '@/lib/editor/File';

interface Feedback {
  id: number;
  postId: number;
  accessKeyId: number;
  phone: string;
  isSolved: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackSectionProps {
  postId: number;
}

export default function FeedbackSection({ postId }: FeedbackSectionProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
    content: '<p style="font-size: 16px">피드백 내용을 입력해주세요.</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[300px] p-6',
      },
    },
  });

  useEffect(() => {
    loadFeedback();
  }, [postId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // 내 피드백 조회
      const feedbacks = await apiGet<Feedback[]>(
        `/api/posts/${postId}/feedbacks`,
        token || undefined
      );
      
      if (feedbacks && feedbacks.length > 0) {
        setFeedback(feedbacks[0]);
        if (!feedbacks[0].isSolved) {
          setPhone(feedbacks[0].phone);
          if (editor) {
            editor.commands.setContent(feedbacks[0].description || '');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYesClick = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');

      if (feedback && isEditing) {
        // 수정
        await apiPut(
          `/api/feedbacks/${feedback.id}`,
          {
            isSolved: true,
            phone: '',
            description: '',
          },
          token || undefined
        );
      } else {
        // 새로 생성
        await apiPost(
          `/api/posts/${postId}/feedbacks`,
          {
            isSolved: true,
            phone: '',
            description: '',
          },
          token || undefined
        );
      }

      await loadFeedback();
      setIsEditing(false);
      setShowEditor(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : '피드백 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoClick = () => {
    setShowEditor(true);
    setError('');
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setError('');

      if (!phone.trim()) {
        setError('연락처를 입력해주세요.');
        return;
      }

      const description = editor?.getHTML() || '';
      if (!description || description === '<p style="font-size: 16px">피드백 내용을 입력해주세요.</p>') {
        setError('피드백 내용을 입력해주세요.');
        return;
      }

      const token = localStorage.getItem('token');

      if (feedback && isEditing) {
        // 수정
        await apiPut(
          `/api/feedbacks/${feedback.id}`,
          {
            isSolved: false,
            phone,
            description,
          },
          token || undefined
        );
      } else {
        // 새로 생성
        await apiPost(
          `/api/posts/${postId}/feedbacks`,
          {
            isSolved: false,
            phone,
            description,
          },
          token || undefined
        );
      }

      await loadFeedback();
      setIsEditing(false);
      setShowEditor(false);
      setPhone('');
      editor?.commands.setContent('<p style="font-size: 16px">피드백 내용을 입력해주세요.</p>');
    } catch (error) {
      setError(error instanceof Error ? error.message : '피드백 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (!feedback?.isSolved) {
      setShowEditor(true);
      setPhone(feedback?.phone || '');
      if (editor && feedback?.description) {
        editor.commands.setContent(feedback.description);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        throw new Error('파일 업로드에 실패했습니다');
      }

      const data = await response.json();
      const url = data.data.url;

      // 파일 타입에 따라 적절한 요소 삽입
      if (file.type.startsWith('image/')) {
        editor?.chain().focus().setImage({ src: url }).run();
      } else if (file.type.startsWith('video/')) {
        editor?.chain().focus().setVideo({ src: url }).run();
      } else {
        editor?.chain().focus().setFile({ src: url, fileName: file.name }).run();
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="mt-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-gray-500">피드백 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">피드백</h2>

        {/* 기존 피드백 표시 */}
        {feedback && !isEditing ? (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">내 피드백:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      feedback.isSolved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {feedback.isSolved ? '예 (해결됨)' : '아니오 (미해결)'}
                  </span>
                </div>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                >
                  수정하기
                </button>
              </div>
              {!feedback.isSolved && (
                <div className="mt-3">
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">연락처:</span>
                    <span className="ml-2 text-gray-600">{feedback.phone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">상세 내용:</span>
                    <div
                      className="mt-2 prose prose-sm sm:prose lg:prose-lg max-w-none p-3 bg-white rounded border border-gray-200 post-content"
                      dangerouslySetInnerHTML={{ __html: feedback.description }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                {feedback.updatedAt !== feedback.createdAt
                  ? `수정일: ${new Date(feedback.updatedAt).toLocaleString('ko-KR')}`
                  : `작성일: ${new Date(feedback.createdAt).toLocaleString('ko-KR')}`}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 피드백 입력 폼 */}
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                이 게시글의 내용이 문제를 해결해주었나요?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleYesClick}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                >
                  예
                </button>
                <button
                  onClick={handleNoClick}
                  disabled={submitting}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition font-medium"
                >
                  아니오
                </button>
              </div>
            </div>

            {/* "아니오" 선택 시 에디터 표시 */}
            {showEditor && (
              <div className="mt-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="연락 가능한 전화번호 또는 이메일"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상세 내용 <span className="text-red-500">*</span>
                  </label>
                  
                  {/* 에디터 툴바 */}
                  <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-2 rounded hover:bg-gray-200 ${
                        editor?.isActive('bold') ? 'bg-gray-300' : ''
                      }`}
                      title="굵게"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-2 rounded hover:bg-gray-200 ${
                        editor?.isActive('italic') ? 'bg-gray-300' : ''
                      }`}
                      title="기울임"
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={`p-2 rounded hover:bg-gray-200 ${
                        editor?.isActive('underline') ? 'bg-gray-300' : ''
                      }`}
                      title="밑줄"
                    >
                      <u>U</u>
                    </button>
                    <div className="w-px bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                      title="파일 업로드"
                    >
                      📎 파일
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                  </div>

                  {/* 에디터 */}
                  <div className="border border-t-0 border-gray-300 rounded-b-lg bg-white">
                    <EditorContent editor={editor} />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                >
                  {submitting ? '제출 중...' : '제출하기'}
                </button>
              </div>
            )}
          </>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
