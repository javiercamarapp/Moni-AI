import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";

const CircleNews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }

      // Fetch circle details
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (circleError || !circleData) {
        toast.error('Error al cargar el círculo');
        navigate('/social');
        return;
      }
      setCircle(circleData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    }
  };

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MoniLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/circle/${id}`)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Noticias: {circle.name}
              </h1>
              <p className="text-xs text-gray-600">
                Noticias financieras y recomendaciones
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-2" style={{ maxWidth: '600px' }}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="text-center py-16">
            <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-base mb-2 font-medium">Próximamente</p>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Noticias financieras y recomendaciones personalizadas para el círculo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleNews;
