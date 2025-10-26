import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountsCards() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen animated-wave-bg p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-12 w-12"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Cuentas y Tarjetas</h1>
            <p className="text-sm text-gray-600">Gestiona tus medios de pago</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Empty content area for future development */}
        </div>
      </div>
    </div>
  );
}
