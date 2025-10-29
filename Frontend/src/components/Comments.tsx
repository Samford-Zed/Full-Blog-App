import { useState, useEffect } from "react";
import { MessageSquare, Send, CornerDownRight } from "lucide-react";
import api from "../api/client";

interface Comment {
  id: number;
  content: string;
  username: string;
  parent_comment_id?: number | null;
  replies?: Comment[];
}

export default function Comments({ postId }: { postId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const loadComments = async () => {
    const { data } = await api.get(`/posts/${postId}/comments`);
    setComments(data);
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await api.post(`/posts/${postId}/comments`, { content: newComment });
    setNewComment("");
    loadComments();
  };

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    await api.post(`/posts/${postId}/comments`, {
      content: replyContent,
      parent_comment_id: parentId,
    });
    setReplyContent("");
    setReplyingTo(null);
    loadComments();
  };

  const renderComments = (list: Comment[], depth = 0) => (
    <div className={`ml-${depth * 4}`}>
      {list.map((c) => (
        <div key={c.id} className='mb-4 border-l pl-3'>
          <p className='text-gray-800 font-medium'>{c.username}</p>
          <p className='text-gray-700 mb-2'>{c.content}</p>

          {replyingTo === c.id ? (
            <div className='flex gap-2 mb-2'>
              <input
                type='text'
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder='Write a reply...'
                className='flex-1 border rounded-lg px-3 py-1 text-sm'
              />
              <button
                onClick={() => handleReply(c.id)}
                className='bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 text-sm'
              >
                <Send className='w-4 h-4' />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setReplyingTo(c.id)}
              className='flex items-center text-gray-500 hover:text-blue-600 text-sm'
            >
              <CornerDownRight className='w-4 h-4 mr-1' /> Reply
            </button>
          )}

          {c.replies && c.replies.length > 0 && (
            <div className='ml-4 border-l pl-3 mt-2'>
              {renderComments(c.replies, depth + 1)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className='mt-6'>
      <h4 className='flex items-center gap-2 text-lg font-semibold mb-3 text-gray-800'>
        <MessageSquare className='w-5 h-5 text-blue-600' />
        Comments
      </h4>

      <div className='flex gap-2 mb-4'>
        <input
          type='text'
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder='Write a comment...'
          className='flex-1 border rounded-lg px-3 py-2 text-sm'
        />
        <button
          onClick={handleAddComment}
          className='bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 text-sm'
        >
          <Send className='w-4 h-4' />
        </button>
      </div>

      {comments.length === 0 ? (
        <p className='text-gray-500 text-sm'>No comments yet.</p>
      ) : (
        renderComments(comments)
      )}
    </div>
  );
}
