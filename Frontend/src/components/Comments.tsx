import { useState, useEffect } from "react";
import api from "../api/client";

export default function Comments({ postId }: { postId: number }) {
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");

  const loadComments = async () => {
    const { data } = await api.get(`/posts/${postId}/comments`);
    setComments(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await api.post(`/posts/${postId}/comments`, { content });
    setContent("");
    await loadComments();
  };

  useEffect(() => {
    loadComments();
  }, []);

  return (
    <div className='mt-6'>
      <h3 className='text-lg font-semibold mb-3'>Comments</h3>
      <form onSubmit={handleSubmit} className='flex gap-2 mb-4'>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder='Write a comment...'
          className='flex-1 border rounded-lg px-3 py-2'
        />
        <button className='bg-blue-600 text-white px-4 py-2 rounded-lg'>
          Post
        </button>
      </form>
      <div className='space-y-2'>
        {comments.map((c) => (
          <div key={c.id} className='bg-gray-50 p-3 rounded-lg'>
            <p className='text-sm text-gray-700'>
              <strong>{c.username}</strong>: {c.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
