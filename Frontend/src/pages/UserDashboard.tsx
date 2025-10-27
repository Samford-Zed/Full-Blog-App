import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { postsApi } from "../api/posts";
import api from "../api/client";
import { Post } from "../types";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";
import { LogOut, Plus, BookOpen, Search } from "lucide-react";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔍 Search state
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postsApi.getAllPosts();
      setPosts(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Handle search (by text or tag)
  const handleSearch = async (e?: React.FormEvent, tagQuery?: string) => {
    e?.preventDefault();
    const searchTerm = tagQuery || query.trim();

    if (!searchTerm) {
      loadPosts();
      return;
    }

    try {
      setSearching(true);
      const { data } = await api.get(`/search?q=${searchTerm}`);
      setPosts(data);
      setError("");
      if (tagQuery) setQuery(tagQuery);
    } catch (err: any) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleCreatePost = async (title: string, content: string) => {
    await postsApi.createPost({ title, content });
    await loadPosts();
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Navbar */}
      <nav className='bg-white shadow-md border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center gap-3'>
              <BookOpen className='w-8 h-8 text-blue-600' />
              <h1 className='text-2xl font-bold text-gray-800'>
                Blog Dashboard
              </h1>
            </div>

            <div className='flex items-center gap-4'>
              <span className='text-gray-700 font-medium'>
                Welcome, <span className='text-blue-600'>{user?.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition'
              >
                <LogOut className='w-4 h-4' />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header + Search + Create */}
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4'>
          <div>
            <h2 className='text-3xl font-bold text-gray-800'>All Posts</h2>
            <p className='text-gray-600 mt-1'>
              Browse, search, and create blog posts
            </p>
          </div>

          <div className='flex items-center gap-3'>
            {/* 🔍 Search Bar */}
            <form
              onSubmit={handleSearch}
              className='relative flex items-center w-full md:w-72'
            >
              <Search className='absolute left-3 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search posts...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none'
              />
              {query && (
                <button
                  type='button'
                  onClick={() => {
                    setQuery("");
                    loadPosts();
                  }}
                  className='absolute right-3 text-gray-400 hover:text-gray-600'
                >
                  ✕
                </button>
              )}
            </form>

            {/* ➕ Create Post */}
            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg font-medium'
            >
              <Plus className='w-5 h-5' />
              Create
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-600'>{error}</p>
          </div>
        )}

        {/* Post list / loading states */}
        {loading || searching ? (
          <div className='flex items-center justify-center py-20'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        ) : posts.length === 0 ? (
          <div className='bg-white rounded-lg shadow-md p-12 text-center'>
            <BookOpen className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-700 mb-2'>
              No posts found
            </h3>
            <p className='text-gray-500'>
              Try another search or create your first post!
            </p>
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                query={query}
                showActions={false}
                onTagClick={(tag) => handleSearch(undefined, tag)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 🧩 Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
}
