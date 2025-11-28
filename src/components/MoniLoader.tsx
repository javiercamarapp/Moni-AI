import { LoadingScreen } from "@/components/LoadingScreen";

interface MoniLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  message?: string;
}

/**
 * @deprecated Use LoadingScreen instead for full-page loading states.
 * This component now delegates to the unified LoadingScreen.
 */
export function MoniLoader(_props: MoniLoaderProps) {
  // Delegate to the unified LoadingScreen for consistency
  return <LoadingScreen />;
}
