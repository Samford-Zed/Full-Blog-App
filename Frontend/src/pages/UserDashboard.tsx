import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { postsApi } from "../api/posts";
import api from "../api/client";
import { Post } from "../types";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";
import { EditPostModal } from "../components/EditPostModal";
import { ProfileModal } from "../components/ProfileModal";
import {
  LogOut,
  Plus,
  BookOpen,
  Search,
  Loader2,
  Heart,
  MessageSquare,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";

export default function UserDashboard() {
  const { user, logout } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  // 🔹 Load data
  useEffect(() => {
    if (user) {
      loadUserPosts();
      loadUserStats();
    }
  }, [user]);

  // 🔹 Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 Load user's posts
  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/my-posts");
      setPosts(data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load stats
  const loadUserStats = async () => {
    try {
      const { data } = await api.get("/my-stats");
      setStats(data);
    } catch {}
  };

  // 🔹 Search handler
  const handleSearch = async (e?: React.FormEvent, tagQuery?: string) => {
    e?.preventDefault();
    const searchTerm = tagQuery || query.trim();
    if (!searchTerm) {
      loadUserPosts();
      return;
    }

    try {
      setSearching(true);
      const { data } = await api.get(`/search?q=${searchTerm}`);
      const filtered = data.filter(
        (p: Post) => p.author?.username === user?.username
      );
      setPosts(filtered);
      setError("");
      if (tagQuery) setQuery(tagQuery);
    } catch (err: any) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  // 🔹 Post actions
  const handleCreatePost = async (title: string, content: string) => {
    await postsApi.createPost({ title, content });
    await loadUserPosts();
    await loadUserStats();
  };

  const handleEditPost = async (id: number, title: string, content: string) => {
    await postsApi.updatePost(id, { title, content });
    await loadUserPosts();
    await loadUserStats();
  };

  const handleDeletePost = async (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      await postsApi.deletePost(id);
      await loadUserPosts();
      await loadUserStats();
    }
  };

  // 🔹 Logout
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  // 🔹 If user not loaded
  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen text-gray-600 text-lg'>
        Loading user data...
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Navbar */}
      <nav className='bg-white shadow-md border-b border-gray-200 relative'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Left side */}
            <div className='flex items-center gap-3'>
              <BookOpen className='w-8 h-8 text-blue-600' />
              <h1 className='text-2xl font-bold text-gray-800'>
                User Dashboard
              </h1>
            </div>

            {/* Right side */}
            <div className='flex items-center gap-4'>
              <div ref={profileRef} className='relative'>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className='flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition'
                >
                  <UserIcon className='w-5 h-5 text-gray-700' />
                  <ChevronDown className='w-4 h-4 text-gray-500' />
                </button>

                {profileOpen && (
                  <div className='absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4'>
                    <div className='flex items-center gap-3 mb-4'>
                      <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                        <UserIcon className='w-5 h-5 text-blue-600' />
                      </div>
                      <div>
                        <p className='font-semibold text-gray-800'>
                          {user.username}
                        </p>
                        <p className='text-sm text-gray-500'>{user.email}</p>
                      </div>
                    </div>
                    <div className='border-t border-gray-100 my-2' />
                    <p className='text-sm text-gray-600 mb-2'>
                      Role: <span className='font-medium'>{user.role}</span>
                    </p>

                    {/* Manage Account */}
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className='w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition'
                    >
                      Manage Account
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className='w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition'
                    >
                      <LogOut className='w-4 h-4' />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Stats */}
        <div className='grid gap-6 md:grid-cols-3 mb-8'>
          {[
            { title: "Your Posts", value: stats.totalPosts, icon: BookOpen },
            { title: "Total Likes", value: stats.totalLikes, icon: Heart },
            {
              title: "Total Comments",
              value: stats.totalComments,
              icon: MessageSquare,
            },
          ].map(({ title, value, icon: Icon }) => (
            <div
              key={title}
              className='bg-white p-6 rounded-lg shadow border flex items-center justify-between'
            >
              <div>
                <h3 className='text-sm text-gray-500'>{title}</h3>
                <p className='text-3xl font-bold text-gray-800 mt-1'>{value}</p>
              </div>
              <Icon className='w-8 h-8 text-blue-600 opacity-80' />
            </div>
          ))}
        </div>

        {/* Search & Create */}
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4'>
          <div>
            <h2 className='text-3xl font-bold text-gray-800'>My Posts</h2>
            <p className='text-gray-600 mt-1'>
              Create, view, and manage your blog posts
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <form
              onSubmit={handleSearch}
              className='relative flex items-center w-full md:w-72'
            >
              <Search className='absolute left-3 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search your posts...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none'
              />
              {query && (
                <button
                  type='button'
                  onClick={() => {
                    setQuery("");
                    loadUserPosts();
                  }}
                  className='absolute right-3 text-gray-400 hover:text-gray-600'
                >
                  ✕
                </button>
              )}
            </form>

            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg font-medium'
            >
              <Plus className='w-5 h-5' />
              Create
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-600'>{error}</p>
          </div>
        )}

        {/* Posts */}
        {loading || searching ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='animate-spin w-10 h-10 text-blue-600' />
          </div>
        ) : posts.length === 0 ? (
          <div className='bg-white rounded-lg shadow-md p-12 text-center'>
            <BookOpen className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-700 mb-2'>
              No posts found
            </h3>
            <p className='text-gray-500'>Start writing your first post!</p>
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                query={query}
                showActions
                onEdit={(p) => {
                  setSelectedPost(p);
                  setIsEditModalOpen(true);
                }}
                onDelete={handleDeletePost}
                onTagClick={(tag) => handleSearch(undefined, tag)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />
      <EditPostModal
        isOpen={isEditModalOpen}
        post={selectedPost}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPost(null);
        }}
        onSubmit={handleEditPost}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdated={() => {
          setIsProfileModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
