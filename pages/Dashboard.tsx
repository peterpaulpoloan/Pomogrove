import React, { useState } from 'react';
import { UserProfile } from '../types';
import ActivityCalendar from '../components/ActivityCalendar';
import { Award, Target, Flame, Edit3, Save } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, updateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState(user.bio);
  const [tempName, setTempName] = useState(user.displayName);

  const handleSave = () => {
    updateUser({ bio: tempBio, displayName: tempName });
    setIsEditing(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Profile Section */}
      <section className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <img 
              src={user.photoURL || `https://picsum.photos/seed/${user.uid}/150`}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-emerald-100 shadow-lg"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer">
                <Edit3 className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              {isEditing ? (
                <input 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="text-3xl font-bold bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 outline-none"
                />
              ) : (
                <h2 className="text-3xl font-bold text-stone-900">{user.displayName}</h2>
              )}
              <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-400 hover:text-emerald-600"
              >
                {isEditing ? <Save size={20} /> : <Edit3 size={20} />}
              </button>
            </div>

            <div className="mb-4">
              {isEditing ? (
                <textarea 
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  className="w-full text-stone-600 bg-stone-50 border border-stone-200 rounded-lg p-2 outline-none h-20"
                />
              ) : (
                <p className="text-stone-600 italic">"{user.bio}"</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold flex items-center gap-2">
                <Award size={16} />
                Level {user.level}
              </span>
              <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-2">
                <Flame size={16} />
                {user.streak} Day Streak
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">Focus Sessions</p>
            <p className="text-2xl font-bold">{user.totalSessions}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">Current Streak</p>
            <p className="text-2xl font-bold">{user.streak} Days</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">Trees Grown</p>
            <p className="text-2xl font-bold">{Math.max(0, Math.floor((user.level - 1) / 10))}</p>
          </div>
        </div>
      </div>

      {/* Activity Calendar Section */}
      <section className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
        <ActivityCalendar user={user} />
      </section>
    </div>
  );
};

export default Dashboard;