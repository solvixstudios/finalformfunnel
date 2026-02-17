import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Calendar, Mail, Rocket, User } from 'lucide-react';
import { GoogleUser } from '../lib/authGoogle';

interface ProfilePageProps {
  user: GoogleUser;
}

const ProfilePage = ({ user }: ProfilePageProps) => {
  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6 h-full flex flex-col pt-2">
      <PageHeader
        title="Profile"
        breadcrumbs={[{ label: 'Profile' }]}
        icon={User}
      />

      {/* Coming Soon Banner */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
          <Rocket size={28} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-xs mb-8">
          Profile settings and account management features are on the way.
        </p>

        {/* Current User Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 w-full max-w-sm text-left space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Account</h3>
          <div className="space-y-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200/60"
              />
            )}
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <User size={15} className="text-slate-400 shrink-0" />
              <span className="font-medium">{user.displayName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Mail size={15} className="text-slate-400 shrink-0" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
