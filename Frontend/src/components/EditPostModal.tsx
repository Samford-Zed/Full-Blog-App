import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Post } from "../types";
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
  post: Post | null;
  onClose: () => void;
  onSubmit: (id: number, title: string, content: string) => Promise<void>;
}

export function EditPostModal({ isOpen, post, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content || "");
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    await onSubmit(post.id, title, content);
    setLoading(false);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative'>
        <button
          onClick={onClose}
          className='absolute right-4 top-4 text-gray-400 hover:text-gray-600'
        >
          <X className='w-5 h-5' />
        </button>

        <h2 className='text-2xl font-bold mb-4 text-gray-800'>Edit Post</h2>

        <div className='space-y-4'>
          <input
            type='text'
            placeholder='Edit title...'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='w-full border rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none'
          />

          <ReactQuill
            value={content}
            onChange={setContent}
            theme='snow'
            className='h-48 mb-10'
            placeholder='Update post content...'
          />
        </div>

        <div className='flex justify-end mt-8'>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50'
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
