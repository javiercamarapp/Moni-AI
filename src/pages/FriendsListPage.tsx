import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, MoreHorizontal, Trophy, Zap, User, MessageCircle, UserMinus, X, AlertTriangle, Trash2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';

interface Friend {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string;
    level: number;
    rank: number;
}

// Friend Options Modal
const FriendOptionsModal = ({
    friend,
    onClose,
    onViewProfile,
    onChat,
    onDeleteConfirm
}: {
    friend: Friend;
    onClose: () => void;
    onViewProfile: () => void;
    onChat: () => void;
    onDeleteConfirm: () => void;
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!friend) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#292524]/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-[300px] rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200 overflow-hidden">

                {!isDeleting ? (
                    <>
                        <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={friend.avatarUrl}
                                    alt={friend.name}
                                    className="w-10 h-10 rounded-full border border-stone-200 object-cover"
                                />
                                <div>
                                    <h3 className="text-sm font-extrabold text-[#292524] leading-tight">{friend.name}</h3>
                                    <p className="text-[10px] font-bold text-[#A8A29E]">{friend.handle}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 bg-[#F5F5F4] rounded-full text-[#78716C] hover:bg-[#E7E5E4]">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            <button
                                onClick={onViewProfile}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAFAF9] border border-[#E7E5E4] text-[#57534E] font-bold text-xs hover:bg-[#F5F5F4] hover:border-stone-200 transition-colors group"
                            >
                                <div className="p-1.5 bg-white rounded-lg shadow-sm text-[#A8A29E] group-hover:text-[#57534E]">
                                    <User size={16} />
                                </div>
                                <span>Ver perfil</span>
                            </button>

                            <button
                                onClick={onChat}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAFAF9] border border-[#E7E5E4] text-[#57534E] font-bold text-xs hover:bg-[#F5F5F4] hover:border-stone-200 transition-colors group"
                            >
                                <div className="p-1.5 bg-white rounded-lg shadow-sm text-[#A8A29E] group-hover:text-[#57534E]">
                                    <MessageCircle size={16} />
                                </div>
                                <span>Mandar mensaje</span>
                            </button>

                            <button
                                onClick={() => setIsDeleting(true)}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] font-bold text-xs hover:bg-[#FEE2E2] transition-colors group"
                            >
                                <div className="p-1.5 bg-white rounded-lg shadow-sm text-[#fca5a5] group-hover:text-[#ef4444]">
                                    <UserMinus size={16} />
                                </div>
                                <span>Eliminar de amigo</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <AlertTriangle size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-extrabold text-[#292524] mb-1">¿Estás seguro?</h3>
                        <p className="text-xs text-[#78716C] mb-6">
                            Eliminarás a <span className="font-bold">{friend.name}</span> de tu lista de amigos. Esta acción no se puede deshacer.
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsDeleting(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-xs text-[#57534E] bg-[#F5F5F4] hover:bg-[#E7E5E4]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onDeleteConfirm}
                                className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-1.5"
                            >
                                <Trash2 size={14} />
                                <span>Eliminar</span>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

const FriendsListPage = () => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch friends from friendships table
            const { data: friendships } = await supabase
                .from('friendships')
                .select(`
          friend_id,
          profiles:friend_id (
            id,
            full_name,
            username,
            avatar_url,
            total_xp
          )
        `)
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            if (friendships) {
                const friendsList = friendships.map((f: any) => ({
                    id: f.profiles.id,
                    name: f.profiles.full_name || f.profiles.username || 'Usuario',
                    handle: `@${f.profiles.username || 'usuario'}`,
                    avatarUrl: f.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.profiles.id}`,
                    level: Math.floor((f.profiles.total_xp || 0) / 100) + 1,
                    rank: 0 // Will be calculated from rankings
                }));
                setFriends(friendsList);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedFriend) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('friendships')
                .delete()
                .eq('user_id', user.id)
                .eq('friend_id', selectedFriend.id);

            setFriends(friends.filter(f => f.id !== selectedFriend.id));
            setSelectedFriend(null);
        } catch (error) {
            console.error('Error deleting friend:', error);
        }
    };

    return (
        <>
            <div className="page-standard min-h-screen pb-24">
                <div className="page-container py-6">
                    <div className="animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => navigate('/retos')}
                                className="p-2 -ml-2 rounded-full text-[#78716C] hover:bg-stone-100 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-[#292524] text-xl font-extrabold tracking-tight">Mis Amigos</h1>
                            <button
                                onClick={() => navigate('/add-friend')}
                                className="p-2 -mr-2 rounded-full text-[#8D6E63] hover:bg-[#FFF7ED] transition-colors"
                            >
                                <Plus size={24} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]">
                                <Search size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar en mis amigos..."
                                className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm text-[#292524] placeholder-[#A8A29E] focus:outline-none focus:border-[#8D6E63] focus:ring-1 focus:ring-[#8D6E63] shadow-sm"
                            />
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-8">
                                    <p className="text-sm font-bold text-[#A8A29E]">Cargando...</p>
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="text-center py-8 opacity-50">
                                    <p className="text-sm font-bold text-[#A8A29E]">No tienes amigos aún.</p>
                                </div>
                            ) : (
                                friends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        onClick={() => console.log('View profile:', friend.id)}
                                        className="bg-white rounded-[1.25rem] p-3 shadow-sm border-b-4 border-stone-100 flex items-center justify-between group active:scale-[0.99] transition-transform cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={friend.avatarUrl}
                                                    alt={friend.name}
                                                    className="w-12 h-12 rounded-full border-2 border-stone-100 object-cover"
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-[#292524] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white flex items-center gap-0.5">
                                                    <Zap size={6} fill="currentColor" />
                                                    <span>{friend.level}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-[#292524] leading-tight">{friend.name}</h3>
                                                <p className="text-[10px] font-bold text-[#A8A29E]">{friend.handle}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-bold text-[#A8A29E] uppercase tracking-wide">Ranking</span>
                                                <div className="flex items-center gap-1 text-[#B45309]">
                                                    <Trophy size={10} fill="currentColor" />
                                                    <span className="text-xs font-black">#{friend.rank || '-'}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFriend(friend);
                                                }}
                                                className="text-[#D6D3D1] hover:text-[#78716C] p-2 hover:bg-stone-50 rounded-full transition-colors"
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <p className="text-center text-[#A8A29E] text-[10px] font-bold mt-6 uppercase tracking-widest opacity-60">
                            {friends.length} Amigos en total
                        </p>

                        {/* Action Modal */}
                        {selectedFriend && (
                            <FriendOptionsModal
                                friend={selectedFriend}
                                onClose={() => setSelectedFriend(null)}
                                onViewProfile={() => {
                                    console.log('View profile');
                                    setSelectedFriend(null);
                                }}
                                onChat={() => {
                                    console.log('Chat');
                                    setSelectedFriend(null);
                                }}
                                onDeleteConfirm={handleDelete}
                            />
                        )}
                    </div>
                </div>
            </div>
            <BottomNav />
        </>
    );
};

export default FriendsListPage;
