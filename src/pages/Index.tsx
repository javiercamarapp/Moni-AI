import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Target, TrendingUp, Users, MessageCircle, Trophy, Shield, Heart } from 'lucide-react';
import heroImage from '@/assets/hero-dashboard.jpg';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-8 sm:py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            {/* Logo and Badge */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-gradient-primary">
                  Moni
                </h1>
              </div>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                🚀 Ahora en Beta - Primer mes gratis
              </Badge>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                Tu Coach Financiero Personal con
                <span className="text-gradient-primary"> IA y WhatsApp</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Ahorra más dinero jugando. Cumple tus metas financieras mientras subes de nivel como en Duolingo.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary text-primary-foreground hover:scale-105 transition-all glow-primary px-8 py-4 text-lg font-semibold"
                onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")}
              >
                <Zap className="w-5 h-5 mr-2" />
                {isLoggedIn ? "Ir al Dashboard" : "Comenzar Gratis"}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg border-card-border hover:border-primary/50"
                onClick={() => navigate("/chat")}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ver Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col items-center space-y-2 pt-8">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-sm">Impacto social: 847 estudiantes con acceso gratuito</span>
              </div>
              <p className="text-xs text-muted-foreground">Por cada suscripción pagada, donamos una a un estudiante</p>
            </div>
          </div>
        </div>

        {/* Floating Cards Animation */}
        <div className="absolute top-20 left-10 hidden lg:block">
          <Card className="p-4 bg-gradient-card card-glow hover-lift">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Meta cumplida</p>
                <p className="text-xs text-muted-foreground">+150 XP</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="absolute top-32 right-10 hidden lg:block">
          <Card className="p-4 bg-gradient-card card-glow hover-lift">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Ahorro del día</p>
                <p className="text-xs text-muted-foreground">$340 MXN</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 hidden xl:block">
          <div className="relative">
            <img 
              src={heroImage} 
              alt="Moni Dashboard Preview" 
              className="w-[800px] h-auto rounded-2xl shadow-elegant border border-card-border/30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent rounded-2xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-8 sm:py-12 bg-background/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              ¿Por qué Moni es diferente?
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Convertimos el ahorro en un juego adictivo con recompensas reales
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="p-8 bg-gradient-card card-glow hover-lift">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground">Coach en WhatsApp</h4>
                <p className="text-muted-foreground">
                  Recibe tips personalizados y motivación directamente en WhatsApp, como tu entrenador personal financiero.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-card card-glow hover-lift">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground">Gamificación Real</h4>
                <p className="text-muted-foreground">
                  Gana XP, sube de nivel, desbloquea badges y compite con amigos. Ahorrar nunca fue tan divertido.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-card card-glow hover-lift">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground">Metas Inteligentes</h4>
                <p className="text-muted-foreground">
                  IA que analiza tus patrones de gasto y crea planes personalizados para cumplir tus sueños.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-card card-glow hover-lift">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground">Metas Grupales</h4>
                <p className="text-muted-foreground">
                  Planea viajes o proyectos con amigos. Todos aportan, todos ven el progreso en tiempo real.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-card card-glow hover-lift">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground">Seguro y Privado</h4>
                <p className="text-muted-foreground">
                  Tecnología bancaria de nivel mundial. Tus datos están seguros y nunca los compartimos.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-card card-glow hover-lift">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground">Impacto Social</h4>
                <p className="text-muted-foreground">
                  Tu suscripción dona acceso gratuito a estudiantes. Mejora tu futuro y el de otros.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-8 sm:py-12">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="p-12 bg-gradient-card card-glow">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                  ¿Listo para transformar tu dinero en diversión?
                </h3>
                <p className="text-xl text-muted-foreground">
                  Únete a miles de personas que ya están ahorrando más jugando con Moni
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary text-primary-foreground hover:scale-105 transition-all glow-primary px-8 py-4 text-lg font-semibold"
                  onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {isLoggedIn ? "Ir al Dashboard" : "Empezar Ahora Gratis"}
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                <span>✓ Primer mes gratuito</span>
                <span>✓ Sin compromiso</span>
                <span>✓ Cancela cuando quieras</span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
