'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import {
  getSports,
  saveSport,
  deleteSport,
  getRosterForSport,
  savePlayer,
  deletePlayer,
  getUsers,
  adminUpdateUser,
  adminDeleteUser,
  getSiteSettings,
  saveSiteSetting,
} from '../../lib/supabaseClient';
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  Star,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Trophy,
  Users,
  LogOut,
  X,
  Hash,
  Activity,
  Image as ImageIcon,
  Settings,
  MapPin,
  Building2,
  Check,
  RefreshCw,
  Lock,
  GraduationCap,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, profile, isAdmin, loading: authLoading, signOut, refreshProfile } = useAuth();

  // Active Tab: 'sports' | 'players' | 'users' | 'settings'
  const [activeTab, setActiveTab] = useState('sports');
  const [sports, setSports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Sports Tab State
  const [sportSearch, setSportSearch] = useState('');
  const [sportCategoryFilter, setSportCategoryFilter] = useState('all');
  const [editingSport, setEditingSport] = useState(null);
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [sportFormData, setSportFormData] = useState({
    name: '',
    category: 'men',
    coach_name: '',
    description: '',
  });

  // Players Tab State
  const [selectedSportIdForPlayers, setSelectedSportIdForPlayers] = useState('all');
  const [playerSearch, setPlayerSearch] = useState('');
  const [allPlayers, setAllPlayers] = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [playerFormData, setPlayerFormData] = useState({
    sport_id: '',
    player_name: '',
    position: '',
    jersey_number: '',
    photo_url: '',
    is_captain: false,
  });

  // Users Tab State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'admin' | 'student'
  const [userDeptFilter, setUserDeptFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    usn: '',
    department: 'CSE',
    year: 1,
    is_admin: false,
  });

  // Settings Tab State
  const [settingsFormData, setSettingsFormData] = useState({
    portal_title: 'Sports Hub | ACSCE',
    tagline: 'Dr. A.C.S. College of Engineering (ACSCE) Sports Portal',
    welcome_message: 'Browse official ACSCE team players, view captains, or find teammates for casual evening games without having to ask anyone directly.',
    coach_name: 'Coach R. Sharma',
    coach_title: 'Head Coach & Director of Physical Education',
    coach_bio: 'Overseeing athletic development and training programs across all collegiate sports.',
    coach_office: 'Sports Room, Third Floor',
    contact_department: 'Department of Physical Education and Sports',
    contact_location: 'Third Floor',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Deletion Modal State
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'sport' | 'player' | 'user', id, title }

  // Identify whether user has 1AH24CS212 and needs activation
  const currentUsn =
    profile?.usn ||
    user?.user_metadata?.usn ||
    (user?.email?.includes('@') ? user.email.split('@')[0].toUpperCase() : null);
  const isPrimaryPendingActivation = !isAdmin && currentUsn?.toUpperCase() === '1AH24CS212';

  // Route Protection:
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin && !isPrimaryPendingActivation) {
        router.push('/');
      }
    }
  }, [user, isAdmin, isPrimaryPendingActivation, authLoading, router]);

  // Load all dashboard data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sportsData, usersData, settingsData] = await Promise.all([
        getSports(),
        getUsers(),
        getSiteSettings(),
      ]);

      setSports(sportsData || []);
      setUsersList(usersData || []);
      setSiteSettings(settingsData);

      if (settingsData) {
        setSettingsFormData({
          portal_title: settingsData.portal_config?.portal_title || 'Sports Hub | ACSCE',
          tagline: settingsData.portal_config?.tagline || 'Dr. A.C.S. College of Engineering (ACSCE) Sports Portal',
          welcome_message: settingsData.portal_config?.welcome_message || '',
          coach_name: settingsData.coach_profile?.name || 'Coach R. Sharma',
          coach_title: settingsData.coach_profile?.title || 'Head Coach & Director of Physical Education',
          coach_bio: settingsData.coach_profile?.bio || 'Overseeing athletic development and training programs across all collegiate sports.',
          coach_office: settingsData.coach_profile?.office || 'Sports Room, Third Floor',
          contact_department: settingsData.contact_info?.department || 'Department of Physical Education and Sports',
          contact_location: settingsData.contact_info?.location || 'Third Floor',
        });
      }

      // Load roster for all sports
      let playersList = [];
      for (const sp of sportsData || []) {
        const roster = await getRosterForSport(sp.id);
        playersList = playersList.concat(
          (roster || []).map((r) => ({ ...r, sport_name: sp.name, sport_category: sp.category }))
        );
      }
      setAllPlayers(playersList);
    } catch (err) {
      console.error('Error loading admin data:', err);
      showFeedback('error', 'Failed to load records from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showFeedback = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // ==========================================
  // SPORTS ACTIONS
  // ==========================================
  const handleOpenAddSport = () => {
    setSportFormData({ name: '', category: 'men', coach_name: '', description: '' });
    setShowAddSportModal(true);
  };

  const handleOpenEditSport = (sp) => {
    setEditingSport(sp);
    setSportFormData({
      name: sp.name,
      category: sp.category,
      coach_name: '',
      description: sp.description || '',
    });
  };

  const handleSaveSport = async (e) => {
    e.preventDefault();
    if (!sportFormData.name.trim()) {
      showFeedback('error', 'Sport name cannot be empty.');
      return;
    }

    try {
      const payload = {
        name: sportFormData.name.trim(),
        category: sportFormData.category,
        coach_name: null,
        description: sportFormData.description.trim() || null,
      };

      if (editingSport) {
        payload.id = editingSport.id;
      }

      await saveSport(payload);
      showFeedback(
        'success',
        editingSport
          ? `Sport "${payload.name}" updated successfully.`
          : `New sport "${payload.name}" added to directory.`
      );
      setEditingSport(null);
      setShowAddSportModal(false);
      loadAllData();
    } catch (err) {
      showFeedback('error', err.message || 'Error saving sport.');
    }
  };

  const handleConfirmDeleteSport = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'sport') return;
    try {
      await deleteSport(deleteConfirm.id);
      showFeedback('success', `Sport "${deleteConfirm.title}" and its team players were deleted.`);
      setDeleteConfirm(null);
      loadAllData();
    } catch (err) {
      showFeedback('error', err.message || 'Error deleting sport.');
    }
  };

  // ==========================================
  // PLAYERS ACTIONS
  // ==========================================
  const handleOpenAddPlayer = () => {
    const defaultSportId =
      selectedSportIdForPlayers !== 'all' ? selectedSportIdForPlayers : sports[0]?.id || '';
    setPlayerFormData({
      sport_id: defaultSportId,
      player_name: '',
      position: '',
      jersey_number: '',
      photo_url: '',
      is_captain: false,
    });
    setShowAddPlayerModal(true);
  };

  const handleOpenEditPlayer = (pl) => {
    setEditingPlayer(pl);
    setPlayerFormData({
      sport_id: pl.sport_id,
      player_name: pl.player_name,
      position: pl.position || '',
      jersey_number: pl.jersey_number || '',
      photo_url: pl.photo_url || '',
      is_captain: Boolean(pl.is_captain),
    });
  };

  const handleSavePlayer = async (e) => {
    e.preventDefault();
    if (!playerFormData.player_name.trim()) {
      showFeedback('error', 'Player name cannot be empty.');
      return;
    }
    if (!playerFormData.sport_id) {
      showFeedback('error', 'Please select a sport affiliation for the player.');
      return;
    }

    try {
      const payload = {
        sport_id: playerFormData.sport_id,
        player_name: playerFormData.player_name.trim(),
        position: playerFormData.position.trim() || null,
        jersey_number: playerFormData.jersey_number.trim() || null,
        photo_url: playerFormData.photo_url.trim() || null,
        is_captain: Boolean(playerFormData.is_captain),
      };

      if (editingPlayer) {
        payload.id = editingPlayer.id;
      }

      await savePlayer(payload);
      showFeedback(
        'success',
        editingPlayer
          ? `Player "${payload.player_name}" updated successfully.`
          : `Player "${payload.player_name}" added to squad.`
      );
      setEditingPlayer(null);
      setShowAddPlayerModal(false);
      loadAllData();
    } catch (err) {
      showFeedback('error', err.message || 'Error saving player.');
    }
  };

  const handleConfirmDeletePlayer = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'player') return;
    try {
      await deletePlayer(deleteConfirm.id);
      showFeedback('success', `Player "${deleteConfirm.title}" removed from team players.`);
      setDeleteConfirm(null);
      loadAllData();
    } catch (err) {
      showFeedback('error', err.message || 'Error removing player.');
    }
  };

  // ==========================================
  // USERS MANAGEMENT ACTIONS
  // ==========================================
  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name || '',
      usn: u.usn || '',
      department: u.department || 'CSE',
      year: u.year || 1,
      is_admin: Boolean(u.is_admin),
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!userFormData.name.trim()) {
      showFeedback('error', 'Student name cannot be empty.');
      return;
    }

    try {
      await adminUpdateUser({
        id: editingUser.id,
        name: userFormData.name.trim(),
        usn: userFormData.usn.trim().toUpperCase(),
        department: userFormData.department,
        year: parseInt(userFormData.year),
        is_admin: Boolean(userFormData.is_admin),
      });

      showFeedback('success', `Profile for "${userFormData.name}" updated successfully.`);
      setEditingUser(null);
      await loadAllData();
      await refreshProfile();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update user account.');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'user') return;
    try {
      await adminDeleteUser(deleteConfirm.id);
      showFeedback('success', `Account for "${deleteConfirm.title}" was removed.`);
      setDeleteConfirm(null);
      loadAllData();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to delete user.');
    }
  };

  // ==========================================
  // SITE SETTINGS ACTIONS
  // ==========================================
  const handleSaveAllSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const portalConfigPayload = {
        portal_title: settingsFormData.portal_title.trim(),
        tagline: settingsFormData.tagline.trim(),
        welcome_message: settingsFormData.welcome_message.trim(),
      };

      const coachPayload = {
        name: settingsFormData.coach_name.trim(),
        title: settingsFormData.coach_title.trim(),
        bio: settingsFormData.coach_bio.trim(),
        office: settingsFormData.coach_office.trim(),
      };

      const contactPayload = {
        department: settingsFormData.contact_department.trim(),
        location: settingsFormData.contact_location.trim(),
      };

      await Promise.all([
        saveSiteSetting('portal_config', portalConfigPayload),
        saveSiteSetting('coach_profile', coachPayload),
        saveSiteSetting('contact_info', contactPayload),
      ]);

      showFeedback('success', 'Site settings, shared coach profile, and department info saved successfully.');
      loadAllData();
    } catch (err) {
      showFeedback('error', err.message || 'Error saving site settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredSports = sports.filter((s) => {
    const matchesCat =
      sportCategoryFilter === 'all' || s.category?.toLowerCase() === sportCategoryFilter.toLowerCase();
    const q = sportSearch.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const filteredPlayers = allPlayers.filter((p) => {
    const matchesSport =
      selectedSportIdForPlayers === 'all' || p.sport_id === selectedSportIdForPlayers;
    const q = playerSearch.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      p.player_name.toLowerCase().includes(q) ||
      (p.position && p.position.toLowerCase().includes(q)) ||
      (p.sport_name && p.sport_name.toLowerCase().includes(q)) ||
      (p.jersey_number && p.jersey_number.includes(q));
    return matchesSport && matchesSearch;
  });

  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      u.name?.toLowerCase().includes(q) ||
      u.usn?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q);

    const matchesRole =
      userRoleFilter === 'all' ||
      (userRoleFilter === 'admin' && u.is_admin) ||
      (userRoleFilter === 'student' && !u.is_admin);

    const matchesDept =
      userDeptFilter === 'all' || u.department?.toUpperCase() === userDeptFilter.toUpperCase();

    return matchesSearch && matchesRole && matchesDept;
  });

  // Pending primary admin setup warning state
  if (isPrimaryPendingActivation) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Administrator Setup Required</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          You are signed in with the primary administrator USN (<span className="font-mono font-bold">1AH24CS212</span>), but your account has not yet been verified and activated via the one-time security bootstrap.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/admin/setup"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition"
          >
            Go to Admin Setup Wizard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mx-auto animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800">Verifying Admin Privileges...</h2>
          <p className="text-xs text-slate-400">Restricted to authorized athletic directors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Public Directory
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/setup"
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition"
          >
            <Shield className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
            Security & Setup
          </Link>
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Sign Out ({profile?.name || user?.email?.split('@')[0]})
          </button>
        </div>
      </div>

      {/* Main Admin Control Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Sports Hub Authority Dashboard
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete control over sports, team players, student accounts, and college portal settings
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="inline-flex flex-wrap p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('sports')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'sports'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Sports & Teams ({sports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('players')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'players'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Players ({allPlayers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Registered Users ({usersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Site & Settings</span>
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
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
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 1: SPORTS & TEAMS MANAGEMENT                     */}
        {/* ===================================================== */}
        {activeTab === 'sports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={sportSearch}
                    onChange={(e) => setSportSearch(e.target.value)}
                    placeholder="Search sports..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  <select
                    value={sportCategoryFilter}
                    onChange={(e) => setSportCategoryFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-700"
                  >
                    <option value="all">All Categories</option>
                    <option value="men">Men's</option>
                    <option value="women">Women's</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleOpenAddSport}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add New Sport
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                Loading official sports records...
              </div>
            ) : filteredSports.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                <p className="text-xs font-bold text-slate-700">No sports found</p>
                <p className="text-[11px] text-slate-500">
                  {sportSearch ? 'Try a different search term.' : 'Click "Add New Sport" above to create one.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSports.map((sp) => {
                  const rosterCount = allPlayers.filter((p) => p.sport_id === sp.id).length;
                  const captain = allPlayers.find((p) => p.sport_id === sp.id && p.is_captain);

                  return (
                    <div
                      key={sp.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 transition space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-slate-900">{sp.name}</h3>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                sp.category === 'men'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
                              }`}
                            >
                              {sp.category}
                            </span>
                          </div>

                          {sp.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {sp.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditSport(sp)}
                            className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                            title="Edit Sport"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'sport',
                                id: sp.id,
                                title: `${sp.name} (${sp.category})`,
                              })
                            }
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Sport"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rosterCount} Players</span>
                        </span>
                        {captain ? (
                          <span className="flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>C: {captain.player_name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No captain assigned</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 2: TEAM PLAYERS MANAGEMENT                       */}
        {/* ===================================================== */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Search player, jersey, position..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  <select
                    value={selectedSportIdForPlayers}
                    onChange={(e) => setSelectedSportIdForPlayers(e.target.value)}
                    className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-700"
                  >
                    <option value="all">All Sports ({allPlayers.length})</option>
                    {sports.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleOpenAddPlayer}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Player
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                Loading team players...
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                <p className="text-xs font-bold text-slate-700">No players found</p>
                <p className="text-[11px] text-slate-500">
                  {playerSearch ? 'No players matched your filter.' : 'Click "Add Player" to add members.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Player & Jersey</th>
                      <th className="py-3 px-4">Sport Affiliation</th>
                      <th className="py-3 px-4">Position / Role</th>
                      <th className="py-3 px-4 text-center">Captain</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPlayers.map((pl) => (
                      <tr key={pl.id} className="hover:bg-purple-50/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-xs text-brand-700 shrink-0 overflow-hidden">
                              {pl.photo_url ? (
                                <img
                                  src={pl.photo_url}
                                  alt={pl.player_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{pl.jersey_number || pl.player_name.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{pl.player_name}</span>
                                {pl.jersey_number && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    #{pl.jersey_number}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{pl.sport_name}</span>{' '}
                          <span className="text-[10px] text-slate-400">({pl.sport_category})</span>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-700">
                          {pl.position || '—'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {pl.is_captain ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Captain</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditPlayer(pl)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                              title="Edit Player"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'player',
                                  id: pl.id,
                                  title: pl.player_name,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Remove Player"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 3: REGISTERED USERS MANAGEMENT                   */}
        {/* ===================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name, USN, branch..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-700"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Administrators</option>
                    <option value="student">Students</option>
                  </select>

                  <select
                    value={userDeptFilter}
                    onChange={(e) => setUserDeptFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-700"
                  >
                    <option value="all">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="ISE">ISE</option>
                    <option value="AIML">AIML</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="BIOTECH">Biotech</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Total Registered: <strong className="text-slate-900">{usersList.length}</strong> accounts
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                Loading registered student accounts...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                <p className="text-xs font-bold text-slate-700">No registered users found</p>
                <p className="text-[11px] text-slate-500">
                  Try adjusting your search query or department filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">College USN</th>
                      <th className="py-3 px-4">Branch & Year</th>
                      <th className="py-3 px-4">Access Role</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isPrimaryAdminAccount = u.usn?.toUpperCase() === '1AH24CS212';

                      return (
                        <tr key={u.id} className="hover:bg-purple-50/30 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                                {u.name ? u.name.slice(0, 2) : 'ST'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{u.name}</p>
                                {isPrimaryAdminAccount && (
                                  <span className="text-[10px] text-purple-600 font-semibold">
                                    Primary Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {u.usn || '—'}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{u.department || 'N/A'}</span>
                            {u.year && (
                              <span className="text-slate-400 text-[11px]"> • Year {u.year}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {u.is_admin ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                                <Shield className="w-3 h-3 text-purple-600" />
                                <span>Administrator</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                <GraduationCap className="w-3 h-3 text-blue-500" />
                                <span>Student</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                                title="Edit Profile & Role"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={isPrimaryAdminAccount}
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'user',
                                    id: u.id,
                                    title: `${u.name} (${u.usn})`,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:pointer-events-none"
                                title={
                                  isPrimaryAdminAccount
                                    ? 'Primary Admin cannot be deleted'
                                    : 'Delete User Account'
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 4: SITE CONTENT & SETTINGS MANAGEMENT            */}
        {/* ===================================================== */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveAllSettings} className="space-y-8 max-w-3xl">
            {/* Section 1: Portal Identity */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <Trophy className="w-4 h-4 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  1. Portal Identity & Hero Branding
                </h3>
              </div>

              <div className="space-y-4">
                {/* Fixed Institution */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institution (Fixed)
                  </label>
                  <div className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center justify-between">
                    <span>Dr. A.C.S. College of Engineering (ACSCE)</span>
                    <span className="text-[10px] uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md font-bold">
                      Locked
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sports Hub is built exclusively for Dr. A.C.S. College of Engineering (ACSCE). The institution identity is fixed and cannot be changed.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    College Portal Title
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.portal_title}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, portal_title: e.target.value })
                    }
                    required
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tagline / Subheading
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.tagline}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, tagline: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Welcome Message Description
                  </label>
                  <textarea
                    rows={2}
                    value={settingsFormData.welcome_message}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, welcome_message: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Shared College Head Coach Profile */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <User className="w-4 h-4 text-purple-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                    2. Shared College Head Coach Profile
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    One college coach oversees all sports teams across ACSCE
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Head Coach Full Name *
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.coach_name}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, coach_name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.coach_title}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, coach_title: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coach Bio & Program Overview
                  </label>
                  <textarea
                    rows={2}
                    value={settingsFormData.coach_bio}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, coach_bio: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coach Office Location
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.coach_office}
                    onChange={(e) =>
                      setSettingsFormData({ ...settingsFormData, coach_office: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

              </div>
            </div>

            {/* Section 3: Sports Department & Sports Room Location */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <MapPin className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                    3. Sports Department & Sports Room Location
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    College sports administration and facility location info
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department Title
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.contact_department}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        contact_department: e.target.value,
                      })
                    }
                    placeholder="Department of Physical Education and Sports"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sports Room Location
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.contact_location}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        contact_location: e.target.value,
                      })
                    }
                    placeholder="Third Floor"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="py-3 px-6 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{savingSettings ? 'Saving Settings...' : 'Save Site Settings'}</span>
            </button>
          </form>
        )}
      </div>

      {/* ===================================================== */}
      {/* MODAL 1: ADD / EDIT SPORT                             */}
      {/* ===================================================== */}
      {(showAddSportModal || editingSport) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-600" />
                <span>{editingSport ? 'Edit Sport Details' : 'Add New Sport'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddSportModal(false);
                  setEditingSport(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sport Name *
                </label>
                <input
                  type="text"
                  value={sportFormData.name}
                  onChange={(e) => setSportFormData({ ...sportFormData, name: e.target.value })}
                  placeholder="e.g. Badminton, Table Tennis, Football"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={sportFormData.category}
                  onChange={(e) => setSportFormData({ ...sportFormData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="men">Men's Sport</option>
                  <option value="women">Women's Sport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Overview
                </label>
                <textarea
                  rows={2}
                  value={sportFormData.description}
                  onChange={(e) =>
                    setSportFormData({ ...sportFormData, description: e.target.value })
                  }
                  placeholder="Brief summary of achievements or tournament tier..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSportModal(false);
                    setEditingSport(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition"
                >
                  {editingSport ? 'Save Changes' : 'Create Sport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL 2: ADD / EDIT PLAYER                            */}
      {/* ===================================================== */}
      {(showAddPlayerModal || editingPlayer) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>{editingPlayer ? 'Edit Team Player' : 'Add New Team Player'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddPlayerModal(false);
                  setEditingPlayer(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sport Affiliation *
                </label>
                <select
                  value={playerFormData.sport_id}
                  onChange={(e) => setPlayerFormData({ ...playerFormData, sport_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="" disabled>
                    Select Sport
                  </option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Player Full Name *
                </label>
                <input
                  type="text"
                  value={playerFormData.player_name}
                  onChange={(e) =>
                    setPlayerFormData({ ...playerFormData, player_name: e.target.value })
                  }
                  placeholder="e.g. Arjun Kumar"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Playing Position
                  </label>
                  <input
                    type="text"
                    value={playerFormData.position}
                    onChange={(e) =>
                      setPlayerFormData({ ...playerFormData, position: e.target.value })
                    }
                    placeholder="e.g. Goalkeeper / Striker"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jersey Number
                  </label>
                  <input
                    type="text"
                    value={playerFormData.jersey_number}
                    onChange={(e) =>
                      setPlayerFormData({ ...playerFormData, jersey_number: e.target.value })
                    }
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={playerFormData.photo_url}
                  onChange={(e) =>
                    setPlayerFormData({ ...playerFormData, photo_url: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={playerFormData.is_captain}
                    onChange={(e) =>
                      setPlayerFormData({ ...playerFormData, is_captain: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span>Designate as Official Team Captain</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPlayerModal(false);
                    setEditingPlayer(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition"
                >
                  {editingPlayer ? 'Save Changes' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL 3: EDIT USER PROFILE & ROLE                     */}
      {/* ===================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                <span>Edit Student Account</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  College USN
                </label>
                <input
                  type="text"
                  value={userFormData.usn}
                  onChange={(e) => setUserFormData({ ...userFormData, usn: e.target.value })}
                  required
                  disabled={editingUser.usn?.toUpperCase() === '1AH24CS212'}
                  className="w-full px-3 py-2 text-xs uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={userFormData.department}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ISE">ISE</option>
                    <option value="AIML">AIML</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="BIOTECH">Biotech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <select
                    value={userFormData.year}
                    onChange={(e) => setUserFormData({ ...userFormData, year: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Role Toggle */}
              <div className="pt-2 p-3 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-900">
                  <input
                    type="checkbox"
                    checked={userFormData.is_admin}
                    disabled={editingUser.usn?.toUpperCase() === '1AH24CS212'}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, is_admin: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span>Grant Administrator Privileges</span>
                </label>
                <p className="text-[11px] text-purple-700 pl-6">
                  Admins can manage sports, edit players, delete records, and modify site settings.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL 4: DELETION CONFIRMATION DIALOG                  */}
      {/* ===================================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">{deleteConfirm.title}</strong>?
                {deleteConfirm.type === 'sport' && (
                  <span className="block text-red-600 font-semibold mt-1">
                    This will also remove all players on this sport's team.
                  </span>
                )}
                {deleteConfirm.type === 'user' && (
                  <span className="block text-red-600 font-semibold mt-1">
                    This student will no longer be able to log in or create team requests.
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'sport') handleConfirmDeleteSport();
                  else if (deleteConfirm.type === 'player') handleConfirmDeletePlayer();
                  else if (deleteConfirm.type === 'user') handleConfirmDeleteUser();
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
