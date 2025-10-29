import { useState } from "react";
import { Tag } from "lucide-react";
import api from "../api/client";
import { Post } from "../types";

interface Props {
  onFilter: (posts: Post[]) => void;
  onReset: () => void;
}

export default function TagFilterBar({ onFilter, onReset }: Props) {
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim()) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/posts/tag/${tag}`);
      onFilter(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleFilter}
      className='flex items-center gap-3 bg-white shadow-sm border rounded-lg px-4 py-2 mb-6'
    >
      <Tag className='text-blue-600 w-5 h-5' />
      <input
        type='text'
        placeholder='Filter by tag (e.g. react)'
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className='flex-1 outline-none text-gray-700'
      />
      <button
        type='submit'
        disabled={loading}
        className='bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm'
      >
        {loading ? "Filtering..." : "Filter"}
      </button>
      <button
        type='button'
        onClick={() => {
          setTag("");
          onReset();
        }}
        className='text-gray-500 hover:text-gray-700 text-sm'
      >
        Reset
      </button>
    </form>
  );
}
