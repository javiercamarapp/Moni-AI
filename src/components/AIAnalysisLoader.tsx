import { LoadingScreen } from "@/components/LoadingScreen";

interface AIAnalysisLoaderProps {
  /** Optional message for future extension; currently unused */
  message?: string;
}

// Reuse the unified LoadingScreen so analysis uses the same loader style
export function AIAnalysisLoader(_props: AIAnalysisLoaderProps) {
  return <LoadingScreen />;
}
