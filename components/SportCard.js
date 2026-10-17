import Link from 'next/link';
import { ChevronRight, Activity, Shield } from 'lucide-react';

export default function SportCard({ sport }) {
  const { id, name, category } = sport;

  const categoryConfig = {
    men: {
      label: "Men's Team",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      dotClass: "bg-blue-500",
    },
    women: {
      label: "Women's Team",
      badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
      dotClass: "bg-fuchsia-500",
    },
  };

  const cat = categoryConfig[category?.toLowerCase()] || {
    label: category === 'women' ? "Women's Team" : "Men's Team",
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  };

  return (
    <Link
      href={`/sports/${id}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Sport Icon & Name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:border-brand-100 transition">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-600 transition">
              College {name} Team
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cat.badgeClass} mt-1`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cat.dotClass}`} />
              {cat.label}
            </span>
            {sport.description && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                {sport.description}
              </p>
            )}
          </div>
        </div>

        <div className="p-1 rounded-full text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      {/* Team Players Action & Status */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>ACSCE College Team</span>
        </div>
        <span className="font-semibold text-brand-600 group-hover:underline">
          View Players
        </span>
      </div>
    </Link>
  );
}
