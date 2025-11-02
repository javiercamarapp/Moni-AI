import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AddFriend = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Ingresa un nombre de usuario");
      return;
    }
    toast.info("Búsqueda próximamente disponible");
  };

  return (
    <div className="min-h-screen pb-6 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Agregar Amigo
              </h1>
              <p className="text-xs text-gray-600">
                Busca usuarios por nombre de usuario
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Search Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por @usuario"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="w-full bg-white hover:bg-white/90 text-foreground shadow-md rounded-2xl font-medium"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Buscar Usuario
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-16 space-y-3">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Encuentra a tus amigos
          </h2>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            Busca por nombre de usuario para conectar con otros usuarios
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;
