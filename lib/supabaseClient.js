import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sports_hub_auth_session',
      },
    })
  : null;

// Initial baseline template (Strictly 6 Men and 4 Women college sports)
export const INITIAL_SPORTS = [
  { id: 'sp-01', name: 'Football', category: 'men', description: 'Varsity collegiate football team.' },
  { id: 'sp-02', name: 'Volleyball', category: 'men', description: 'Men\'s collegiate volleyball squad.' },
  { id: 'sp-03', name: 'Cricket', category: 'men', description: 'Inter-collegiate tournament cricket team.' },
  { id: 'sp-04', name: 'Throwball', category: 'men', description: 'Men\'s competitive throwball squad.' },
  { id: 'sp-05', name: 'Basketball', category: 'men', description: 'Men\'s varsity basketball team.' },
  { id: 'sp-06', name: 'Athletics', category: 'men', description: 'Track and field athletics (Men).' },
  { id: 'sp-07', name: 'Volleyball', category: 'women', description: 'Women\'s collegiate volleyball squad.' },
  { id: 'sp-08', name: 'Throwball', category: 'women', description: 'Women\'s varsity throwball team.' },
  { id: 'sp-09', name: 'Basketball', category: 'women', description: 'Women\'s varsity basketball team.' },
  { id: 'sp-10', name: 'Athletics', category: 'women', description: 'Track and field athletics (Women).' },
];

export const STARTER_SPORTS = INITIAL_SPORTS;

export const INITIAL_ROSTER = [
  { id: 'r-01', sport_id: 'sp-01', player_name: 'Arjun K', position: 'Goalkeeper', is_captain: true, jersey_number: '1' },
  { id: 'r-02', sport_id: 'sp-01', player_name: 'Ravi M', position: 'Defender', is_captain: false, jersey_number: '4' },
  { id: 'r-03', sport_id: 'sp-01', player_name: 'Imran S', position: 'Striker', is_captain: false, jersey_number: '9' },
  { id: 'r-04', sport_id: 'sp-01', player_name: 'Dev P', position: 'Midfielder', is_captain: false, jersey_number: '8' },
  { id: 'r-05', sport_id: 'sp-02', player_name: 'Nikhil J', position: 'Spiker', is_captain: true, jersey_number: '10' },
  { id: 'r-06', sport_id: 'sp-02', player_name: 'Varun K', position: 'Libero', is_captain: false, jersey_number: '2' },
  { id: 'r-07', sport_id: 'sp-03', player_name: 'Rohan S', position: 'Batsman', is_captain: true, jersey_number: '7' },
  { id: 'r-08', sport_id: 'sp-03', player_name: 'Amit V', position: 'Bowler', is_captain: false, jersey_number: '11' },
  { id: 'r-09', sport_id: 'sp-03', player_name: 'Sameer K', position: 'All-rounder', is_captain: false, jersey_number: '33' },
  { id: 'r-10', sport_id: 'sp-04', player_name: 'Chetan M', position: 'Lifter', is_captain: true, jersey_number: '6' },
  { id: 'r-11', sport_id: 'sp-04', player_name: 'Harish G', position: 'Attacker', is_captain: false, jersey_number: '9' },
  { id: 'r-12', sport_id: 'sp-05', player_name: 'Vikram A', position: 'Point Guard', is_captain: true, jersey_number: '3' },
  { id: 'r-13', sport_id: 'sp-05', player_name: 'Karthik R', position: 'Center', is_captain: false, jersey_number: '15' },
  { id: 'r-14', sport_id: 'sp-06', player_name: 'Ankit B', position: 'Long Jump', is_captain: true, jersey_number: '' },
  { id: 'r-15', sport_id: 'sp-06', player_name: 'Saurabh T', position: '200m Sprint', is_captain: false, jersey_number: '' },
  { id: 'r-16', sport_id: 'sp-07', player_name: 'Kavya S', position: 'Setter', is_captain: true, jersey_number: '4' },
  { id: 'r-17', sport_id: 'sp-07', player_name: 'Deepa N', position: 'Attacker', is_captain: false, jersey_number: '7' },
  { id: 'r-18', sport_id: 'sp-08', player_name: 'Meera P', position: 'Setter', is_captain: true, jersey_number: '5' },
  { id: 'r-19', sport_id: 'sp-08', player_name: 'Pooja R', position: 'Attacker', is_captain: false, jersey_number: '8' },
  { id: 'r-20', sport_id: 'sp-09', player_name: 'Tanvi D', position: 'Forward', is_captain: true, jersey_number: '23' },
  { id: 'r-21', sport_id: 'sp-09', player_name: 'Ritu B', position: 'Shooting Guard', is_captain: false, jersey_number: '11' },
  { id: 'r-22', sport_id: 'sp-10', player_name: 'Priya N', position: '100m Sprint', is_captain: true, jersey_number: '' },
  { id: 'r-23', sport_id: 'sp-10', player_name: 'Sneha M', position: 'High Jump', is_captain: false, jersey_number: '' },
];

export const STARTER_REQUESTS = [
  {
    id: 'req-01',
    creator_id: 'u-001',
    sport_id: 'sp-01',
    type: 'sport',
    title: 'Need 2 for football match',
    description: 'Casual 7-a-side match on the college main ground.',
    skill_tags: ['football', 'casual'],
    people_needed: 2,
    people_joined: 1,
    scheduled_time: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'open',
    sports: { name: 'Football' },
    creator: { name: 'Dhruv', department: 'CSE', year: 3 },
    members: []
  }
];

// Local persistence storage keys
const LOCAL_SPORTS_KEY = 'sports_hub_custom_sports';
const LOCAL_ROSTER_KEY = 'sports_hub_custom_roster';
const LOCAL_USERS_KEY = 'sports_hub_custom_users';
const LOCAL_SETTINGS_KEY = 'sports_hub_custom_settings';

export const INITIAL_USERS = [
  {
    id: 'u-001',
    name: 'Dhruv Sharma',
    usn: '1MS21CS015',
    department: 'CSE',
    year: 3,
    interests: ['Football', 'Cricket'],
    bio: 'Passionate midfield playmaker and casual chess enthusiast. Ready for evening campus turf games.',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    college: 'Dr. A.C.S. College of Engineering (ACSCE)',
    phone: '+91 98765 43210',
    is_admin: false,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'u-002',
    name: 'Ananya Rao',
    usn: '1MS22EC034',
    department: 'ECE',
    year: 2,
    interests: ['Throwball', 'Athletics'],
    bio: 'Inter-collegiate 200m sprinter and university throwball attacker. Training on weekday mornings.',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    college: 'Dr. A.C.S. College of Engineering (ACSCE)',
    phone: '+91 98450 11223',
    is_admin: false,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'u-003',
    name: 'Rahul V',
    usn: '1MS20ME008',
    department: 'MECH',
    year: 4,
    interests: ['Basketball'],
    bio: 'Varsity point guard with 4 years collegiate tournament experience.',
    photo_url: '',
    college: 'Dr. A.C.S. College of Engineering (ACSCE)',
    phone: '+91 97312 88990',
    is_admin: false,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'u-admin-01',
    name: 'Sports Administrator',
    usn: '1AH24CS212',
    department: 'CSE',
    year: 4,
    interests: ['Football', 'Basketball', 'Athletics'],
    bio: 'Official campus athletic director & administrator for Sports Hub.',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    college: 'Dr. A.C.S. College of Engineering (ACSCE)',
    phone: '+91 80 2360 0822',
    is_admin: true, // Primary administrator (1AH24CS212)
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const INITIAL_SETTINGS = {
  portal_config: {
    portal_title: 'Sports Hub | ACSCE',
    tagline: 'Dr. A.C.S. College of Engineering (ACSCE) Sports Portal',
    institution: 'Dr. A.C.S. College of Engineering (ACSCE)',
    welcome_message: 'Browse official ACSCE team players, view captains, or find teammates for casual evening games without having to ask anyone directly.',
  },
  coach_profile: {
    name: 'Coach R. Sharma',
    title: 'Head Coach & Director of Physical Education',
    bio: 'Overseeing athletic development, tournament training, and fitness programs across all collegiate sports.',
    office: 'Third Floor',
  },
  contact_info: {
    department: 'Department of Physical Education and Sports',
    location: 'Third Floor',
  },
};

// Helper for local storage retrieval without overwriting user changes
export const getLocalSports = () => {
  if (typeof window === 'undefined') return INITIAL_SPORTS;
  try {
    const raw = localStorage.getItem(LOCAL_SPORTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_SPORTS_KEY, JSON.stringify(INITIAL_SPORTS));
      return INITIAL_SPORTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Remove any legacy mixed category sports
      const cleaned = parsed.filter((s) => s.category !== 'mixed');
      if (cleaned.length === 0 || cleaned.length < INITIAL_SPORTS.length) {
        localStorage.setItem(LOCAL_SPORTS_KEY, JSON.stringify(INITIAL_SPORTS));
        return INITIAL_SPORTS;
      }
      return cleaned;
    }
    return INITIAL_SPORTS;
  } catch (e) {
    return INITIAL_SPORTS;
  }
};

export const saveLocalSports = (sportsList) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_SPORTS_KEY, JSON.stringify(sportsList));
};

export const getLocalRoster = () => {
  if (typeof window === 'undefined') return INITIAL_ROSTER;
  try {
    const raw = localStorage.getItem(LOCAL_ROSTER_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_ROSTER_KEY, JSON.stringify(INITIAL_ROSTER));
      return INITIAL_ROSTER;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_ROSTER;
  }
};

export const saveLocalRoster = (rosterList) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_ROSTER_KEY, JSON.stringify(rosterList));
};

export const getLocalUsers = () => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    // Ensure primary admin 1AH24CS212 maintains verified administrator status
    const adminUser = parsed.find((u) => u.usn?.toUpperCase() === '1AH24CS212');
    if (adminUser && !adminUser.is_admin) {
      adminUser.is_admin = true;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
    } else if (!adminUser) {
      parsed.push(INITIAL_USERS.find((u) => u.usn === '1AH24CS212'));
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return INITIAL_USERS;
  }
};

export const saveLocalUsers = (usersList) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersList));
};

export const getLocalSettings = () => {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SETTINGS;
  }
};

export const saveLocalSettings = (settings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
};

// =====================================================
// UNIFIED DATA ACCESS API (Database-first with persistence)
// =====================================================

// 1. Fetch All Sports
export const getSports = async () => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching sports from database:', error.message);
      return [];
    }
    return data || [];
  }

  return getLocalSports();
};

// 2. Fetch Single Sport with Roster
export const getSportWithRoster = async (sportId) => {
  if (isSupabaseConfigured() && supabase) {
    const { data: sport, error: sportErr } = await supabase
      .from('sports')
      .select('*')
      .eq('id', sportId)
      .single();

    if (sportErr || !sport) return null;

    const { data: roster } = await supabase
      .from('roster_entries')
      .select('*')
      .eq('sport_id', sportId)
      .order('is_captain', { ascending: false });

    return {
      ...sport,
      roster_entries: roster || [],
    };
  }

  const allSports = getLocalSports();
  const sport = allSports.find((s) => s.id === sportId);
  if (!sport) return null;

  const allRoster = getLocalRoster();
  const roster = allRoster.filter((r) => r.sport_id === sportId);
  return {
    ...sport,
    roster_entries: roster,
  };
};

// 3. Save Sport (Insert or Update/Rename)
export const saveSport = async (sport) => {
  if (isSupabaseConfigured() && supabase) {
    if (sport.id && !sport.id.startsWith('sp-local-')) {
      // Update existing sport in Supabase
      const { data, error } = await supabase
        .from('sports')
        .update({
          name: sport.name.trim(),
          category: sport.category,
          coach_name: sport.coach_name ? sport.coach_name.trim() : null,
          description: sport.description ? sport.description.trim() : null,
        })
        .eq('id', sport.id)
        .select();

      if (error) throw error;
      return data[0];
    } else {
      // Create new sport in Supabase
      const { data, error } = await supabase
        .from('sports')
        .insert({
          name: sport.name.trim(),
          category: sport.category,
          coach_name: sport.coach_name ? sport.coach_name.trim() : null,
          description: sport.description ? sport.description.trim() : null,
        })
        .select();

      if (error) throw error;
      return data[0];
    }
  }

  // Local persistence mode
  const sports = getLocalSports();
  if (sport.id) {
    const index = sports.findIndex((s) => s.id === sport.id);
    if (index !== -1) {
      sports[index] = { ...sports[index], ...sport };
      saveLocalSports(sports);
      return sports[index];
    }
  }

  const newSport = {
    ...sport,
    id: `sp-local-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  sports.push(newSport);
  saveLocalSports(sports);
  return newSport;
};

// 4. Delete Sport
export const deleteSport = async (sportId) => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('sports').delete().eq('id', sportId);
    if (error) throw error;
    return true;
  }

  // Local persistence mode
  const sports = getLocalSports().filter((s) => s.id !== sportId);
  saveLocalSports(sports);

  const roster = getLocalRoster().filter((r) => r.sport_id !== sportId);
  saveLocalRoster(roster);
  return true;
};

// 5. Fetch Roster for Sport
export const getRosterForSport = async (sportId) => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('roster_entries')
      .select('*')
      .eq('sport_id', sportId)
      .order('is_captain', { ascending: false });

    if (error) {
      console.error('Error fetching roster:', error.message);
      return [];
    }
    return data || [];
  }

  const roster = getLocalRoster();
  return roster.filter((r) => r.sport_id === sportId);
};

// 6. Save Player (Insert or Update/Rename)
export const savePlayer = async (player) => {
  if (isSupabaseConfigured() && supabase) {
    // If setting captain, first unset any existing captain for that sport to prevent 409 error
    if (player.is_captain) {
      await supabase
        .from('roster_entries')
        .update({ is_captain: false })
        .eq('sport_id', player.sport_id);
    }

    if (player.id && !player.id.startsWith('r-local-')) {
      // Update existing player
      const { data, error } = await supabase
        .from('roster_entries')
        .update({
          player_name: player.player_name.trim(),
          position: player.position ? player.position.trim() : null,
          is_captain: Boolean(player.is_captain),
          sport_id: player.sport_id,
          jersey_number: player.jersey_number ? player.jersey_number.trim() : null,
          photo_url: player.photo_url ? player.photo_url.trim() : null,
        })
        .eq('id', player.id)
        .select();

      if (error) throw error;
      return data[0];
    } else {
      // Insert new player
      const { data, error } = await supabase
        .from('roster_entries')
        .insert({
          sport_id: player.sport_id,
          player_name: player.player_name.trim(),
          position: player.position ? player.position.trim() : null,
          is_captain: Boolean(player.is_captain),
          jersey_number: player.jersey_number ? player.jersey_number.trim() : null,
          photo_url: player.photo_url ? player.photo_url.trim() : null,
        })
        .select();

      if (error) throw error;
      return data[0];
    }
  }

  // Local persistence mode
  const allRoster = getLocalRoster();
  if (player.is_captain) {
    allRoster.forEach((r) => {
      if (r.sport_id === player.sport_id) r.is_captain = false;
    });
  }

  if (player.id) {
    const idx = allRoster.findIndex((r) => r.id === player.id);
    if (idx !== -1) {
      allRoster[idx] = { ...allRoster[idx], ...player };
      saveLocalRoster(allRoster);
      return allRoster[idx];
    }
  }

  const newPlayer = {
    ...player,
    id: `r-local-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  allRoster.push(newPlayer);
  saveLocalRoster(allRoster);
  return newPlayer;
};

// 7. Delete Player
export const deletePlayer = async (playerId) => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('roster_entries').delete().eq('id', playerId);
    if (error) throw error;
    return true;
  }

  const allRoster = getLocalRoster().filter((r) => r.id !== playerId);
  saveLocalRoster(allRoster);
  return true;
};

// =====================================================
// USERS MANAGEMENT API (Administrator privileges)
// =====================================================

export const getUsers = async () => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users from database:', error.message);
      return [];
    }
    return data || [];
  }

  return getLocalUsers();
};

export const adminUpdateUser = async (user) => {
  if (!user || !user.id) throw new Error('User ID is required');

  if (user.year !== undefined && user.year !== null && user.year !== '') {
    const y = parseInt(user.year);
    if (isNaN(y) || y < 1 || y > 4) {
      throw new Error('Academic year must be between Year 1 and Year 4.');
    }
  }

  if (isSupabaseConfigured() && supabase) {
    // Try RPC first (safely bypasses column-level restrictions via security definer)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_update_user', {
      p_user_id: user.id,
      p_name: user.name ? user.name.trim() : null,
      p_department: user.department ? user.department.trim() : null,
      p_year: user.year ? parseInt(user.year) : null,
      p_is_admin: typeof user.is_admin === 'boolean' ? user.is_admin : null,
      p_usn: user.usn ? user.usn.trim().toUpperCase() : null,
    });

    if (!rpcErr) return rpcData;

    // Fallback direct update on users table
    const { data, error } = await supabase
      .from('users')
      .update({
        name: user.name?.trim(),
        department: user.department?.trim() || null,
        year: user.year ? parseInt(user.year) : null,
        is_admin: Boolean(user.is_admin),
        usn: user.usn ? user.usn.trim().toUpperCase() : null,
      })
      .eq('id', user.id)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Local storage mode
  const users = getLocalUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    users[idx] = {
      ...users[idx],
      name: user.name ? user.name.trim() : users[idx].name,
      department: user.department !== undefined ? user.department : users[idx].department,
      year: user.year !== undefined ? parseInt(user.year) : users[idx].year,
      is_admin: typeof user.is_admin === 'boolean' ? user.is_admin : users[idx].is_admin,
      usn: user.usn ? user.usn.trim().toUpperCase() : users[idx].usn,
    };
    saveLocalUsers(users);

    // Sync session if currently logged in user matches
    if (typeof window !== 'undefined') {
      try {
        const rawSession = localStorage.getItem('sports_hub_local_session');
        if (rawSession) {
          const sess = JSON.parse(rawSession);
          if (sess.user?.id === user.id || sess.profile?.id === user.id) {
            sess.profile = users[idx];
            localStorage.setItem('sports_hub_local_session', JSON.stringify(sess));
          }
        }
      } catch (e) {}
    }

    return users[idx];
  }
  throw new Error('User not found in records.');
};

export const adminDeleteUser = async (userId) => {
  if (isSupabaseConfigured() && supabase) {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_delete_user', {
      p_user_id: userId,
    });
    if (!rpcErr) return true;

    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    return true;
  }

  const users = getLocalUsers();
  const target = users.find((u) => u.id === userId);
  if (target && target.usn?.toUpperCase() === '1AH24CS212') {
    throw new Error('Cannot delete primary administrator account (1AH24CS212).');
  }

  const filtered = users.filter((u) => u.id !== userId);
  saveLocalUsers(filtered);
  return true;
};

// =====================================================
// INDIVIDUAL USER PROFILE API
// =====================================================

export const getUserProfile = async (userId) => {
  if (!userId) return null;

  if (isSupabaseConfigured() && supabase) {
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // Auto-heal missing profile row if user exists in auth but missing in public.users
    if (!data) {
      try {
        const { data: healed } = await supabase.rpc('ensure_user_profile', {
          p_user_id: userId,
        });
        if (healed) return healed;
      } catch (e) {
        // Fallback insert if RPC not executed yet
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && authUser.id === userId) {
          const fallbackProfile = {
            id: userId,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Student',
            usn: authUser.user_metadata?.usn || authUser.email?.split('@')[0]?.toUpperCase() || '',
            department: authUser.user_metadata?.department || 'CSE',
            year: authUser.user_metadata?.year ? parseInt(authUser.user_metadata.year) : 1,
            college: 'Dr. A.C.S. College of Engineering (ACSCE)',
            interests: [],
            bio: '',
            photo_url: '',
          };
          const { data: inserted } = await supabase
            .from('users')
            .insert(fallbackProfile)
            .select()
            .maybeSingle();
          if (inserted) return inserted;
        }
      }
    }

    if (data && data.usn?.toUpperCase() === '1AH24CS212' && !data.is_admin) {
      try {
        await supabase.rpc('promote_primary_admin', { p_admin_usn: '1AH24CS212' });
        data.is_admin = true;
      } catch (e) {
        // Safe catch if RPC already locked
      }
    }

    return data;
  }

  // Local storage mode
  const users = getLocalUsers();
  return users.find((u) => u.id === userId) || null;
};

export const updateUserProfile = async (userId, profileData) => {
  if (!userId) throw new Error('User ID is required');

  if (profileData.year !== undefined && profileData.year !== null && profileData.year !== '') {
    const y = parseInt(profileData.year);
    if (isNaN(y) || y < 1 || y > 4) {
      throw new Error('Academic year must be between Year 1 and Year 4.');
    }
  }

  const payload = {
    name: profileData.name ? profileData.name.trim() : undefined,
    department: profileData.department ? profileData.department.trim() : undefined,
    year: profileData.year ? parseInt(profileData.year) : undefined,
    interests: Array.isArray(profileData.interests) ? profileData.interests : undefined,
    bio: typeof profileData.bio === 'string' ? profileData.bio.trim() : undefined,
    photo_url: typeof profileData.photo_url === 'string' ? profileData.photo_url.trim() : undefined,
    college: 'Dr. A.C.S. College of Engineering (ACSCE)',
    phone: typeof profileData.phone === 'string' ? profileData.phone.trim() : undefined,
  };

  // Filter undefined values
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Local storage mode
  const users = getLocalUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    users[idx] = {
      ...users[idx],
      ...payload,
    };
    saveLocalUsers(users);

    // Sync session if currently logged in user matches
    if (typeof window !== 'undefined') {
      try {
        const rawSession = localStorage.getItem('sports_hub_local_session');
        if (rawSession) {
          const sess = JSON.parse(rawSession);
          if (sess.user?.id === userId || sess.profile?.id === userId) {
            sess.profile = users[idx];
            localStorage.setItem('sports_hub_local_session', JSON.stringify(sess));
          }
        }
      } catch (e) {}
    }

    return users[idx];
  }

  throw new Error('User not found.');
};

export const getUserRosterMemberships = async (userId, userName) => {
  if (isSupabaseConfigured() && supabase) {
    // 1. Check by user_id
    let { data, error } = await supabase
      .from('roster_entries')
      .select('*, sports(*)')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      // 2. Check by player_name if user_id is not yet explicitly set
      if (userName) {
        const { data: byName } = await supabase
          .from('roster_entries')
          .select('*, sports(*)')
          .ilike('player_name', userName.trim());

        if (byName && byName.length > 0) return byName;
      }
      return [];
    }
    return data || [];
  }

  // Local storage mode
  const roster = getLocalRoster();
  const sports = getLocalSports();
  const cleanName = (userName || '').toLowerCase().trim();

  const userRosters = roster.filter(
    (r) => r.user_id === userId || (cleanName && r.player_name.toLowerCase().trim() === cleanName)
  );

  return userRosters.map((r) => {
    const sp = sports.find((s) => s.id === r.sport_id);
    return {
      ...r,
      sports: sp || { name: 'Unknown Sport', category: 'mixed', coach_name: 'Unassigned' },
    };
  });
};


// =====================================================
// SITE SETTINGS API (Branding, Announcements, Contact)
// =====================================================

export const getSiteSettings = async () => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error || !data || data.length === 0) {
      return INITIAL_SETTINGS;
    }

    const settingsObj = { ...INITIAL_SETTINGS };
    data.forEach((row) => {
      settingsObj[row.key] = row.value;
    });
    return settingsObj;
  }

  return getLocalSettings();
};

export const saveSiteSetting = async (key, value) => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data[0];
  }

  const current = getLocalSettings();
  current[key] = value;
  saveLocalSettings(current);
  return { key, value };
};

// =====================================================
// ONE-TIME PRIMARY ADMIN SETUP & VERIFICATION
// =====================================================

export const checkAdminStatus = async () => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.rpc('get_admin_status');
    if (!error && data) {
      return {
        hasAdmin: Boolean(data.has_admin),
        adminCount: Number(data.admin_count || 0),
      };
    }

    // Fallback count query
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_admin', true);

    return {
      hasAdmin: Boolean(count && count > 0),
      adminCount: count || 0,
    };
  }

  const users = getLocalUsers();
  const admins = users.filter((u) => u.is_admin);
  return {
    hasAdmin: admins.length > 0,
    adminCount: admins.length,
  };
};

export const verifyAndPromotePrimaryAdmin = async (usn) => {
  const cleanUsn = (usn || '').trim().toUpperCase();
  if (cleanUsn !== '1AH24CS212') {
    throw new Error('Only the designated primary USN (1AH24CS212) can be verified as Primary Administrator.');
  }

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.rpc('promote_primary_admin', {
      p_admin_usn: cleanUsn,
    });

    if (error) {
      if (error.message.includes('ADMIN_ALREADY_INITIALIZED')) {
        throw new Error('Administrator account is already initialized and verified. Setup is permanently locked.');
      }
      if (error.message.includes('USER_NOT_REGISTERED')) {
        throw new Error('No registered account found with USN 1AH24CS212. Please register via the Signup page first.');
      }
      throw new Error(error.message || 'Verification failed.');
    }

    return data;
  }

  // Local storage mode verification
  const users = getLocalUsers();
  const existingAdmin = users.find((u) => u.is_admin);
  if (existingAdmin) {
    if (existingAdmin.usn?.toUpperCase() === cleanUsn) {
      return { success: true, already_admin: true, usn: cleanUsn };
    }
    throw new Error('Administrator account is already initialized and verified. Setup is permanently locked.');
  }

  let targetUser = users.find((u) => u.usn?.toUpperCase() === cleanUsn);
  if (!targetUser) {
    targetUser = {
      id: `u-${Date.now()}`,
      name: 'Sports Administrator',
      usn: cleanUsn,
      department: 'CSE',
      year: 4,
      interests: ['Football', 'Athletics'],
      is_admin: true,
      created_at: new Date().toISOString(),
    };
    users.push(targetUser);
  } else {
    targetUser.is_admin = true;
  }

  saveLocalUsers(users);

  // Sync current local session if matching
  if (typeof window !== 'undefined') {
    try {
      const rawSession = localStorage.getItem('sports_hub_local_session');
      if (rawSession) {
        const sess = JSON.parse(rawSession);
        if (sess.user?.user_metadata?.usn === cleanUsn || sess.profile?.usn === cleanUsn) {
          sess.profile = targetUser;
          localStorage.setItem('sports_hub_local_session', JSON.stringify(sess));
        }
      }
    } catch (e) {}
  }

  return {
    success: true,
    user_id: targetUser.id,
    name: targetUser.name,
    usn: cleanUsn,
  };
};

// =====================================================
// PLAYER TERMINOLOGY ALIASES (Preserving schema stability)
// =====================================================
export const getSportWithPlayers = getSportWithRoster;
export const getPlayersForSport = getRosterForSport;
export const getUserPlayerMemberships = getUserRosterMemberships;

/**
 * Resolves authentication email for a USN.
 * Checks RPC function, users table, or local storage.
 * Supports personal email logins without exposing emails publicly.
 */
export const getAuthEmailByUsn = async (usn) => {
  if (!usn) return null;
  const cleanUsn = usn.trim().toUpperCase();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc('get_auth_email_by_usn', {
        p_usn: cleanUsn,
      });
      if (!error && data) return data;
    } catch (e) {}

    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('email, id')
        .eq('usn', cleanUsn)
        .maybeSingle();

      if (userRow?.email) return userRow.email;
    } catch (e) {}

    // Fallback to legacy USN format for existing accounts
    return `${cleanUsn.toLowerCase().replace(/[^a-z0-9]/g, '')}@college.edu`;
  }

  // Local mode lookup
  const users = getLocalUsers();
  const matched = users.find((u) => u.usn?.toUpperCase() === cleanUsn);
  return matched?.email || null;
};

/**
 * Checks whether an account with the given USN or Personal Email already exists.
 * Used before calling signUp to prevent duplicate account creation and save Supabase email quota.
 */
export const checkRegistrationExists = async (usn, email) => {
  const cleanUsn = usn ? usn.trim().toUpperCase() : '';
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc('check_registration_exists', {
        p_usn: cleanUsn,
        p_email: cleanEmail,
      });
      if (!error && data) {
        return {
          usnExists: Boolean(data.usn_exists),
          emailExists: Boolean(data.email_exists),
        };
      }
    } catch (e) {}

    // Fallback direct check via users table / auth email lookup
    let usnExists = false;
    let emailExists = false;

    if (cleanUsn) {
      try {
        const found = await getAuthEmailByUsn(cleanUsn);
        if (found && !found.endsWith('@college.edu')) {
          usnExists = true;
        }
      } catch (e) {}
    }

    if (cleanEmail) {
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (userRow) emailExists = true;
      } catch (e) {}
    }

    return { usnExists, emailExists };
  }

  // Local storage mode
  const users = getLocalUsers();
  return {
    usnExists: Boolean(cleanUsn && users.some((u) => u.usn?.toUpperCase() === cleanUsn)),
    emailExists: Boolean(cleanEmail && users.some((u) => u.email?.toLowerCase() === cleanEmail)),
  };
};

/**
 * Resends verification email for an unconfirmed personal email account.
 */
export const resendVerificationEmail = async (email) => {
  if (!email) throw new Error('Email is required');
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });
    if (error) throw error;
    return data;
  }

  return true;
};

/**
 * Sends a password reset email to a registered personal email.
 */
export const requestPasswordReset = async (email) => {
  if (!email) throw new Error('Email is required');
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured() && supabase) {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return data;
  }

  return true;
};




