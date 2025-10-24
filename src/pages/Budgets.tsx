import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Budgets() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkBudgets();
  }, []);

  const checkBudgets = async () => {
    try {
      // Verificar autenticación
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      // Verificar si el usuario tiene presupuestos configurados
      const { data: budgets, error } = await supabase
        .from('category_budgets')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;

      // Si no tiene presupuestos, ir al quiz
      if (!budgets || budgets.length === 0) {
        navigate('/budget-quiz');
      } else {
        // Si tiene presupuestos, ir a gestión de categorías
        navigate('/gestionar-categorias');
      }
    } catch (error) {
      console.error('Error checking budgets:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return null;
}
