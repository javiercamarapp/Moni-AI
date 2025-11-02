import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";

const Groups = () => {
  const navigate = useNavigate();

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
                Grupos
              </h1>
              <p className="text-xs text-gray-600">
                Crea o únete a grupos financieros
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4" style={{ maxWidth: '600px' }}>
        <div className="text-center py-16 space-y-3">
          <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Users className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Próximamente
          </h2>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            Aquí podrás crear grupos y compartir objetivos financieros
          </p>
        </div>
      </div>
    </div>
  );
};

export default Groups;
