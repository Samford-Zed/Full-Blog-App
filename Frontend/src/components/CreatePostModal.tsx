import React, { useState } from "react";
import { X } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    [{ align: [] }],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "code-block",
  "list",
  "bullet",
  "link",
  "image",
  "align",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string) => Promise<void>;
}

export function CreatePostModal({ isOpen, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Please fill in both title and content.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit(title.trim(), content.trim());
      setTitle("");
      setContent("");
      onClose();
    } catch {
      setError("Failed to create post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition'
        >
          <X className='w-5 h-5' />
        </button>

        <h2 className='text-2xl font-bold mb-4 text-gray-800'>Create Post</h2>

        {/* Error */}
        {error && (
          <div className='mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2'>
            {error}
          </div>
        )}

        {/* Title */}
        <div className='space-y-4'>
          <input
            type='text'
            placeholder='Enter title...'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none'
          />

          {/* Content */}
          <ReactQuill
            value={content}
            onChange={setContent}
            modules={quillModules}
            formats={quillFormats}
            theme='snow'
            className='h-48 mb-10'
            placeholder='Write your post...'
          />
        </div>

        {/* Actions */}
        <div className='flex justify-end mt-8 gap-3'>
          <button
            onClick={onClose}
            disabled={loading}
            className='px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50'
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
