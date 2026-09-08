import { Star, LogIn, Sparkles, GraduationCap, Smartphone } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-center">
        {/* Left: brand */}
        <div className="hidden md:block px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sky-100 text-xs font-semibold text-sky-700 shadow-sm mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Flipped Classroom · IPAS Kelas 6 SD
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Bel­ajar seru bareng<br />
            <span className="bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-transparent">Kak Bintang</span>,
            siap KBM bareng Bu Guru.
          </h1>
          <p className="text-slate-600 mt-4 leading-relaxed max-w-md">
            Rangkuman ringan malam sebelum kelas untuk siswa, dashboard miskonsepsi & slide adaptif untuk guru.
            Semua dalam satu aplikasi.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex gap-2 items-start">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center"><Smartphone className="w-4 h-4" /></div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Mode Siswa</div>
                <div className="text-slate-500">Chat WhatsApp-style</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex gap-2 items-start">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center"><GraduationCap className="w-4 h-4" /></div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Mode Guru</div>
                <div className="text-slate-500">Dashboard + Slide AI</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: login card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-md">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <div className="font-display font-extrabold text-xl text-slate-900">Bintang<span className="text-sky-600">Kelas</span></div>
              <div className="text-xs text-slate-500">Masuk untuk mulai</div>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-900">Selamat datang! 👋</h2>
          <p className="text-sm text-slate-500 mt-1">Masuk pakai akun Google-mu, praktis dan aman.</p>

          <button
            data-testid="btn-login-google"
            onClick={handleLogin}
            className="mt-6 w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.2 0 18.9-7.4 19.5-17.5.1-.8.1-1.7 0-2.5-.1-1-.3-2-.4-3z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.5 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2c-2 1.5-4.6 2.3-7.3 2.3-5.4 0-9.9-3.6-11.5-8.5l-6.5 5C9.4 39.4 16.1 43.5 24 43.5z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.5-4.5 5.9l6.2 5.2C40.7 36.4 43.5 30.7 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
            </svg>
            Masuk dengan Google
          </button>

          <div className="mt-4 text-[11px] text-slate-400 leading-relaxed">
            Dengan masuk, kamu setuju layanan ini digunakan sesuai kebijakan sekolah.
            Autentikasi dikelola oleh Emergent · Google OAuth.
          </div>
        </div>
      </div>
    </div>
  );
}
