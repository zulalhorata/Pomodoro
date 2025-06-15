// src/pages/Login.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
      setUserEmail(null);
    } else if (data.user) {
      setUserEmail(data.user.email ?? null);
      setErrorMsg(null);
      setSuccessMsg('Giriş başarılı!');
      console.log('Giriş başarılı:', data.user);
    }
  };

  const handleRegister = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
    } else if (data.user) {
      await supabase.from('profiles').insert([
        {
          id: data.user.id,
          username: email.split('@')[0],
          avatar_url: null
        }
      ]);
      setSuccessMsg('Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın ve giriş yapın.');
      setIsRegister(false);
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
        <div className="flex w-full mb-6">
          <button
            className={`flex-1 py-2 rounded-l-lg font-semibold text-lg transition-all ${!isRegister ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
            onClick={() => { setIsRegister(false); setErrorMsg(null); setSuccessMsg(null); }}
          >
            Giriş Yap
          </button>
          <button
            className={`flex-1 py-2 rounded-r-lg font-semibold text-lg transition-all ${isRegister ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
            onClick={() => { setIsRegister(true); setErrorMsg(null); setSuccessMsg(null); }}
          >
            Kayıt Ol
          </button>
        </div>
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg bg-indigo-50"
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-3 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg bg-indigo-50"
        />
        {!isRegister ? (
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all text-lg mb-4"
          >
            Giriş Yap
          </button>
        ) : (
          <button
            onClick={handleRegister}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all text-lg mb-4"
          >
            Kayıt Ol
          </button>
        )}
        {errorMsg && <p className="w-full text-center text-red-600 bg-red-100 rounded-lg py-2 px-3 mb-2">{errorMsg}</p>}
        {successMsg && <p className="w-full text-center text-green-700 bg-green-100 rounded-lg py-2 px-3 mb-2">{successMsg}</p>}
        {userEmail && !isRegister && <p className="w-full text-center text-green-700 bg-green-100 rounded-lg py-2 px-3 mb-2">Hoş geldin, {userEmail}!</p>}
      </div>
    </div>
  );
};

export default Login;
