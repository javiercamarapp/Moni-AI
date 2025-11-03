import { MoniLoader } from "./MoniLoader";

export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden relative bg-background">
      <MoniLoader size="xl" />
    </div>
  );
}