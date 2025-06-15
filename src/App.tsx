import React, { useEffect, useState, useRef } from 'react';
import { AnalogClock } from './components/AnalogClock';
import { TimerControls } from './components/TimerControls';
import { DurationSettings } from './components/DurationSettings';
import { PlayIcon, PauseIcon, CoffeeIcon, Users, X } from 'lucide-react';
import Login from './components/Login';
import { supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface RoomUser {
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [workDuration, setWorkDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(workDuration * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [cycles, setCycles] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [roomId, setRoomId] = useState<string | null>(() => localStorage.getItem('currentRoomId') || null);
  const [currentRoomName, setCurrentRoomName] = useState<string>('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [incomingInvites, setIncomingInvites] = useState<any[]>([]);
  const [showInvitePanel, setShowInvitePanel] = useState<boolean>(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState<boolean>(false);
  const avatarDropdownRef = useRef<HTMLDivElement | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<string | null>(null);
  const [showRoomDropdown, setShowRoomDropdown] = useState<boolean>(false);
  const roomDropdownRef = useRef<HTMLDivElement | null>(null);

  // Kullanıcı profilini çek (avatar ve kullanıcı adı için) - Refactored
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
    setAvatarUrl(data?.avatar_url ?? null);
  };

  // Kullanıcı oturum kontrolü ve profil oluşturma/çekme
  useEffect(() => {
    const getOrCreateProfile = async (userId: string, userEmail: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') { // No rows found
        console.log('Profile not found, creating new one...');
        const defaultUsername = userEmail.split('@')[0];
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: userId, username: defaultUsername }]);
        if (insertError) {
          console.error('Error creating profile:', insertError.message);
        }
      } else if (error) {
        console.error('Error fetching profile:', error.message);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session?.user) {
        getOrCreateProfile(session.user.id, session.user.email || '');
        fetchProfile(session.user.id); // Fetch avatar on initial session load
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      if (session?.user) {
        getOrCreateProfile(session.user.id, session.user.email || '');
        fetchProfile(session.user.id); // Fetch avatar on auth state change
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target as Node)) {
        setShowAvatarDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [avatarDropdownRef]);

  // Room Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(event.target as Node)) {
        setShowRoomDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roomDropdownRef]);

  // Save roomId to local storage
  useEffect(() => {
    if (roomId) {
      localStorage.setItem('currentRoomId', roomId);
    } else {
      localStorage.removeItem('currentRoomId');
    }
  }, [roomId]);

  useEffect(() => {
    resetTimer();
  }, [workDuration, breakDuration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
      audio.play();
      if (isBreak) {
        setTimeLeft(workDuration * 60);
        setIsBreak(false);
        setCycles((prev) => prev + 1);
      } else {
        setTimeLeft(breakDuration * 60);
        setIsBreak(true);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak, cycles, workDuration, breakDuration]);

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
  };
  const toggleBreak = () => {
    setIsActive(false);
    setIsBreak(!isBreak);
    setTimeLeft(!isBreak ? breakDuration * 60 : workDuration * 60);
  };
  const handleWorkDurationChange = (newDuration: number) => {
    if (newDuration >= 1 && newDuration <= 60) {
      setWorkDuration(newDuration);
    }
  };
  const handleBreakDurationChange = (newDuration: number) => {
    if (newDuration >= 1 && newDuration <= 30) {
      setBreakDuration(newDuration);
    }
  };

  // Kullanıcının odalarını çek
  useEffect(() => {
    if (!session?.user) return;
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('room_users')
        .select('room_id, rooms(name)')
        .eq('user_id', session.user.id);
      setRooms(data?.map((r: any) => ({ id: r.room_id, name: r.rooms.name })) || []);
    };
    fetchRooms();
  }, [session, roomId]);

  // Oda üyelerini çek
  useEffect(() => {
    if (!roomId || !session?.user) return;
    const fetchRoomUsers = async () => {
      try {
        // Önce room_users tablosundan kullanıcı ID'lerini al
        const { data: roomUsersData, error: roomUsersError } = await supabase
          .from('room_users')
          .select('user_id') // Reverted to select user_id only
          .eq('room_id', roomId);

        if (roomUsersError) {
          console.error('Error fetching room users:', roomUsersError.message);
          return;
        }

        console.log('roomUsersData:', roomUsersData); // Debug için

        if (!roomUsersData || roomUsersData.length === 0) {
          setRoomUsers([]);
          return;
        }

        // Kullanıcı ID'lerini al ve benzersiz yap
        const userIds = [...new Set(roomUsersData.map(user => user.user_id))];
        console.log('User IDs:', userIds); // Debug için

        // Bu ID'lerle profiles tablosundan kullanıcı bilgilerini al
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url'); // Removed .in(userIds) filter

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError.message);
          return;
        }

        console.log('profilesData:', profilesData); // Debug için

        // Sonuçları birleştir
        const formattedUsers = roomUsersData.map(roomUser => {
          const profile = profilesData?.find(p => p.id === roomUser.user_id);
          return {
            user_id: roomUser.user_id,
            profiles: {
              username: profile?.username || 'Kullanıcı',
              avatar_url: profile?.avatar_url
            }
          };
        });

        console.log('Formatted users:', formattedUsers);
        setRoomUsers(formattedUsers);
      } catch (error) {
        console.error('Error in fetchRoomUsers:', error);
      }
    };
    fetchRoomUsers();
  }, [roomId, session]);

  // Kullanıcıya gelen davetleri çek
  useEffect(() => {
    if (!session?.user) return;
    const fetchInvites = async () => {
      const { data } = await supabase
        .from('invitations')
        .select('id, room_id, rooms(name), from_user, status, created_at')
        .eq('to_user_email', session.user.email)
        .eq('status', 'pending');
      setIncomingInvites(data || []);
      console.log('Gelen davetler:', data);
    };
    fetchInvites();
  }, [session]);

  // Oda oluştur
  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !session?.user) return;
    const { data, error } = await supabase.from('rooms').insert([{ name: newRoomName }]).select();
    if (error) {
      alert('Oda oluşturma hatası: ' + error.message);
      return;
    }
    if (data && data[0]) {
      await supabase.from('room_users').insert([{ room_id: data[0].id, user_id: session.user.id }]);
      setRoomId(data[0].id);
      setNewRoomName('');
    }
  };

  // Odaya katıl
  const handleSelectRoom = (id: string, name: string) => {
    setRoomId(id);
    setCurrentRoomName(name);
  };

  // Logout fonksiyonu
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Odadan Çıkma fonksiyonu
  const handleExitRoom = async () => {
    if (!session?.user || !roomId) return;
    try {
      const { error } = await supabase
        .from('room_users')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error exiting room:', error.message);
        alert('Odadan çıkış yapılırken bir hata oluştu: ' + error.message);
        return;
      }

      // Reset room state
      setRoomId(null);
      setCurrentRoomName('');
      setShowRoomDropdown(false); // Close dropdown
      // The useEffect for fetching rooms will re-run when roomId becomes null,
      // refreshing the list on the room selection screen.
    } catch (error) {
      console.error('Error in handleExitRoom:', error);
      alert('Odadan çıkış yapılırken beklenmedik bir hata oluştu.');
    }
  };

  // Şifre değiştirme fonksiyonu
  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      setPasswordChangeMessage('Yeni şifre boş olamaz.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeMessage('Şifre en az 6 karakter olmalı.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordChangeMessage('Şifre değiştirme hatası: ' + error.message);
    } else {
      setPasswordChangeMessage('Şifreniz başarıyla değiştirildi!');
      setNewPassword(''); // Clear the password input
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordChangeMessage(null);
      }, 2000); // Close modal after 2 seconds
    }
  };

  // Avatar yükleme fonksiyonu
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${session.user.id}/avatar-${Date.now()}.${fileExt}`; // Unique filename
    // Storage'a yükle
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert('Yükleme hatası: ' + uploadError.message);
      return;
    }
    // Public URL al
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    // profiles.avatar_url güncelle
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
    if (updateError) {
      console.error('Error updating profile avatar URL:', updateError.message);
      alert('Profil avatar URL güncelleme hatası: ' + updateError.message);
      return;
    }
    // setAvatarUrl(publicUrl); // Local state update removed, rely on fetchProfile
    setShowAvatarDropdown(false); // Dropdown'ı kapat

    // Force re-fetch profile to update all instances of the avatar
    if (session?.user) {
      fetchProfile(session.user.id);
    }
  };

  // Avatar silme fonksiyonu
  const handleAvatarDelete = async () => {
    if (!session?.user || !avatarUrl) return;
    // Dosya adını avatarUrl'den al
    const fileName = avatarUrl.split('/').pop();
    // NOT: Eğer dosya yolu `${session.user.id}/avatar.${fileExt}` şeklinde ise, sadece 'avatar.ext' kısmı gelecektir.
    // Tam yolu alabilmek için, dosya yükleme mantığını `avatars/${session.user.id}/` klasörüne yükleyecek şekilde düzenlediğimizden,
    // silme işlemi için de tam yolu belirtmeliyiz: `${session.user.id}/${fileName}`
    const fullPathToDelete = `${session.user.id}/${fileName}`;
    if (fullPathToDelete) {
      await supabase.storage.from('avatars').remove([fullPathToDelete]);
    }
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', session.user.id);
    setAvatarUrl(null);
    setShowAvatarDropdown(false); // Dropdown'ı kapat
  };

  // Davet gönder
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !roomId || !session?.user) return;
    await supabase.from('invitations').insert([
      {
        room_id: roomId,
        from_user: session.user.id,
        to_user_email: inviteEmail,
        status: 'pending',
      },
    ]);
    setInviteEmail('');
    alert('Davet gönderildi!');
  };

  // Daveti kabul et
  const handleAcceptInvite = async (invite: any) => {
    if (!session?.user) return;

    // Check if the user is already in the room to prevent duplicate insertions
    const { data: existingRoomUser, error: existingRoomUserError } = await supabase
      .from('room_users')
      .select('id')
      .eq('room_id', invite.room_id)
      .eq('user_id', session.user.id)
      .single();

    if (existingRoomUserError && existingRoomUserError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing room user:', existingRoomUserError.message);
      return;
    }

    if (existingRoomUser) {
      console.warn('User already in this room, invite acceptance skipped.');
      // Update invite status even if user is already in room, to clear pending invite
      await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invite.id);
      // Remove from incoming invites list
      setIncomingInvites((prevInvites) => prevInvites.filter((i) => i.id !== invite.id));
      return; // Stop further execution if user is already in the room
    }

    // Insert user into room_users
    const { error: insertError } = await supabase.from('room_users').insert([
      { room_id: invite.room_id, user_id: session.user.id },
    ]);
    if (insertError) {
      alert('Odaya katılma hatası: ' + insertError.message);
      return;
    }

    // Update invitation status
    await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invite.id);

    // Update local state to remove the accepted invite
    setIncomingInvites((prevInvites) => prevInvites.filter((i) => i.id !== invite.id));

    // Set current room
    setRoomId(invite.room_id);
    setCurrentRoomName(invite.rooms?.name || '');
  };

  // Daveti reddet
  const handleRejectInvite = async (invite: any) => {
    await supabase.from('invitations').update({ status: 'rejected' }).eq('id', invite.id);
    setIncomingInvites((prev) => prev.filter((i) => i.id !== invite.id));
  };

  if (!session) {
    return <Login />;
  }

  // Oda seçilmemişse oda oluştur/seç arayüzü göster
  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-blue-100 w-full p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
          <h2 className="text-2xl font-bold text-indigo-800 mb-4">Oda Seç veya Oluştur</h2>
          <div className="w-full mb-6">
            <input
              type="text"
              placeholder="Yeni oda adı"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              className="w-full mb-2 px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg bg-indigo-50"
            />
            <button
              onClick={handleCreateRoom}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all text-lg"
            >
              Oda Oluştur
            </button>
          </div>
          <div className="w-full">
            <h3 className="font-semibold text-indigo-700 mb-2">Odalarım</h3>
            {rooms.length === 0 && <p className="text-gray-500">Henüz bir odan yok.</p>}
            <ul>
              {rooms.map(room => (
                <li key={room.id} className="mb-2">
                  <button
                    onClick={() => handleSelectRoom(room.id, room.name)}
                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 rounded-lg shadow-sm transition-all text-lg"
                  >
                    {room.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Gelen davetler - Oda Seç/Oluştur ekranına taşındı */}
          {incomingInvites.length > 0 && (
            <div className="w-full mt-6">
              <h3 className="font-semibold text-indigo-700 mb-2">Gelen Davetler</h3>
              <ul>
                {incomingInvites.map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{invite.rooms?.name || 'Oda'} daveti</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvite(invite)}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-2 py-1 rounded-lg text-xs"
                      >
                        Kabul Et
                      </button>
                      <button
                        onClick={() => handleRejectInvite(invite)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-2 py-1 rounded-lg text-xs"
                      >
                        Reddet
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    );
  }

  console.log('showAvatarDropdown:', showAvatarDropdown);
  console.log('showInvitePanel:', showInvitePanel);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-blue-100 w-full p-8 relative">
      {/* Sol Üst Köşe: Avatar ve Dropdown */}
      <div className="absolute top-6 left-8 flex flex-col items-center gap-4 z-10" ref={avatarDropdownRef}>
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center shadow-lg cursor-pointer group"
            onClick={() => {
              console.log('Avatar clicked!');
              setShowAvatarDropdown(!showAvatarDropdown);
            }}>
            <div className="w-full h-full overflow-hidden rounded-full flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-indigo-700">👤</span>
              )}
            </div>
            {showAvatarDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-20">
                {session?.user?.email && (
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 mb-1">
                    {session.user.email}
                  </div>
                )}
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowAvatarDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-50 focus:outline-none"
                >
                  Avatarı Değiştir
                </button>
                {avatarUrl && (
                  <button
                    onClick={() => { handleAvatarDelete(); setShowAvatarDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 focus:outline-none"
                  >
                    Avatarı Sil
                  </button>
                )}
                <button
                  onClick={() => { setShowChangePasswordModal(true); setShowAvatarDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-50 focus:outline-none"
                >
                  Şifremi Değiştir
                </button>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-50 focus:outline-none"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
        {/* New room name button section */} 
        {roomId && (
          <div className="relative flex flex-col items-center gap-4" ref={roomDropdownRef}>
            <span className="text-xs text-gray-500 text-center">Bulunduğunuz oda:</span>
            <button
              onClick={() => setShowRoomDropdown(!showRoomDropdown)}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all text-sm"
            >
              {currentRoomName}
            </button>
            {showRoomDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-20">
                <button
                  onClick={handleExitRoom}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 focus:outline-none"
                >
                  Odadan Çık
                </button>
              </div>
            )}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          className="hidden"
        />
      </div>

      {/* Davet Paneli Sağ Taraf */}
      <div className="absolute top-6 right-8 z-10">
        {!showInvitePanel && (
          <button
            onClick={() => setShowInvitePanel(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition-all flex items-center gap-2"
          >
            <Users className="w-5 h-5" />Davet Et
          </button>
        )}
        {showInvitePanel && (
          <div className="mt-4 bg-white rounded-xl shadow-lg p-4 w-64 flex flex-col gap-4 relative">
            {/* Kapat butonu */}
            <button
              onClick={() => setShowInvitePanel(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none bg-blue-300"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Davet gönderme alanı */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-indigo-700">Kullanıcı Davet Et</h3>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="E-posta adresi"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-indigo-50"
                />
                <button
                  onClick={handleSendInvite}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg shadow transition-all text-sm"
                >
                  Davet Et
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Davet edilen kullanıcıya e-posta ile bildirim gitmez, uygulama içinden davetini görebilir.</p>
            </div>

            {/* Gelen davetler */}
            {/* Bu kısım artık yukarıya taşındı, burada render edilmeyecek */}
            {/* {incomingInvites.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-indigo-700 mb-2">Gelen Davetler</h3>
                <ul>
                  {incomingInvites.map((invite) => (
                    <li key={invite.id} className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{invite.rooms?.name || 'Oda'} daveti</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptInvite(invite)}
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-2 py-1 rounded-lg text-xs"
                        >
                          Kabul Et
                        </button>
                        <button
                          onClick={() => handleRejectInvite(invite)}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-2 py-1 rounded-lg text-xs"
                        >
                          Reddet
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )} */}
            {/* Oda üyeleri listesi */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">Oda Üyeleri</h3>
              <div className="flex flex-wrap gap-4">
                {roomUsers && roomUsers.length > 0 ? (
                  roomUsers.map((user) => (
                    <div key={user.user_id} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden mb-1">
                        {user.profiles?.avatar_url ? (
                          <img src={user.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl text-indigo-700">👤</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-700">{user.profiles?.username || 'Kullanıcı'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Henüz oda üyesi yok</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Şifre Değiştirme Modalı */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-indigo-800 mb-4">Şifre Değiştir</h3>
            <input
              type="password"
              placeholder="Yeni Şifre"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 mb-4 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg bg-indigo-50"
            />
            {passwordChangeMessage && (
              <p className={`text-sm mb-4 ${passwordChangeMessage.includes('başarılı') ? 'text-green-600' : 'text-red-600'}`}>
                {passwordChangeMessage}
              </p>
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-lg transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleChangePassword}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-bold text-indigo-800 mb-8 mt-12">
        Pomodoro Timer
      </h1>
      <DurationSettings
        workDuration={workDuration}
        breakDuration={breakDuration}
        onWorkDurationChange={handleWorkDurationChange}
        onBreakDurationChange={handleBreakDurationChange}
      />
      <div className="bg-white rounded-full p-8 shadow-xl mb-8">
        <AnalogClock
          timeLeft={timeLeft}
          totalTime={isBreak ? breakDuration * 60 : workDuration * 60}
          isBreak={isBreak}
        />
      </div>
      <div className="text-5xl font-mono font-bold text-indigo-900 mb-8">
        {formatTime(timeLeft)}
      </div>
      <div className="flex gap-4 mb-8">
        {!isActive ? (
          <TimerControls onClick={startTimer} icon={<PlayIcon />} label="Start" color="bg-green-500" />
        ) : (
          <TimerControls onClick={pauseTimer} icon={<PauseIcon />} label="Pause" color="bg-yellow-500" />
        )}
        <TimerControls onClick={resetTimer} icon={<div />} label="Reset" color="bg-red-500" />
        <TimerControls
          onClick={toggleBreak}
          icon={<CoffeeIcon />}
          label={isBreak ? 'Work' : 'Break'}
          color={isBreak ? 'bg-indigo-500' : 'bg-blue-500'}
        />
      </div>
      <div className="text-center text-gray-600">
        <p className="text-xl font-medium mb-2">{isBreak ? 'Break Time' : 'Focus Time'}</p>
        <p className="text-sm">Completed cycles: {cycles}</p>
      </div>
    </div>
  );
}