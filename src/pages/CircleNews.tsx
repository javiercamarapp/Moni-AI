import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Newspaper, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CircleNews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);

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

      // Fetch circle news
      const { data: newsData, error: newsError } = await supabase
        .from('circle_news' as any)
        .select('*, profiles(username, avatar_url)')
        .eq('circle_id', id)
        .order('created_at', { ascending: false });

      if (newsError) {
        console.error('Error fetching news:', newsError);
      } else {
        setNews(newsData || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    }
  };

  if (!circle) {
    return (
      <div className="page-standard min-h-screen flex items-center justify-center">
        <MoniLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="page-standard min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f5f0ee]/80 to-transparent backdrop-blur-sm">
        <div className="page-container py-4">
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

      <div className="page-container py-2">
        {news.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="text-center py-16">
              <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-base mb-2 font-medium">No hay noticias</p>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Aún no se han agregado noticias a este círculo
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(item.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    {item.profiles?.username && (
                      <span>Por {item.profiles.username}</span>
                    )}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Leer más
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CircleNews;
