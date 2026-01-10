import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap, Flame, Target, Shield, Crown, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';

interface League {
    id: string;
    name: string;
    minXP: number;
    icon: React.ElementType;
    color: string;
    gradient: string;
}

interface RankingUser {
    id: string;
    name: string;
    xp: number;
    avatarUrl: string;
    rank: number;
    isMe: boolean;
}

const LEAGUES: League[] = [
    { id: '1', name: 'Grano Verde', minXP: 0, icon: Target, color: 'text-emerald-600', gradient: 'from-emerald-50 to-emerald-100' },
    { id: '2', name: 'Cold Brew', minXP: 1000, icon: Shield, color: 'text-cyan-600', gradient: 'from-cyan-50 to-cyan-100' },
    { id: '3', name: 'Latte Artist', minXP: 2500, icon: Zap, color: 'text-amber-600', gradient: 'from-amber-50 to-amber-100' },
    { id: '4', name: 'Espresso Master', minXP: 5000, icon: Crown, color: 'text-[#3E2723]', gradient: 'from-[#D7CCC8] to-[#A1887F]' },
];

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-1 group hover:-translate-y-1 transition-transform duration-300">
        <div className={`p-2 rounded-full ${color.bg} mb-1`}>
            <Icon size={18} className={color.text} />
        </div>
        <span className="text-2xl font-black text-[#292524]">{value}</span>
        <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wide">{label}</span>
    </div>
);

const RankingRow: React.FC<{ user: RankingUser; index: number }> = ({ user, index }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl mb-2 transition-all ${user.isMe ? 'bg-[#3E2723] shadow-lg scale-[1.02]' : 'bg-white border border-stone-100'}`}>
        <div className="flex items-center gap-3">
            <div className={`w-6 text-center font-black ${user.isMe ? 'text-[#D7CCC8]' : 'text-[#A8A29E]'}`}>
                {user.rank}
            </div>
            <div className="relative">
                <img src={user.avatarUrl} alt={user.name} className={`w-10 h-10 rounded-full object-cover ${user.isMe ? 'border-2 border-[#D7CCC8]' : ''}`} />
                {index === 0 && <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full"><Crown size={8} fill="currentColor" /></div>}
            </div>
            <div>
                <p className={`text-sm font-bold ${user.isMe ? 'text-white' : 'text-[#292524]'}`}>{user.name}</p>
                <p className={`text-[10px] ${user.isMe ? 'text-[#A1887F]' : 'text-[#A8A29E]'}`}>Liga Espresso</p>
            </div>
        </div>
        <div className="flex items-center gap-1.5">
            <Zap size={12} className={user.isMe ? 'text-yellow-400 fill-current' : 'text-amber-500'} />
            <span className={`font-black text-sm ${user.isMe ? 'text-white' : 'text-[#292524]'}`}>{user.xp}</span>
        </div>
    </div>
);

const StatsPage = () => {
    const navigate = useNavigate();
    const [rankingTab, setRankingTab] = useState<'friends' | 'global'>('friends');
    const [currentXP, setCurrentXP] = useState(0);
    const [friendsRanking, setFriendsRanking] = useState<RankingUser[]>([]);
    const [globalRanking, setGlobalRanking] = useState<RankingUser[]>([]);
    const [evolutionData, setEvolutionData] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch user's XP
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_xp')
                .eq('id', user.id)
                .single();

            if (profile) {
                setCurrentXP(profile.total_xp || 0);
            }

            // Fetch friends ranking
            const { data: friendsData } = await supabase
                .from('monthly_rankings')
                .select(`
          user_id,
          total_xp,
          rank,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
                .order('rank', { ascending: true })
                .limit(10);

            if (friendsData) {
                const friends = friendsData.map((r: any, idx) => ({
                    id: r.user_id,
                    name: r.profiles?.full_name || r.profiles?.username || 'Usuario',
                    xp: r.total_xp || 0,
                    avatarUrl: r.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user_id}`,
                    rank: idx + 1,
                    isMe: r.user_id === user.id
                }));
                setFriendsRanking(friends);
                setGlobalRanking(friends); // Use same data for now
            }

            // Mock evolution data
            setEvolutionData([
                { month: 'Sem 1', xp: Math.floor(currentXP * 0.3), financeScore: 65 },
                { month: 'Sem 2', xp: Math.floor(currentXP * 0.5), financeScore: 72 },
                { month: 'Sem 3', xp: Math.floor(currentXP * 0.75), financeScore: 78 },
                { month: 'Sem 4', xp: currentXP, financeScore: 85 },
            ]);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const currentLeague = LEAGUES[Math.min(Math.floor(currentXP / 1000), LEAGUES.length - 1)];
    const nextLeague = LEAGUES[Math.min(Math.floor(currentXP / 1000) + 1, LEAGUES.length - 1)];
    const progressToNext = ((currentXP - currentLeague.minXP) / (nextLeague.minXP - currentLeague.minXP)) * 100;

    return (
        <>
            <div className="page-standard min-h-screen pb-24">
                <div className="page-container py-6">
                    <div className="animate-in slide-in-from-right duration-500 pb-10">

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => navigate('/retos')}
                                className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-700"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-lg font-bold text-gray-900">Mi Progreso</h1>
                        </div>

                        {/* League Card */}
                        <div className={`relative w-full h-48 rounded-[2rem] p-6 mb-6 shadow-xl overflow-hidden bg-gradient-to-br ${currentLeague.gradient} border-b-4 border-stone-200`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10"></div>

                            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                                <div className="bg-white/30 backdrop-blur-md p-3 rounded-2xl mb-2 shadow-sm border border-white/40">
                                    <currentLeague.icon size={32} className={currentLeague.color} strokeWidth={1.5} />
                                </div>
                                <h2 className={`text-2xl font-black ${currentLeague.color} mb-1 drop-shadow-sm`}>{currentLeague.name}</h2>
                                <p className="text-xs font-bold text-[#5D4037] opacity-70 mb-4">Liga Actual</p>

                                {/* Progress Bar */}
                                <div className="w-full max-w-[200px]">
                                    <div className="flex justify-between text-[9px] font-bold text-[#5D4037] mb-1 px-1">
                                        <span>{currentXP} XP</span>
                                        <span>{nextLeague.minXP} XP</span>
                                    </div>
                                    <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden border border-white/20 backdrop-blur-sm">
                                        <div
                                            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out relative"
                                            style={{ width: `${Math.min(progressToNext, 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/50"></div>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-[#5D4037] mt-1.5 opacity-80">
                                        Faltan {Math.max(0, nextLeague.minXP - currentXP)} XP para {nextLeague.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <StatCard
                                label="Total XP"
                                value={`${(currentXP / 1000).toFixed(1)}k`}
                                icon={Zap}
                                color={{ bg: 'bg-amber-100', text: 'text-amber-600' }}
                            />
                            <StatCard
                                label="Retos"
                                value="12"
                                icon={Trophy}
                                color={{ bg: 'bg-stone-100', text: 'text-stone-600' }}
                            />
                            <StatCard
                                label="Racha"
                                value="4 sem"
                                icon={Flame}
                                color={{ bg: 'bg-orange-100', text: 'text-orange-600' }}
                            />
                        </div>

                        {/* Rankings Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[#A8A29E] font-bold text-xs uppercase tracking-wider">Clasificación</h3>
                                <div className="bg-[#E7E5E4] p-1 rounded-lg flex gap-1">
                                    <button
                                        onClick={() => setRankingTab('friends')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${rankingTab === 'friends' ? 'bg-white shadow-sm text-[#292524]' : 'text-[#78716C]'}`}
                                    >
                                        Amigos
                                    </button>
                                    <button
                                        onClick={() => setRankingTab('global')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${rankingTab === 'global' ? 'bg-white shadow-sm text-[#292524]' : 'text-[#78716C]'}`}
                                    >
                                        Global
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#F5F5F4] rounded-[1.5rem] p-3">
                                {(rankingTab === 'friends' ? friendsRanking : globalRanking).map((user, idx) => (
                                    <RankingRow key={user.id} user={user} index={idx} />
                                ))}
                                {rankingTab === 'global' && (
                                    <p className="text-center text-[9px] text-[#A8A29E] mt-2 font-medium">Top 20% de la liga</p>
                                )}
                            </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <TrendingUp size={14} className="text-[#A8A29E]" />
                                <h3 className="text-[#A8A29E] font-bold text-[10px] uppercase tracking-wider">Impacto Financiero</h3>
                            </div>

                            <div className="bg-white rounded-[2rem] p-5 shadow-sm border-b-4 border-stone-100 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={evolutionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#d97706" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke="#F5F5F4" strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#A8A29E', fontSize: 10, fontWeight: 'bold' }}
                                            dy={10}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#292524] p-2 rounded-lg text-white shadow-lg text-xs">
                                                            <p className="font-bold mb-1">{payload[0].payload.month}</p>
                                                            <p className="text-amber-400">XP: {payload[0].value}</p>
                                                            <p className="text-emerald-400">Score: {payload[1].value}</p>
                                                        </div>
                                                    )
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area type="monotone" dataKey="xp" stroke="#d97706" strokeWidth={3} fill="url(#colorXP)" />
                                        <Area type="monotone" dataKey="financeScore" stroke="#10b981" strokeWidth={3} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-4 mt-2">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        <span className="text-[9px] font-bold text-[#78716C]">XP Ganado</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[9px] font-bold text-[#78716C]">Salud Financiera</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <BottomNav />
        </>
    );
};

export default StatsPage;
