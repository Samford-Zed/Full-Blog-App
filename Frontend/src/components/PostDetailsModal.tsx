import { X, Calendar, User, MessageCircle } from "lucide-react";
import { Post } from "../types";

interface Comment {
  id: number;
  content: string;
  username: string;
  created_at: string;
}

interface PostDetailsModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  comments?: Comment[];
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({
  isOpen,
  post,
  onClose,
  comments = [],
}) => {
  if (!isOpen || !post) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden'>
        {/* Header */}
        <div className='flex justify-between items-center border-b p-4'>
          <h2 className='text-xl font-semibold text-gray-800'>Post Details</h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 transition'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Body */}
        <div className='p-6 space-y-4'>
          <h3 className='text-2xl font-bold text-gray-900'>{post.title}</h3>

          <div className='flex items-center gap-4 text-sm text-gray-500'>
            <div className='flex items-center gap-1'>
              <User className='w-4 h-4' />
              <span>{post.author || "Unknown"}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Calendar className='w-4 h-4' />
              <span>
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <p className='text-gray-700 leading-relaxed'>{post.content}</p>

          {/* Comments Section */}
          <div className='mt-6 border-t pt-4'>
            <div className='flex items-center gap-2 mb-3'>
              <MessageCircle className='w-5 h-5 text-blue-600' />
              <h4 className='font-semibold text-gray-800'>Comments</h4>
            </div>

            {comments.length === 0 ? (
              <p className='text-gray-500 text-sm'>No comments yet.</p>
            ) : (
              <div className='space-y-3 max-h-64 overflow-y-auto'>
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className='bg-gray-50 rounded-lg p-3 border border-gray-100'
                  >
                    <p className='text-sm text-gray-800'>{c.content}</p>
                    <div className='text-xs text-gray-500 mt-1 flex items-center gap-1'>
                      <User className='w-3 h-3' />
                      <span>{c.username}</span>
                      <span>·</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
