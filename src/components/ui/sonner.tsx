import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-b group-[.toaster]:from-sky-50/95 group-[.toaster]:to-white/95 group-[.toaster]:text-gray-900 group-[.toaster]:border-blue-100 group-[.toaster]:shadow-xl group-[.toaster]:rounded-3xl group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-gray-600",
          actionButton: "group-[.toast]:bg-gradient-to-b group-[.toast]:from-gray-700 group-[.toast]:to-gray-900 group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:hover:brightness-105",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:rounded-xl group-[.toast]:hover:bg-gray-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
