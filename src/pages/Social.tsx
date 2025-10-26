import BottomNav from "@/components/BottomNav";

const Social = () => {
  return (
    <>
      <div className="min-h-screen animated-wave-bg pb-20">
        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
              Social
            </h1>
            <p className="text-sm text-gray-500">
              Encuentra tus amigos y disfruta de tus finanzas
            </p>
          </div>
          {/* Empty content area for future development */}
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default Social;
