import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NewGoal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para crear una meta",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title,
          target: parseFloat(target),
          current: 0,
          deadline,
          type: 'personal',
          color: 'primary',
        });

      if (error) throw error;

      toast({
        title: "Meta creada",
        description: "Tu nueva meta ha sido creada exitosamente",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la meta. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen animated-wave-bg">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Nueva Meta</h1>
          <p className="text-xs text-muted-foreground">Crea una meta de ahorro</p>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 max-w-2xl mx-auto">
        <Card className="p-6 bg-gradient-card card-glow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Define tu meta</h2>
              <p className="text-sm text-white/70">Completa los detalles</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                ¿Para qué estás ahorrando?
              </Label>
              <Input
                id="title"
                placeholder="Ej: Viaje a Europa, Nueva laptop, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target" className="text-white">
                ¿Cuánto necesitas ahorrar?
              </Label>
              <Input
                id="target"
                type="number"
                placeholder="$0.00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-white">
                ¿Para cuándo?
              </Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white"
              >
                Crear Meta
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewGoal;
