import BottomNav from "@/components/BottomNav";

const Goals = () => {
  return (
    <>
      <div className="min-h-screen pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Metas
              </h1>
              <p className="text-xs text-gray-600">
                Alcanza tus sueños y objetivos financieros
              </p>
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

export default Goals;
