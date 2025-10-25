import { Post } from '../types';
import { Calendar, User, Trash2, Edit } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onEdit, onDelete, showActions }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-3">{post.title}</h3>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span>{post.author?.username || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>

      {showActions && (onEdit || onDelete) && (
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={() => onEdit(post)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
