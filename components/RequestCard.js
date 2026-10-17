import Link from 'next/link';
import { Calendar, Clock, Users, Tag, ChevronRight, Trophy, Code, Activity, Sparkles } from 'lucide-react';

export default function RequestCard({ request }) {
  const {
    id,
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

  const typeConfig = {
    sport: {
      label: 'Sport',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Trophy,
    },
    hackathon: {
      label: 'Hackathon',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Code,
    },
    fitness: {
      label: 'Fitness',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Activity,
    },
    event: {
      label: 'Event',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Sparkles,
    },
  };

  const statusConfig = {
    open: {
      label: 'Open',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    },
    filled: {
      label: 'Filled',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotClass: 'bg-indigo-500',
    },
    closed: {
      label: 'Closed',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      dotClass: 'bg-slate-400',
    },
  };

  const tConf = typeConfig[type] || typeConfig.sport;
  const TypeIcon = tConf.icon;
  const sConf = statusConfig[status] || statusConfig.open;

  // Format date and time
  const dateObj = new Date(scheduled_time);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Calculate percentage of spots filled
  const percentFilled = Math.min(100, Math.round((people_joined / people_needed) * 100));
  const spotsLeft = Math.max(0, people_needed - people_joined);

  return (
    <Link
      href={`/requests/${id}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Type & Sport Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tConf.badgeClass}`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {tConf.label}
          </span>

          {sports?.name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {sports.name}
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sConf.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sConf.dotClass}`} />
            {sConf.label}
          </span>
        </div>

        <div className="p-1 rounded-full text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      {/* Title & Description */}
      <div className="mt-3 space-y-1.5">
        <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-brand-600 transition line-clamp-1">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Tags */}
      {skill_tags && skill_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skill_tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
            >
              <Tag className="w-2.5 h-2.5 text-slate-400" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Progress & Capacity */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {status === 'filled' ? (
              <span className="text-indigo-600 font-semibold">All spots filled!</span>
            ) : (
              <span>
                <strong className="text-slate-900">{people_joined}</strong> of {people_needed} joined ({spotsLeft} needed)
              </span>
            )}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">{percentFilled}%</span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              status === 'filled' ? 'bg-indigo-600' : 'bg-brand-600'
            }`}
            style={{ width: `${percentFilled}%` }}
          />
        </div>
      </div>

      {/* Footer Info: Schedule & Creator */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {formattedTime}
          </span>
        </div>

        {creator?.name && (
          <span className="text-slate-400 text-[11px]">
            By <strong className="text-slate-600 font-medium">{creator.name}</strong>
            {creator.department && ` (${creator.department})`}
          </span>
        )}
      </div>
    </Link>
  );
}
