import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserPlus } from "lucide-react";

export default function Register() {
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(username, email, password);
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4'>
      <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8'>
        {/* Header */}
        <div className='flex items-center justify-center mb-8'>
          <div className='bg-blue-600 p-3 rounded-full'>
            <UserPlus className='w-8 h-8 text-white' />
          </div>
        </div>

        <h2 className='text-3xl font-bold text-center text-gray-800 mb-2'>
          Create Account
        </h2>
        <p className='text-center text-gray-600 mb-8'>Sign up to get started</p>

        {/* Error message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-600 text-sm'>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label
              htmlFor='username'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Username
            </label>
            <input
              id='username'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
              placeholder='johndoe'
            />
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Email Address
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
              placeholder='you@example.com'
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
              placeholder='Enter your password'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer */}
        <p className='mt-8 text-center text-gray-600'>
          Already have an account?{" "}
          <Link
            to='/login'
            className='text-blue-600 font-medium hover:text-blue-700 transition'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
