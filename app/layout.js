import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Sports Hub | College Athletics & Team Requests',
  description: 'Official college sports rosters, coaches, and low-friction casual team requests.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">Sports Hub</span> — Official College Sports Directory & Casual Games
            </div>
            <div>
              Built with Next.js & Supabase
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
