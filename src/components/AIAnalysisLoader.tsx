import { MoniLoader } from "./MoniLoader";

interface AIAnalysisLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function AIAnalysisLoader({ message = "Analizando...", fullScreen = false }: AIAnalysisLoaderProps) {
  return <MoniLoader size="xl" fullScreen={fullScreen} message={message} />;
}
