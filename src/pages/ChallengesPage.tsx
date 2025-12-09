import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { ChallengesCarousel } from '@/components/social/ChallengesCarousel';
import { ChallengeDetailsModal } from '@/components/social/ChallengeDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const DEMO_WEEKLY_CHALLENGES = [
    {
        id: '1',
        type: 'budget',
        title: 'Café en Casa',
        description: 'Prepara tu café en casa 3 veces esta semana.',
        xpReward: 850,
        icon: 'Wallet',
        target: 500,
        unit: 'MXN',
        currentProgress: 320,
        isActive: false,
        period: 'weekly' as const,
        theme: 'latte' as const,
        aiReason: 'Tus gastos en cafeterías suman $1,200/mes. Reducirlo tendrá gran impacto.',
        tips: ['Compra café de grano de buena calidad.', 'Invierte en un termo bonito.']
    },
    {
        id: 'saving',
        type: 'saving',
        title: 'Stash Express',
        description: 'Guarda $1,000 extra en tu fondo de emergencia.',
        xpReward: 1200,
        icon: 'PiggyBank',
        target: 1000,
        unit: 'MXN',
        currentProgress: 0,
        isActive: false,
        period: 'weekly' as const,
        theme: 'sage' as const,
        aiReason: 'Tu fondo de emergencia está un poco bajo este mes.',
        tips: ['Transfiere lo que te sobre del finde.', 'Vende algo que no uses.']
    },
    {
        id: '3',
        type: 'ratio',
        title: 'Ahorro Turbo',
        description: 'Ahorra el 20% de todo ingreso extra hoy.',
        xpReward: 1000,
        icon: 'TrendingUp',
        target: 20,
        unit: '%',
        currentProgress: 15,
        isActive: false,
        period: 'weekly' as const,
        theme: 'clay' as const,
        aiReason: 'Tu tasa de ahorro está al 18%. Llega al 20% para subir de nivel.',
        tips: ['Transfiere el monto apenas lo recibas.', 'Usa apartados automáticos.']
    },
    {
        id: '4',
        type: 'streak',
        title: 'Sin Uber Eats',
        description: 'Cocina en casa. Cero delivery por 5 días.',
        xpReward: 600,
        icon: 'Utensils',
        target: 5,
        unit: 'días',
        currentProgress: 4,
        isActive: false,
        period: 'weekly' as const,
        theme: 'sand' as const,
        aiReason: 'Gastaste $3,200 en delivery el mes pasado.',
        tips: ['Haz Meal Prep el domingo.', 'Borra la app temporalmente.']
    },
    {
        id: '5',
        type: 'budget',
        title: 'Fin de Semana',
        description: 'Presupuesto estricto de ocio para el finde.',
        xpReward: 1200,
        icon: 'ShoppingBag',
        target: 2000,
        unit: 'MXN',
        currentProgress: 0,
        isActive: false,
        period: 'weekly' as const,
        theme: 'espresso' as const,
        aiReason: 'El ocio representa el 40% de tus gastos variables.',
        tips: ['Busca actividades gratuitas.', 'Lleva efectivo, deja la tarjeta.']
    }
];

const DEMO_MONTHLY_CHALLENGES = [
    {
        id: 'invest1',
        type: 'investment',
        title: 'Inversor Novato',
        description: 'Realiza tu primera aportación a un ETF o Fondo.',
        xpReward: 3000,
        icon: 'Landmark',
        target: 1,
        unit: 'acción',
        currentProgress: 0,
        isActive: false,
        period: 'monthly' as const,
        theme: 'espresso' as const,
        aiReason: 'Tienes exceso de liquidez perdiendo valor por inflación.',
        tips: ['Busca ETFs de bajo costo como VOO o IVVPESO.', 'Empieza con poco.']
    },
    {
        id: 'debt1',
        type: 'debt',
        title: 'Bola de Nieve',
        description: 'Paga $2,000 extra a tu deuda más pequeña.',
        xpReward: 2500,
        icon: 'CreditCard',
        target: 2000,
        unit: 'MXN',
        currentProgress: 500,
        isActive: false,
        period: 'monthly' as const,
        theme: 'latte' as const,
        aiReason: 'Eliminar esa tarjeta pequeña liberará $1,500 de flujo mensual.',
        tips: ['Usa el método bola de nieve.', 'Aplica pagos directo a capital.']
    },
    {
        id: 'm1',
        type: 'ratio',
        title: 'Ahorro Agresivo',
        description: 'Ahorra el 30% de tus ingresos este mes.',
        xpReward: 2500,
        icon: 'TrendingUp',
        target: 30,
        unit: '%',
        currentProgress: 12,
        isActive: false,
        period: 'monthly' as const,
        theme: 'sage' as const,
        aiReason: 'Tus ingresos fueron altos este mes, aprovecha.',
        tips: ['Revisa tus gastos fijos.', 'Cancela suscripciones no usadas.']
    }
];

const ChallengesPage = () => {
    const navigate = useNavigate();
    const [weeklyChallenges, setWeeklyChallenges] = useState<any[]>(DEMO_WEEKLY_CHALLENGES);
    const [monthlyChallenges, setMonthlyChallenges] = useState<any[]>(DEMO_MONTHLY_CHALLENGES);
    const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

    useEffect(() => {
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch user's challenges
            const { data: userChallenges } = await supabase
                .from('user_challenge_progress')
                .select(`
          id,
          challenge_id,
          progress,
          completed,
          daily_challenges (
            id,
            titulo,
            descripcion,
            xp_reward,
            period
          )
        `)
                .eq('user_id', user.id);

            if (userChallenges && userChallenges.length > 0) {
                const weekly = userChallenges
                    .filter((c: any) => c.daily_challenges?.period === 'weekly')
                    .map((c: any) => ({
                        id: c.id,
                        title: c.daily_challenges?.titulo || 'Reto Semanal',
                        description: c.daily_challenges?.descripcion || '',
                        xpReward: c.daily_challenges?.xp_reward || 500,
                        icon: 'Target',
                        target: 100,
                        unit: 'puntos',
                        currentProgress: c.progress || 0,
                        isActive: !c.completed,
                        period: 'weekly' as const,
                        // Fallback theme since DB doesn't have it yet
                        theme: 'sand' as const
                    }));

                const monthly = userChallenges
                    .filter((c: any) => c.daily_challenges?.period === 'monthly')
                    .map((c: any) => ({
                        id: c.id,
                        title: c.daily_challenges?.titulo || 'Reto Mensual',
                        description: c.daily_challenges?.descripcion || '',
                        xpReward: c.daily_challenges?.xp_reward || 1000,
                        icon: 'TrendingUp',
                        target: 100,
                        unit: 'puntos',
                        currentProgress: c.progress || 0,
                        isActive: !c.completed,
                        period: 'monthly' as const,
                        theme: 'sand' as const
                    }));

                // Only override if we actually found challenges of that type
                if (weekly.length > 0) setWeeklyChallenges(weekly);
                if (monthly.length > 0) setMonthlyChallenges(monthly);
            }
        } catch (error) {
            console.error('Error fetching challenges:', error);
        }
    };

    const handleAcceptChallenge = (id: string) => {
        console.log('Accept challenge:', id);
        toast.success('¡Reto aceptado!');
        // Ideally update backend here
    };

    return (
        <>
            <div className="page-standard min-h-screen pb-24">
                <div className="page-container py-6">
                    <div className="animate-in fade-in slide-in-from-right duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => navigate('/retos')}
                                className="p-2 -ml-2 rounded-full text-[#78716C] hover:bg-stone-100 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-[#292524] text-xl font-extrabold tracking-tight">Mis Retos</h1>
                        </div>

                        {/* Weekly Challenges */}
                        <ChallengesCarousel
                            period="weekly"
                            challenges={weeklyChallenges}
                            onAcceptChallenge={handleAcceptChallenge}
                            onViewDetails={(challenge) => setSelectedChallenge(challenge)}
                        />

                        {/* Monthly Challenges */}
                        <ChallengesCarousel
                            period="monthly"
                            challenges={monthlyChallenges}
                            onAcceptChallenge={handleAcceptChallenge}
                            onViewDetails={(challenge) => setSelectedChallenge(challenge)}
                        />
                    </div>
                </div>
            </div>

            {selectedChallenge && (
                <ChallengeDetailsModal
                    challenge={selectedChallenge}
                    onClose={() => setSelectedChallenge(null)}
                    onAccept={() => handleAcceptChallenge(selectedChallenge.id)}
                />
            )}

            <BottomNav />
        </>
    );
};

export default ChallengesPage;
