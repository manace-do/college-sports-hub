'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured, getLocalUsers, saveLocalUsers } from '../../lib/supabaseClient';
import { registerLocalCredentials } from '../../lib/authUtils';
import { useAuth } from '../../lib/auth';
import { Trophy, UserPlus, GraduationCap, Building2, Calendar, Mail, Lock, Heart, Check } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { setLocalSession } = useAuth();

  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('1');
  const [interestsInput, setInterestsInput] = useState('');
  const [selectedSports, setSelectedSports] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(false);

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

  const commonInterests = [
    'Football',
    'Cricket',
    'Volleyball',
    'Throwball',
    'Basketball',
    'Athletics',
    'Fitness',
    'Table Tennis',
    'Badminton',
    'Chess',
  ];

  const toggleSport = (sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanUsn = usn.trim().toUpperCase();
    const cleanEmail = personalEmail.trim().toLowerCase();

    if (!cleanUsn) {
      setErrorMsg('Please enter your College USN / Roll Number.');
      setLoading(false);
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid Personal Email address.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const parsedYear = parseInt(year);
    if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 4) {
      setErrorMsg('Please select a valid undergraduate year (Year 1 to Year 4).');
      setLoading(false);
      return;
    }

    // Combine selected quick sports with any custom hobbies typed
    const customList = interestsInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const combinedInterests = Array.from(new Set([...selectedSports, ...customList]));

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              department: branch,
              year: parsedYear,
              usn: cleanUsn,
              interests: combinedInterests,
              email: cleanEmail,
              college: 'Dr. A.C.S. College of Engineering (ACSCE)',
            },
          },
        });

        if (error) {
          setErrorMsg(error.message || 'Error creating account. Please try again.');
          setLoading(false);
          return;
        }

        // Save academic details into users profile table
        if (data?.user?.id) {
          await supabase
            .from('users')
            .update({
              name: name.trim(),
              department: branch,
              year: parsedYear,
              usn: cleanUsn,
              interests: combinedInterests,
              email: cleanEmail,
              college: 'Dr. A.C.S. College of Engineering (ACSCE)',
            })
            .eq('id', data.user.id);
        }

        setSuccessMsg(true);
        setTimeout(() => {
          router.push('/profile');
        }, 1200);
      } catch (err) {
        setErrorMsg('Network error. Please try again.');
        setLoading(false);
      }
    } else {
      // Local / Starter simulation mode
      const users = getLocalUsers();
      const existing = users.find(
        (u) =>
          u.usn?.toUpperCase() === cleanUsn ||
          (u.email && u.email.toLowerCase() === cleanEmail)
      );

      if (existing) {
        setErrorMsg('An account with this USN or Personal Email is already registered. Please log in.');
        setLoading(false);
        return;
      }

      const newUser = {
        id: `u-${Date.now()}`,
        name: name.trim(),
        usn: cleanUsn,
        email: cleanEmail,
        department: branch,
        year: parsedYear,
        college: 'Dr. A.C.S. College of Engineering (ACSCE)',
        interests: combinedInterests,
        is_admin: false, // Strictly false: signing up never grants admin privileges!
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      saveLocalUsers(users);
      await registerLocalCredentials(cleanUsn, password, cleanEmail);

      const mockUser = {
        id: newUser.id,
        email: cleanEmail,
        user_metadata: {
          name: newUser.name,
          usn: newUser.usn,
          department: newUser.department,
          year: newUser.year,
          college: 'Dr. A.C.S. College of Engineering (ACSCE)',
          email: cleanEmail,
        },
      };

      setLocalSession(mockUser, newUser, true);
      setSuccessMsg(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-10">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Registration
          </h1>
          <p className="text-xs text-slate-500">
            Dr. A.C.S. College of Engineering (ACSCE) — Sign up with your College USN and Personal Email
          </p>
        </div>

        {/* Fixed College Institution Badge */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Institution
            </span>
            <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
              Dr. A.C.S. College of Engineering (ACSCE)
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 shrink-0">
            Official Portal
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            Account created successfully! Redirecting to your profile...
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full Name & USN in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
              />
            </div>

            {/* College USN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                College USN *
              </label>
              <input
                type="text"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                placeholder="e.g. 1AH24CS212"
                required
                className="w-full px-3.5 py-2.5 text-sm uppercase tracking-wide bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-semibold"
              />
            </div>
          </div>

          {/* Personal Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Personal Email *
            </label>
            <input
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              placeholder="e.g. rahul.sharma@gmail.com"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Used securely for authentication and account access
            </span>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Password * (min 6 characters)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>

          {/* Branch & Year in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Branch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Department / Branch *
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
              >
                {branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Academic Year *
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          {/* Interests & Hobbies Section */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-brand-600" />
              Interests & Hobbies
            </label>
            <p className="text-[11px] text-slate-500">
              Select your favorite sports or hobbies to help teammates find you:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {commonInterests.map((interest) => {
                const isSelected = selectedSports.includes(interest);
                return (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => toggleSport(interest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom hobbies text input */}
            <input
              type="text"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              placeholder="Other hobbies, comma-separated (e.g. Cycling, Swimming, Gym)"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 mt-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Sign Up as Student'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Log in with USN or Personal Email
          </Link>
        </div>
      </div>
    </div>
  );
}
