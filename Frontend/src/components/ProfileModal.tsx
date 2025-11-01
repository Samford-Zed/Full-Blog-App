import { useState } from "react";
import { X, Mail, User, Lock, Loader2 } from "lucide-react";
import api from "../api/client";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { username: string; email: string };
  onUpdated: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  onUpdated,
}: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await api.put("/updateProfile", { username, email });
      setMessage("✅ Profile updated successfully!");
      onUpdated();
    } catch (err: any) {
      setMessage(err.response?.data?.message || "❌ Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage("⚠️ Fill both password fields.");
      return;
    }
    try {
      setLoading(true);
      await api.put("/updatePassword", {
        oldPassword: currentPassword,
        newPassword,
      });
      setMessage("✅ Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "❌ Failed to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
        >
          <X className='w-5 h-5' />
        </button>

        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          Manage Account
        </h2>

        {/* Profile Info */}
        <div className='space-y-3 mb-4'>
          <label className='flex items-center gap-2 border rounded-lg px-3 py-2'>
            <User className='w-4 h-4 text-gray-500' />
            <input
              type='text'
              placeholder='Username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='flex-1 outline-none text-gray-700'
            />
          </label>

          <label className='flex items-center gap-2 border rounded-lg px-3 py-2'>
            <Mail className='w-4 h-4 text-gray-500' />
            <input
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='flex-1 outline-none text-gray-700'
            />
          </label>

          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className='w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium mt-2'
          >
            {loading ? (
              <Loader2 className='animate-spin w-5 h-5 mx-auto' />
            ) : (
              "Save Profile"
            )}
          </button>
        </div>

        {/* Change Password */}
        <h3 className='text-lg font-semibold text-gray-700 mt-6 mb-2'>
          Change Password
        </h3>
        <div className='space-y-3'>
          <label className='flex items-center gap-2 border rounded-lg px-3 py-2'>
            <Lock className='w-4 h-4 text-gray-500' />
            <input
              type='password'
              placeholder='Current Password'
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className='flex-1 outline-none text-gray-700'
            />
          </label>

          <label className='flex items-center gap-2 border rounded-lg px-3 py-2'>
            <Lock className='w-4 h-4 text-gray-500' />
            <input
              type='password'
              placeholder='New Password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className='flex-1 outline-none text-gray-700'
            />
          </label>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className='w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium'
          >
            {loading ? (
              <Loader2 className='animate-spin w-5 h-5 mx-auto' />
            ) : (
              "Update Password"
            )}
          </button>
        </div>

        {/* Feedback */}
        {message && (
          <p className='text-center text-sm text-gray-700 mt-4'>{message}</p>
        )}
      </div>
    </div>
  );
}
