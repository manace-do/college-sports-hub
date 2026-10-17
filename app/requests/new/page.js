'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSports, supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/auth';
import { ArrowLeft, Plus, Calendar, Users, Trophy, Sparkles } from 'lucide-react';

function CreateRequestForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const preselectedSport = searchParams.get('sport') || '';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [sportsList, setSportsList] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: preselectedSport ? 'sport' : 'sport',
    sport_id: preselectedSport || '',
    people_needed: 2,
    scheduled_time: '',
    skill_tags_input: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    async function loadSports() {
      const data = await getSports();
      setSportsList(data || []);
    }
    loadSports();

    // Default scheduled time to tomorrow at 6 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    const localIso = tomorrow.toISOString().slice(0, 16);
    setFormData((prev) => ({ ...prev, scheduled_time: localIso }));
  }, [preselectedSport]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    if (!formData.title.trim()) {
      setErrorMsg('Please provide a title for your request.');
      setSubmitting(false);
      return;
    }

    if (formData.type === 'sport' && !formData.sport_id) {
      setErrorMsg('Please select a sport for this request.');
      setSubmitting(false);
      return;
    }

    if (parseInt(formData.people_needed) < 1) {
      setErrorMsg('People needed must be at least 1.');
      setSubmitting(false);
      return;
    }

    const tagsArray = formData.skill_tags_input
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newRequestPayload = {
      type: formData.type,
      sport_id: formData.type === 'sport' ? formData.sport_id : null,
      title: formData.title.trim(),
      description: formData.description.trim(),
      people_needed: parseInt(formData.people_needed),
      scheduled_time: new Date(formData.scheduled_time).toISOString(),
      skill_tags: tagsArray,
      status: 'open',
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('team_requests')
          .insert(newRequestPayload)
          .select();

        if (error) {
          setErrorMsg(error.message || 'Error creating request.');
          setSubmitting(false);
          return;
        }

        setSuccessMsg(true);
        setTimeout(() => {
          router.push('/requests');
        }, 1200);
      } catch (err) {
        setErrorMsg('Network error. Please try again.');
        setSubmitting(false);
      }
    } else {
      // Offline/Starter mode simulation
      const mockNew = {
        id: `mock-${Date.now()}`,
        ...newRequestPayload,
        people_joined: 0,
        creator: { name: 'You (Student)', department: 'Your Dept', year: 1 },
        sports: sportsList.find((s) => s.id === formData.sport_id) || null,
        members: [],
      };
      STARTER_REQUESTS.unshift(mockNew);
      setSuccessMsg(true);
      setTimeout(() => {
        router.push('/requests');
      }, 1000);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Create Team Request
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Post an open request for a casual game, fitness run, or hackathon squad.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          Request published successfully! Redirecting to feed...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Activity Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Activity Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'sport', label: 'Sport' },
              { key: 'fitness', label: 'Fitness' },
              { key: 'hackathon', label: 'Hackathon' },
              { key: 'event', label: 'Event' },
            ].map((t) => (
              <button
                type="button"
                key={t.key}
                onClick={() => setFormData({ ...formData, type: t.key })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition capitalize ${
                  formData.type === t.key
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Linked Sport (conditional) */}
        {formData.type === 'sport' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Sport *
            </label>
            <select
              value={formData.sport_id}
              onChange={(e) => setFormData({ ...formData, sport_id: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            >
              <option value="">-- Choose a Sport --</option>
              {sportsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Request Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Need 2 for 7v7 football evening match"
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Description / Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide context: meeting spot, skill level, what to bring..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs resize-none"
          />
        </div>

        {/* People needed & Scheduled Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              People Needed *
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.people_needed}
              onChange={(e) => setFormData({ ...formData, people_needed: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Number of other players you need (excluding you)
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>
        </div>

        {/* Skill tags */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tags / Skills (Optional, comma-separated)
          </label>
          <input
            type="text"
            value={formData.skill_tags_input}
            onChange={(e) => setFormData({ ...formData, skill_tags_input: e.target.value })}
            placeholder="e.g. striker, beginner-friendly, boots required"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition disabled:opacity-50"
        >
          {submitting ? 'Publishing...' : 'Publish Request'}
        </button>
      </form>
    </div>
  );
}

export default function CreateRequestPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/requests"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Requests
      </Link>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
        <CreateRequestForm />
      </Suspense>
    </div>
  );
}
