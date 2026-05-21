import { useState } from "react";
import CalendarHeader from "./components/CalendarHeader";
import YearView from "./components/YearView";
import MonthView from "./components/MonthView";
import EventPopup from "./components/EventPopup";
import { VIEW_MODES } from "./constants";
import { mockEvents } from "./data/mockEvents";

function CalendarPage() {
  const [year, setYear] = useState(2022);
  const [viewMode, setViewMode] = useState(VIEW_MODES.YEAR);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popupAnchor, setPopupAnchor] = useState(null);
  const [monthIndex, setMonthIndex] = useState(11);

  const handleEventClick = (event, anchor) => {
    setSelectedEvent(event);
    setPopupAnchor(anchor);
  };

  const handleClosePopup = () => {
    setSelectedEvent(null);
    setPopupAnchor(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <CalendarHeader
        year={year}
        month={monthIndex}
        viewMode={viewMode}
        onYearChange={setYear}
        onMonthChange={setMonthIndex}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 min-h-0 relative">
        {viewMode === VIEW_MODES.YEAR ? (
          <YearView
            baseYear={year}
            events={mockEvents}
            onEventClick={handleEventClick}
          />
        ) : (
          <MonthView
            year={year}
            month={monthIndex}
            events={mockEvents}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <EventPopup
        event={selectedEvent}
        anchor={popupAnchor}
        onClose={handleClosePopup}
      />
    </div>
  );
}

export default CalendarPage;
