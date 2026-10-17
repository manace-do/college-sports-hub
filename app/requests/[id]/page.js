'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  supabase,
  isSupabaseConfigured,
  STARTER_REQUESTS,
} from '../../../lib/supabaseClient';
import {
  Users,
  Calendar,
  Clock,
  Tag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Code,
  Activity,
  Sparkles,
  Lock,
  UserCheck,
} from 'lucide-react';

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id;

  const [request, setRequest] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState(null);

  useEffect(() => {
    async function fetchRequestData() {
      setLoading(true);

      if (!isSupabaseConfigured() || !supabase) {
        const found = STARTER_REQUESTS.find((r) => r.id === requestId) || STARTER_REQUESTS[0];
        setRequest(found);
        setMembers(found.members || []);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('team_requests')
          .select('*, sports(name)')
          .eq('id', requestId)
          .single();

        if (error || !data) {
          const fallback = STARTER_REQUESTS.find((r) => r.id === requestId) || STARTER_REQUESTS[0];
          setRequest(fallback);
          setMembers(fallback.members || []);
        } else {
          setRequest(data);

          // Fetch members
          const { data: joinsData } = await supabase
            .from('request_joins')
            .select('id, joined_at, users(id, name, department, year)')
            .eq('request_id', requestId)
            .order('joined_at', { ascending: true });

          if (joinsData) {
            setMembers(joinsData.map((j) => ({
              id: j.id,
              name: j.users?.name || 'Student',
              department: j.users?.department || 'N/A',
              year: j.users?.year || 1,
              joined_at: j.joined_at,
            })));
          }
        }
      } catch (err) {
        console.error('Error fetching request:', err);
        const fallback = STARTER_REQUESTS.find((r) => r.id === requestId) || STARTER_REQUESTS[0];
        setRequest(fallback);
        setMembers(fallback.members || []);
      } finally {
        setLoading(false);
      }
    }

    if (requestId) {
      fetchRequestData();
    }
  }, [requestId]);

  const handleJoin = async () => {
    setJoinLoading(true);
    setJoinMessage(null);

    // If live Supabase is configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.rpc('join_request', {
          p_request_id: requestId,
        });

        if (error) {
          const errorMap = {
            NOT_LOGGED_IN: 'You must log in to join a request.',
            REQUEST_NOT_OPEN: 'This request is full or closed.',
            CREATOR_CANNOT_JOIN: 'You are the creator of this request.',
            ALREADY_JOINED: "You have already joined this request.",
          };
          setJoinMessage({
            type: 'error',
            text: errorMap[error.message] || error.message || 'Failed to join request.',
          });
          setJoinLoading(false);
          return;
        }

        setJoined(true);
        setJoinMessage({
          type: 'success',
          text: "You've successfully joined! You can now coordinate with the team.",
        });
        // Optimistically increment
        setRequest((prev) => ({
          ...prev,
          people_joined: prev.people_joined + 1,
          status: prev.people_joined + 1 >= prev.people_needed ? 'filled' : 'open',
        }));
      } catch (err) {
        setJoinMessage({ type: 'error', text: 'Error joining request.' });
      } finally {
        setJoinLoading(false);
      }
    } else {
      // Offline/Starter mode simulation
      setTimeout(() => {
        setJoined(true);
        setJoinMessage({
          type: 'success',
          text: "You've joined this request in preview mode!",
        });
        setRequest((prev) => ({
          ...prev,
          people_joined: Math.min(prev.people_needed, prev.people_joined + 1),
          status: prev.people_joined + 1 >= prev.people_needed ? 'filled' : 'open',
        }));
        setMembers((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            name: 'You (Student)',
            department: 'Your Dept',
            year: 1,
            joined_at: new Date().toISOString(),
          },
        ]);
        setJoinLoading(false);
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200 p-6" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12 space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Request not found</h2>
        <Link href="/requests" className="text-sm font-semibold text-brand-600 hover:underline">
          Return to Team Requests
        </Link>
      </div>
    );
  }

  const {
    title,
    description,
    type,
    sports,
    people_needed,
    people_joined = 0,
    scheduled_time,
    status,
    skill_tags = [],
    creator,
  } = request;

  const dateObj = new Date(scheduled_time);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const percentFilled = Math.min(100, Math.round((people_joined / people_needed) * 100));
  const spotsLeft = Math.max(0, people_needed - people_joined);
  const isFull = status === 'filled' || people_joined >= people_needed;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Back button */}
      <Link
        href="/requests"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to All Requests
      </Link>

      {/* Main Request Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
              {type}
            </span>
            {sports?.name && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {sports.name}
              </span>
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isFull
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : status === 'closed'
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFull ? 'bg-indigo-500' : status === 'closed' ? 'bg-slate-400' : 'bg-emerald-500'
              }`}
            />
            {isFull ? 'Filled' : status === 'closed' ? 'Closed' : 'Open for Joining'}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {description}
            </p>
          )}
        </div>

        {/* Skill Tags */}
        {skill_tags && skill_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {skill_tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200"
              >
                <Tag className="w-3 h-3 text-slate-400" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Date & Location schedule box */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-xs">Date</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-xs">Scheduled Time</span>
              <span className="font-semibold text-slate-800">{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <span>
                <strong>{people_joined}</strong> of {people_needed} spots filled
              </span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isFull ? 'All spots taken' : `${spotsLeft} spots remaining`}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFull ? 'bg-indigo-600' : 'bg-brand-600'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>

        {/* Join Notification Alert */}
        {joinMessage && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 border ${
              joinMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {joinMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{joinMessage.text}</span>
          </div>
        )}

        {/* 1-Tap Join Action */}
        <div className="pt-2">
          {joined ? (
            <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              You are part of this team!
            </div>
          ) : isFull ? (
            <button
              disabled
              className="w-full py-3.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-semibold text-sm cursor-not-allowed text-center"
            >
              This request is fully filled
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joinLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {joinLoading ? (
                <span>Joining...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Join This Request (1-Tap)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Member List Section (Privacy Protected) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Joined Members ({members.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Only members and the creator can view this list.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700">
            Private Squad
          </span>
        </div>

        {members.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 italic">
            No one has joined yet. Be the first!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m, idx) => (
              <div key={m.id || idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900 text-sm block">{m.name}</span>
                    <span className="text-xs text-slate-400">
                      {m.department} • Year {m.year}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">Member</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
