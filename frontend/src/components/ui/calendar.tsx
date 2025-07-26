import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday
} from "date-fns"

export interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  disabled?: (date: Date) => boolean
  fromDate?: Date
  toDate?: Date
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
  disabled,
  fromDate,
  toDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected || new Date()
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const days = []
  let day = startDate

  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const handleDayClick = (clickedDay: Date) => {
    if (disabled?.(clickedDay)) return
    
    if (mode === "single") {
      if (selected && isSameDay(selected, clickedDay)) {
        onSelect?.(undefined)
      } else {
        onSelect?.(clickedDay)
      }
    }
  }

  const isDisabled = (day: Date) => {
    if (disabled?.(day)) return true
    if (fromDate && day < fromDate) return true
    if (toDate && day > toDate) return true
    return false
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((dayName) => (
            <div
              key={dayName}
              className="text-xs text-center text-muted-foreground font-medium p-1"
            >
              {dayName}
            </div>
          ))}

          {/* Days */}
          {days.map((day, idx) => {
            const isSelected = selected && isSameDay(selected, day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isTodayDate = isToday(day)
            const isDisabledDay = isDisabled(day)

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(day)}
                disabled={isDisabledDay}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm p-1 h-8 w-8",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isCurrentMonth ? "" : "text-muted-foreground opacity-50",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isTodayDate && !isSelected && "bg-accent text-accent-foreground",
                  isDisabledDay && "cursor-not-allowed opacity-50 hover:bg-transparent"
                )}
                aria-label={format(day, "PPPP")}
                aria-selected={isSelected}
                aria-disabled={isDisabledDay}
              >
                {format(day, "d")}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}