'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSportWithRoster, getSiteSettings, supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';
import RequestCard from '../../../components/RequestCard';
import {
  Trophy,
  User,
  Star,
  Shield,
  ArrowLeft,
  Users,
  Plus,
  Calendar,
  Activity,
} from 'lucide-react';

export default function SportDetailPage() {
  const params = useParams();
  const sportId = params.id;

  const [sport, setSport] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [roster, setRoster] = useState([]);
  const [sportRequests, setSportRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSportData() {
      setLoading(true);

      try {
        const [sportData, settingsData] = await Promise.all([
          getSportWithRoster(sportId),
          getSiteSettings(),
        ]);

        setSiteSettings(settingsData);

        if (!sportData) {
          setSport(null);
          setRoster([]);
        } else {
          setSport(sportData);
          const sortedRoster = (sportData.roster_entries || []).sort((a, b) => {
            if (a.is_captain && !b.is_captain) return -1;
            if (!a.is_captain && b.is_captain) return 1;
            return a.player_name.localeCompare(b.player_name);
          });
          setRoster(sortedRoster);
        }

        // Fetch team requests for this specific sport
        if (isSupabaseConfigured() && supabase) {
          const { data: reqsData } = await supabase
            .from('team_requests')
            .select('*, sports(name)')
            .eq('sport_id', sportId)
            .order('scheduled_time', { ascending: true });

          setSportRequests(reqsData || []);
        } else {
          setSportRequests([]);
        }
      } catch (err) {
        console.error('Error fetching sport data:', err);
        setSport(null);
        setRoster([]);
        setSportRequests([]);
      } finally {
        setLoading(false);
      }
    }

    if (sportId) {
      fetchSportData();
    }
  }, [sportId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-36 bg-white rounded-3xl border border-slate-200 p-6" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200 p-6" />
      </div>
    );
  }

  if (!sport) {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <Trophy className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Sport Not Found</h2>
        <p className="text-xs text-slate-500">
          This sport may have been renamed or deleted by the administrator.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition"
          >
            Return to Sports Directory
          </Link>
        </div>
      </div>
    );
  }

  const captain = roster.find((p) => p.is_captain);
  const players = roster.filter((p) => !p.is_captain);

  const categoryLabels = {
    men: "Men's Team",
    women: "Women's Team",
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Sports Directory
      </Link>

      {/* Sport Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                {categoryLabels[sport.category?.toLowerCase()] || sport.category}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Dr. A.C.S. College of Engineering (ACSCE)
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              College {sport.name} Team
            </h1>
            {sport.description && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                {sport.description}
              </p>
            )}
          </div>

          <Link
            href={`/requests/new?sport=${sport.id}`}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Post {sport.name} Request
          </Link>
        </div>

        {/* Coach & Squad Metadata */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">College Head Coach</span>
              <span className="font-semibold text-slate-800">
                {siteSettings?.coach_profile?.name || 'Coach R. Sharma'}
              </span>
            </div>
          </div>

          {captain && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Team Captain</span>
                <span className="font-semibold text-slate-800">
                  {captain.player_name}
                  {captain.position && ` (${captain.position})`}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Squad Size</span>
              <span className="font-semibold text-slate-800">
                {roster.length} registered {roster.length === 1 ? 'player' : 'players'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Team Players Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-600" />
              Official Team Players
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified players officially representing ACSCE in College {sport.name} Team
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {roster.length} Players
          </span>
        </div>

        {roster.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No players added yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No players have been registered on the official team players list for this sport yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {/* Captain First */}
            {captain && (
              <div className="p-4 bg-amber-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-sm shadow-xs">
                    {captain.jersey_number ? `#${captain.jersey_number}` : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{captain.player_name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                        <Star className="w-3 h-3 fill-amber-700 text-amber-700" />
                        Captain
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {captain.position && <span>{captain.position}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-800">Team Captain</span>
              </div>
            )}

            {/* Other Squad Players */}
            {players.map((player) => (
              <div
                key={player.id}
                className="p-4 bg-white hover:bg-slate-50/70 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                    {player.jersey_number ? `#${player.jersey_number}` : player.player_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm block">
                      {player.player_name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {player.position && <span>{player.position}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">Squad Player</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Casual Team Requests for this sport */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Casual Games & Requests for {sport.name}
            </h3>
            <p className="text-xs text-slate-500">
              Pick-up games posted by students looking for teammates
            </p>
          </div>

          <Link
            href={`/requests/new?sport=${sport.id}`}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            + Need players?
          </Link>
        </div>

        {sportRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No active requests for {sport.name}</p>
            <p className="text-xs text-slate-500">
              Be the first to post a casual request or practice session!
            </p>
            <div className="pt-2">
              <Link
                href={`/requests/new?sport=${sport.id}`}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition"
              >
                Create {sport.name} Request
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sportRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
