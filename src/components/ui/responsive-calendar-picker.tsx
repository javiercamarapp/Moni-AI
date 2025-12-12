import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveCalendarPickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
}

export function ResponsiveCalendarPicker({
  date,
  onSelect,
  placeholder = "Seleccionar fecha",
  className,
  buttonClassName,
  iconClassName = "text-[#5D4037]",
}: ResponsiveCalendarPickerProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate);
    setOpen(false);
  };

  const TriggerButton = (
    <Button
      variant="outline"
      className={cn(
        "h-11 text-sm justify-start text-left font-normal bg-white border-0 rounded-xl hover:bg-[#A1887F]/10",
        !date && "text-muted-foreground",
        buttonClassName
      )}
    >
      <CalendarIcon className={cn("mr-2 h-4 w-4", iconClassName)} />
      {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className={className}>
          {TriggerButton}
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-white rounded-t-3xl h-auto pb-8">
          <SheetHeader className="border-b border-[#A1887F]/20 pb-3">
            <SheetTitle className="text-[#3E2723] font-semibold">Seleccionar fecha</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center pt-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className={className}>
        {TriggerButton}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
