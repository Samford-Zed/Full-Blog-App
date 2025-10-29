import { useState, useEffect } from "react";
import { Post } from "../types";
import {
  Calendar,
  User,
  Trash2,
  Edit,
  Heart,
  MessageSquare,
  Eye,
} from "lucide-react";
import api from "../api/client";
import Comments from "./Comments";

interface PostCardProps {
  post: Post;
  query?: string;
  onEdit?: (post: Post) => void;
  onDelete?: (id: number) => void;
  onView?: (post: Post) => void;
  showActions?: boolean;
  onTagClick?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  query,
  onEdit,
  onDelete,
  onView,
  showActions,
  onTagClick,
}) => {
  const [likes, setLikes] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // 🩵 Fetch total likes + user like status
  const loadLikes = async () => {
    try {
      const res = await api.get(`/posts/${post.id}/likes`);
      if (res?.data) {
        setLikes(res.data.count || 0);
        setLiked(!!res.data.liked);
      }
    } catch (err: any) {
      console.warn("⚠️ Could not load likes:", err.message);
    }
  };

  // ❤️ Toggle like/unlike
  const handleLike = async () => {
    if (loadingLike) return;
    try {
      setLoadingLike(true);
      await api.post(`/posts/${post.id}/like`);
      await loadLikes();
    } catch (err: any) {
      console.error("❌ Like request failed:", err.message);
    } finally {
      setLoadingLike(false);
    }
  };

  useEffect(() => {
    loadLikes();
  }, [post.id]);

  // 🧠 Highlight search term
  const highlightText = (text: string) => {
    if (!query?.trim()) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className='bg-yellow-200 text-gray-900 rounded px-1'>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className='bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-100'>
      {/* 🧾 Title */}
      <h3 className='text-2xl font-bold text-gray-800 mb-3'>
        {highlightText(post.title || "")}
      </h3>

      {/* 🧍 Author + Date */}
      <div className='flex items-center gap-4 text-sm text-gray-500 mb-4'>
        <div className='flex items-center gap-1'>
          <User className='w-4 h-4' />
          <span>{post.author?.username || post.author || "Unknown"}</span>
        </div>
        <div className='flex items-center gap-1'>
          <Calendar className='w-4 h-4' />
          <span>
            {post.created_at
              ? new Date(post.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>
      </div>

      {/* 📄 Content */}
      <div
        className='prose prose-sm text-gray-700 leading-relaxed mb-4 max-w-none'
        dangerouslySetInnerHTML={{ __html: post.content || "" }}
      />

      {/* 🏷 Tags */}
      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className='flex flex-wrap gap-2 mb-4'>
          {post.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className='px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100 hover:bg-blue-100 transition'
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* ❤️ Likes + 💬 Comments */}
      <div className='flex items-center justify-between mt-2'>
        <button
          onClick={handleLike}
          disabled={loadingLike}
          className={`flex items-center gap-2 text-sm transition ${
            liked ? "text-red-600" : "text-gray-600 hover:text-red-500"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition ${
              liked ? "fill-red-500 scale-110" : ""
            }`}
          />
          {loadingLike ? "..." : likes}
        </button>

        <button
          onClick={() => setShowComments((p) => !p)}
          className='flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition'
        >
          <MessageSquare className='w-4 h-4' />
          Comments
        </button>
      </div>

      {/* 🧰 Actions (Admin/User) */}
      {showActions && (onEdit || onDelete || onView) && (
        <div className='flex flex-wrap gap-3 pt-4 mt-4 border-t border-gray-100'>
          {onView && (
            <button
              onClick={() => onView(post)}
              className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium'
            >
              <Eye className='w-4 h-4' />
              View
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(post)}
              className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium'
            >
              <Edit className='w-4 h-4' />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium'
            >
              <Trash2 className='w-4 h-4' />
              Delete
            </button>
          )}
        </div>
      )}

      {/* 💬 Comments section */}
      {showComments && (
        <div className='mt-4'>
          <Comments postId={post.id} />
        </div>
      )}
    </div>
  );
};
