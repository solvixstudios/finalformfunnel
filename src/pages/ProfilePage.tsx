import { Calendar, Mail, User } from 'lucide-react';
import { GoogleUser } from '../lib/authGoogle';

interface ProfilePageProps {
  user: GoogleUser;
}

const ProfilePage = ({ user }: ProfilePageProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-2">Manage your account settings</p>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 rounded-2xl p-6 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-xl mb-6">
          <span className="text-2xl">🚀</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Coming Soon</h2>
        <p className="text-slate-600 mb-8">
          Profile settings and account management features are coming in the next update
        </p>

        {/* Current User Info Preview */}
        <div className="bg-white/50 backdrop-blur border border-slate-200 rounded-xl p-6 max-w-md mx-auto text-left">
          <h3 className="font-bold text-slate-900 mb-4">Current Account</h3>
          <div className="space-y-3">
            {user.photoURL && (
              <div className="flex items-center gap-3">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-lg"
                />
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-700">
              <User size={18} className="text-indigo-600" />
              <span>{user.displayName}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Mail size={18} className="text-indigo-600" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar size={18} className="text-indigo-600" />
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
