import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto bg-white rounded-xl shadow-lg", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-[#3E2723]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-white border-[#A1887F]/30 p-0 hover:bg-[#A1887F]/10 hover:border-[#5D4037]/30 text-[#5D4037]",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-[#8D6E63] rounded-md w-9 font-medium text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-[#A1887F]/20 [&:has([aria-selected])]:bg-[#A1887F]/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal text-[#3E2723] hover:bg-[#A1887F]/10 aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#5D4037] text-white hover:bg-[#4E342E] hover:text-white focus:bg-[#5D4037] focus:text-white rounded-lg",
        day_today: "bg-[#A1887F]/20 text-[#5D4037] font-semibold",
        day_outside:
          "day-outside text-[#A1887F]/50 opacity-50 aria-selected:bg-[#A1887F]/20 aria-selected:text-[#8D6E63] aria-selected:opacity-30",
        day_disabled: "text-[#A1887F]/40 opacity-50",
        day_range_middle: "aria-selected:bg-[#A1887F]/20 aria-selected:text-[#5D4037]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
