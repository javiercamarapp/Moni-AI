import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Newspaper, Link as LinkIcon, Plus, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CircleNews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addNewsOpen, setAddNewsOpen] = useState(false);
  const [newsUrl, setNewsUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setCurrentUser(user);

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

      // Fetch circle news with user profile data
      const { data: newsData, error: newsError } = await supabase
        .from('circle_news')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNews = async () => {
    if (!newsUrl.trim()) {
      toast.error('Por favor, ingresa una URL válida');
      return;
    }

    // Basic URL validation
    try {
      new URL(newsUrl);
    } catch {
      toast.error('La URL no es válida');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-news-metadata', {
        body: { url: newsUrl, circleId: id }
      });

      if (error) {
        console.error('Error submitting news:', error);
        toast.error(error.message || 'Error al procesar la noticia');
        return;
      }

      toast.success('¡Noticia compartida exitosamente!');
      setNewsUrl("");
      setAddNewsOpen(false);
      fetchData(); // Reload news
    } catch (error: any) {
      console.error('Error submitting news:', error);
      toast.error('Error al compartir la noticia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      const { error } = await supabase
        .from('circle_news')
        .delete()
        .eq('id', newsId);

      if (error) throw error;

      toast.success('Noticia eliminada');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting news:', error);
      toast.error('Error al eliminar la noticia');
    }
  };

  if (loading) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/circle/${id}`)}
                className="p-1.5 hover:bg-white/50 rounded-full transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-gray-900" />
              </button>
              <div>
                <h1 className="text-base font-semibold text-gray-900 tracking-tight">
                  Noticias: {circle?.name}
                </h1>
                <p className="text-[10px] text-gray-600">
                  Noticias recomendadas por la comunidad
                </p>
              </div>
            </div>
            
            <Dialog open={addNewsOpen} onOpenChange={setAddNewsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="white" className="gap-2 hover-lift">
                  <Plus className="h-4 w-4" />
                  Compartir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compartir noticia</DialogTitle>
                  <DialogDescription>
                    Pega el enlace de una noticia financiera importante y la IA extraerá automáticamente la información
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="news-url">URL de la noticia</Label>
                    <Input
                      id="news-url"
                      placeholder="https://ejemplo.com/noticia"
                      value={newsUrl}
                      onChange={(e) => setNewsUrl(e.target.value)}
                      disabled={submitting}
                      className="bg-gray-100/80"
                    />
                  </div>
                  <Button 
                    onClick={handleSubmitNews} 
                    disabled={submitting || !newsUrl.trim()}
                    variant="white"
                    className="w-full hover-lift"
                  >
                    {submitting ? (
                      <>
                        <MoniLoader size="sm" />
                        Extrayendo información...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Compartir
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-2" style={{ maxWidth: '800px' }}>
        {news.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="text-center py-16">
              <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-base mb-2 font-medium">No hay noticias aún</p>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                Sé el primero en compartir una noticia financiera importante con tu círculo
              </p>
              <Button onClick={() => setAddNewsOpen(true)} variant="white" className="gap-2 hover-lift">
                <Plus className="h-4 w-4" />
                Compartir primera noticia
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md transition-all">
                <div className="flex gap-4 p-4">
                  {item.image_url && (
                    <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Recomendado por</span>
                        <span className="font-medium text-gray-700">
                          {item.profiles?.full_name || item.profiles?.username || 'Usuario'}
                        </span>
                        {item.published_at && (
                          <>
                            <span>•</span>
                            <span>{new Date(item.published_at).toLocaleDateString('es-MX')}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {currentUser?.id === item.user_id && (
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Eliminar noticia"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-sm text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Ver</span>
                        </a>
                      </div>
                    </div>
                  </div>
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
