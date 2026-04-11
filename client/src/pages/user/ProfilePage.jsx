import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authAPI } from '../../api/index.js';
import { User, Mail, Phone, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authAPI.updateProfile(profileForm);
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwMsg({ type: 'error', text: 'Passwords do not match' });
    }
    setSubmitting(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setPwMsg(null), 3000);
    }
  };

  const MsgAlert = ({ msg }) => msg ? (
    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-4 ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
      {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg.text}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        {/* Avatar section */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-3xl font-display font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-gray-900">{user?.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </div>
              <span className={`badge mt-1 ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h2 className="font-display font-semibold text-lg text-gray-900 mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" /> Edit Profile
          </h2>
          <MsgAlert msg={profileMsg} />
          <form onSubmit={handleProfile} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
              <input type="text" value={profileForm.name} onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number</label>
              <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="input" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="font-display font-semibold text-lg text-gray-900 mb-5 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-500" /> Change Password
          </h2>
          <MsgAlert msg={pwMsg} />
          <form onSubmit={handlePwChange} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm New Password</label>
              <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} className="input" required />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

