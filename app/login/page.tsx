'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // ถ้า Login อยู่แล้ว ให้ไปหน้า Admin
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isLoggedIn === 'true') {
      router.replace('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Username/Password ธรรมดา (ใน Production ควรเก็บใน env และเข้ารหัส)
      const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
      const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminLoginTime', Date.now().toString());
        router.push('/admin');
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <img src="/logo.png" alt="Logo" className="h-16 sm:h-20" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">เข้าสู่ระบบ Admin</h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลการบริจาค</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 sm:py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 text-slate-900 placeholder-slate-500 text-base"
              placeholder="กรอกชื่อผู้ใช้"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 sm:py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 text-slate-900 placeholder-slate-500 text-base"
              placeholder="กรอกรหัสผ่าน"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 sm:py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center text-base touch-manipulation"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                เข้าสู่ระบบ
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
