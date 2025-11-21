import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SavingSimulation = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                  Simulación de ahorro por día
                </h1>
                <p className="text-xs text-gray-600">
                  Proyecta tu ahorro diario con inteligencia artificial
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 py-6 space-y-4" style={{ maxWidth: '600px' }}>
          {/* Empty content area for future development */}
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default SavingSimulation;
