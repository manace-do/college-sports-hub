'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import {
  getUserProfile,
  updateUserProfile,
  getUserRosterMemberships,
  isSupabaseConfigured,
  supabase,
} from '../../lib/supabaseClient';
import {
  User,
  Edit3,
  Camera,
  MapPin,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Trophy,
  Star,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  Save,
  Shield,
  Calendar,
  Activity,
  ExternalLink,
  Plus,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile: authProfile, isAdmin, loading: authLoading, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  const [profile, setProfile] = useState({
    name: '',
    usn: '',
    department: 'CSE',
    year: 1,
    college: 'Dr. A.C.S. College of Engineering (ACSCE)',
    bio: '',
    photo_url: '',
    phone: '',
    interests: [],
    is_admin: false,
    created_at: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    department: 'CSE',
    year: 1,
    college: 'Dr. A.C.S. College of Engineering (ACSCE)',
    bio: '',
    photo_url: '',
    phone: '',
    interests_input: '',
  });

  const [rosterMemberships, setRosterMemberships] = useState([]);

  const branches = [
    { code: 'CSE', label: 'Computer Science (CSE)' },
    { code: 'ISE', label: 'Information Science (ISE)' },
    { code: 'AIML', label: 'AI & Machine Learning (AIML)' },
    { code: 'ECE', label: 'Electronics & Communication (ECE)' },
    { code: 'EEE', label: 'Electrical & Electronics (EEE)' },
    { code: 'MECH', label: 'Mechanical Engineering (MECH)' },
    { code: 'CIVIL', label: 'Civil Engineering (CIVIL)' },
    { code: 'BIOTECH', label: 'Biotechnology' },
    { code: 'OTHER', label: 'Other Department' },
  ];

  // Route protection: unauthenticated users redirect to /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load profile data and roster affiliations
  const loadProfileData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const data = await getUserProfile(user.id);
      const activeData = data || authProfile || {};

      const currentProfile = {
        name: activeData.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student',
        usn: activeData.usn || user.user_metadata?.usn || (user.email?.includes('@') ? user.email.split('@')[0].toUpperCase() : ''),
        department: activeData.department || user.user_metadata?.department || 'CSE',
        year: activeData.year || (user.user_metadata?.year ? parseInt(user.user_metadata.year) : 1),
        college: 'Dr. A.C.S. College of Engineering (ACSCE)',
        bio: activeData.bio || '',
        photo_url: activeData.photo_url || '',
        phone: activeData.phone || '',
        interests: Array.isArray(activeData.interests) ? activeData.interests : [],
        is_admin: Boolean(activeData.is_admin),
        created_at: activeData.created_at || '',
        email: activeData.email || user.user_metadata?.email || (user.email && !user.email.endsWith('@college.edu') ? user.email : ''),
      };

      setProfile(currentProfile);

      setEditForm({
        name: currentProfile.name,
        department: currentProfile.department,
        year: currentProfile.year,
        college: currentProfile.college,
        bio: currentProfile.bio,
        photo_url: currentProfile.photo_url,
        phone: currentProfile.phone,
        interests_input: currentProfile.interests.join(', '),
      });

      // Load official player affiliations
      const memberships = await getUserRosterMemberships(user.id, currentProfile.name);
      setRosterMemberships(memberships || []);
    } catch (err) {
      console.error('Error loading user profile:', err);
      showFeedback('error', 'Could not load your profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const showFeedback = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4500);
  };

  // Switch to edit mode
  const handleStartEditing = () => {
    setEditForm({
      name: profile.name,
      department: profile.department,
      year: profile.year,
      college: profile.college,
      bio: profile.bio,
      photo_url: profile.photo_url,
      phone: profile.phone,
      interests_input: profile.interests.join(', '),
    });
    setIsEditing(true);
  };

  // Cancel edits and return to view mode
  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      name: profile.name,
      department: profile.department,
      year: profile.year,
      college: profile.college,
      bio: profile.bio,
      photo_url: profile.photo_url,
      phone: profile.phone,
      interests_input: profile.interests.join(', '),
    });
  };

  // Save changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showFeedback('error', 'Name cannot be empty.');
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const interestsArr = editForm.interests_input
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const parsedYear = parseInt(editForm.year);
      if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 4) {
        showFeedback('error', 'Academic year must be between Year 1 and Year 4.');
        setSaving(false);
        return;
      }

      const updatePayload = {
        name: editForm.name.trim(),
        department: editForm.department,
        year: parsedYear,
        college: 'Dr. A.C.S. College of Engineering (ACSCE)',
        bio: editForm.bio.trim(),
        photo_url: editForm.photo_url.trim(),
        phone: editForm.phone.trim(),
        interests: interestsArr,
      };

      const updated = await updateUserProfile(user.id, updatePayload);

      setProfile((prev) => ({
        ...prev,
        ...updatePayload,
      }));

      await refreshProfile();
      setIsEditing(false);
      showFeedback('success', 'Your profile changes have been saved successfully.');
    } catch (err) {
      console.error('Error saving profile:', err);
      showFeedback('error', err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Loading skeleton state
  if (authLoading || (loading && !profile.name)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28" />
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-200" />
            <div className="space-y-3 flex-1">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="h-32 bg-slate-100 rounded-2xl" />
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const personalEmail = profile.email || (user?.email && !user.email.endsWith('@college.edu') ? user.email : null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Public Directory
        </Link>

        {!isEditing && (
          <button
            onClick={handleStartEditing}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Global Status Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================== */}
      {/* VIEW MODE: USER PROFILE CARD & SECTIONS               */}
      {/* ===================================================== */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Main Profile Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header Banner */}
            <div className="h-32 sm:h-40 bg-gradient-to-r from-brand-900 via-indigo-950 to-purple-900 relative p-6">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 backdrop-blur-sm">
                    <Shield className="w-3.5 h-3.5 text-purple-300" />
                    <span>Administrator</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                    <GraduationCap className="w-3.5 h-3.5 text-brand-200" />
                    <span>Student Athlete</span>
                  </span>
                )}
              </div>
            </div>

            {/* Profile Avatar & Info Row */}
            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
                {/* Photo / Avatar */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-md bg-white overflow-hidden shrink-0 group">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center text-brand-700 font-extrabold text-3xl uppercase">
                      {profile.name ? profile.name.slice(0, 2) : 'ST'}
                    </div>
                  )}
                  <button
                    onClick={handleStartEditing}
                    className="absolute inset-0 bg-slate-900/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-semibold"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Update</span>
                  </button>
                </div>

                <div className="flex-1 sm:ml-2 space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {profile.name}
                    </h1>
                    {profile.usn && (
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {profile.usn}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2">
                    <span>{profile.college}</span>
                    <span>•</span>
                    <span className="text-brand-600 font-semibold">{profile.department}</span>
                  </p>
                </div>
              </div>

              {/* Bio Section */}
              <div className="pt-2">
                {profile.bio ? (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    "{profile.bio}"
                  </p>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-400 flex items-center justify-between">
                    <span>No bio added yet. Tell teammates about your playstyle, position, or availability.</span>
                    <button
                      onClick={handleStartEditing}
                      className="text-brand-600 font-bold hover:underline shrink-0 ml-2"
                    >
                      + Add Bio
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Academic & Institution Details */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Academic & Contact Information
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Institution</span>
                  <span className="text-slate-800 font-semibold text-sm">
                    Dr. A.C.S. College of Engineering (ACSCE)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block font-medium">Branch / Department</span>
                    <span className="text-slate-800 font-bold">{profile.department || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Current Academic Year</span>
                    <span className="text-slate-800 font-bold">
                      {profile.year ? `Year ${profile.year}` : '1st Year'}
                    </span>
                  </div>
                </div>

                {personalEmail && (
                  <div>
                    <span className="text-slate-400 block font-medium">Personal Email</span>
                    <span className="text-slate-800 font-mono font-medium">{personalEmail}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block font-medium">Contact Number</span>
                  <span className="text-slate-800 font-medium">
                    {profile.phone || <span className="text-slate-400 italic">Not provided</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Favourite Sports & Play Interests */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Favourite Sports & Interests
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {profile.interests.length} Selected
                </span>
              </div>

              {profile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.interests.map((sport, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200/70 flex items-center gap-1.5 shadow-2xs capitalize"
                    >
                      <Sparkles className="w-3 h-3 text-brand-500" />
                      <span>{sport}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500">No sports or athletic interests selected yet.</p>
                  <button
                    onClick={handleStartEditing}
                    className="text-xs font-bold text-brand-600 hover:underline"
                  >
                    + Add your favourite sports
                  </button>
                </div>
              )}

              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Adding your favourite sports makes it easier for peers to match with you when posting casual team requests.
              </p>
            </div>
          </div>

          {/* Card 3: Official College Team Players & Squads */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Official College Team Players & Squads
                </h2>
              </div>
              <Link
                href="/"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>Browse Directory</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {rosterMemberships.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rosterMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {membership.sports?.name || 'College Sport'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {membership.sports?.category || 'squad'}
                        </span>
                      </div>
                      {membership.is_captain && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Team Captain</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p>
                        Position: <strong className="text-slate-800">{membership.position || 'Player'}</strong>
                        {membership.jersey_number && (
                          <span className="ml-2 font-mono text-slate-500">#{membership.jersey_number}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">No Varsity Squad Memberships</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  You are not currently assigned as an official team player. The college head coach and athletic director designate team players via the Sports Hub admin portal.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===================================================== */
        /* EDIT MODE: INTERACTIVE PROFILE EDIT FORM             */
        /* ===================================================== */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Edit Student Profile
              </h2>
              <p className="text-xs text-slate-500">
                Update your personal information, photo, bio, and playing preferences
              </p>
            </div>
            <button
              onClick={handleCancelEditing}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Photo URL & Live Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Profile Photo
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                  {editForm.photo_url ? (
                    <img
                      src={editForm.photo_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-1">
                  <input
                    type="url"
                    value={editForm.photo_url}
                    onChange={(e) => setEditForm({ ...editForm, photo_url: e.target.value })}
                    placeholder="https://images.unsplash.com/... or public image link"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Paste an image URL (PNG, JPG, or Unsplash link) to display your avatar.
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name & USN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  College USN / Roll Number
                </label>
                <input
                  type="text"
                  value={profile.usn}
                  disabled
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono font-bold cursor-not-allowed"
                  title="USN is permanent and tied to your authentication credentials"
                />
              </div>
            </div>

            {/* Bio Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  About You / Bio
                </label>
                <span className="text-[10px] text-slate-400">
                  {editForm.bio.length} / 250 characters
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={250}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Share your playing style, favourite positions, sports accomplishments, or availability for casual campus games..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Academic Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department / Branch
                </label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  {branches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Year
                </label>
                <select
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Institution (Fixed to ACSCE) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Institution
                </span>
                <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                  Dr. A.C.S. College of Engineering (ACSCE)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                Fixed
              </span>
            </div>

            {/* Favourite Sports */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Favourite Sports & Interests (Comma-separated)
              </label>
              <input
                type="text"
                value={editForm.interests_input}
                onChange={(e) => setEditForm({ ...editForm, interests_input: e.target.value })}
                placeholder="e.g. Football, Cricket, Badminton, Table Tennis, Running"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Separate multiple sports with commas. These appear on your public athlete profile.
              </p>
            </div>

            {/* Action Buttons: Cancel & Save Changes */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEditing}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
