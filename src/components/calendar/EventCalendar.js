import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Plus, Search, ChevronLeft, ChevronRight, Repeat, AlertCircle, List } from 'lucide-react';
import EventForm from './EventForm';
import AllEventsView from './AllEventsView';

const EventCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [showMoreEvents, setShowMoreEvents] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [showAllEvents, setShowAllEvents] = useState(false);
  
  const draggedElementRef = useRef(null);

  // Event colors for categories
  const eventColors = [
    { name: 'Blue', value: 'bg-blue-500', border: 'border-blue-500' },
    { name: 'Green', value: 'bg-green-500', border: 'border-green-500' },
    { name: 'Red', value: 'bg-red-500', border: 'border-red-500' },
    { name: 'Purple', value: 'bg-purple-500', border: 'border-purple-500' },
    { name: 'Orange', value: 'bg-orange-500', border: 'border-orange-500' },
    { name: 'Pink', value: 'bg-pink-500', border: 'border-pink-500' }
  ];

  // Generate recurring events
  const generateRecurringEvents = useCallback((event) => {
    const recurringEvents = [];
    if (!event.isRecurring) return [event];

    const startDate = new Date(event.date);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Generate for next year

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (currentDate.getTime() !== startDate.getTime()) {
        recurringEvents.push({
          ...event,
          id: `${event.id}_${currentDate.getTime()}`,
          date: currentDate.toISOString().split('T')[0],
          isRecurringInstance: true,
          originalId: event.id
        });
      }

      switch (event.recurrence.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'custom':
          currentDate.setDate(currentDate.getDate() + (event.recurrence.interval || 1));
          break;
        default:
          return recurringEvents;
      }
    }

    return [event, ...recurringEvents];
  }, []);

  // Get all events including recurring instances
  const getAllEvents = useCallback(() => {
    const allEvents = [];
    events.forEach(event => {
      if (event.isRecurring && !event.isRecurringInstance) {
        allEvents.push(...generateRecurringEvents(event));
      } else if (!event.isRecurringInstance) {
        allEvents.push(event);
      }
    });
    return allEvents;
  }, [events, generateRecurringEvents]);

  // Check for event conflicts
  const checkConflicts = useCallback(() => {
    const allEvents = getAllEvents();
    const conflictingEvents = [];

    for (let i = 0; i < allEvents.length; i++) {
      for (let j = i + 1; j < allEvents.length; j++) {
        const event1 = allEvents[i];
        const event2 = allEvents[j];

        if (event1.date === event2.date && event1.time === event2.time) {
          conflictingEvents.push(event1.id, event2.id);
        }
      }
    }

    setConflicts([...new Set(conflictingEvents)]);
  }, [getAllEvents]);

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    checkConflicts();
  }, [events, checkConflicts]);

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return [];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return getAllEvents().filter(event => {
      return event.date === dateString;
    }).filter(event => {
      if (searchTerm) {
        return event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               event.description.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });
  };

  // Handle date click
  const handleDateClick = (date, e) => {
    if (e.target.closest('.event-item') || e.target.closest('.more-events')) {
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);
    setSelectedDate(formattedDate);
    setEditingEvent(null);
    setShowEventForm(true);
    setFormErrors({});
  };

  // Handle event click
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setEditingEvent(event);
    const [year, month, day] = event.date.split('-');
    const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);
    setSelectedDate(formattedDate);
    setShowEventForm(true);
    setFormErrors({});
  };

  // Handle form submit
  const handleFormSubmit = (eventData) => {
    const errors = {};
    if (!eventData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!eventData.date) {
      errors.date = 'Date is required';
    }
    if (!eventData.time) {
      errors.time = 'Time is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Ensure the date is in YYYY-MM-DD format without timezone conversion
    const [year, month, day] = eventData.date.split('-');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const updatedEventData = {
      ...eventData,
      date: formattedDate
    };

    if (editingEvent) {
      if (editingEvent.isRecurringInstance) {
        setEvents(prev => prev.map(e => 
          e.id === editingEvent.id ? { ...updatedEventData, id: editingEvent.id } : e
        ));
      } else {
        setEvents(prev => prev.map(e => 
          e.id === editingEvent.id ? { ...updatedEventData, id: editingEvent.id } : e
        ));
      }
    } else {
      const newEvent = {
        ...updatedEventData,
        id: Date.now().toString()
      };
      setEvents(prev => [...prev, newEvent]);
    }
    setShowEventForm(false);
    setEditingEvent(null);
    setFormErrors({});
  };

  // Handle event deletion
  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(prev => prev.filter(e => e.id !== eventId && e.originalId !== eventId));
      setShowEventForm(false);
      setEditingEvent(null);
    }
  };

  // Toggle more events dropdown
  const toggleMoreEvents = (dateString, e) => {
    e.stopPropagation();
    setShowMoreEvents(prev => ({
      ...prev,
      [dateString]: !prev[dateString]
    }));
  };

  const handleDragStart = (event, e) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    draggedElementRef.current = e.target;
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedEvent(null);
  };

  const handleDrop = (date, e) => {
    e.preventDefault();
    if (draggedEvent && date) {
      const newDate = date.toISOString().split('T')[0];
      setEvents(prev => prev.map(event => 
        event.id === draggedEvent.id 
          ? { ...event, date: newDate }
          : event
      ));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle event click from all events view
  const handleAllEventsClick = (event) => {
    setEditingEvent(event);
    setSelectedDate(new Date(event.date + 'T00:00:00'));
    setShowEventForm(true);
    setShowAllEvents(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 bg-white min-h-screen">
      <div className="mb-4 sm:mb-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            Schedulr
          </h1>
          <div className="w-full sm:w-auto flex items-center gap-4">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowAllEvents(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">View All Schedules</span>
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 min-w-[150px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setEditingEvent(null);
              setShowEventForm(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-2 sm:p-4 text-center">
              <span className="hidden sm:block font-semibold text-gray-700">{day}</span>
              <span className="sm:hidden font-semibold text-gray-700">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            const dateString = date ? date.toISOString().split('T')[0] : '';
            const dayEvents = date ? getEventsForDate(date) : [];
            const visibleEvents = dayEvents.slice(0, 2);
            const hiddenEvents = dayEvents.slice(2);
            const isToday = date && date.toDateString() === today.toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[100px] sm:min-h-[120px] border-r border-b p-1 sm:p-2 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                  isToday ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={(e) => date && handleDateClick(date, e)}
                onDrop={(e) => handleDrop(date, e)}
                onDragOver={handleDragOver}
              >
                {date && (
                  <>
                    <div className={`text-sm sm:text-base font-medium mb-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {visibleEvents.map(event => (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={(e) => handleDragStart(event, e)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`event-item text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                            event.color || 'bg-blue-500'
                          } text-white truncate group relative ${
                            conflicts.includes(event.id) ? 'ring-2 ring-red-400' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {event.isRecurring && <Repeat className="w-3 h-3 flex-shrink-0" />}
                            {conflicts.includes(event.id) && <AlertCircle className="w-3 h-3 flex-shrink-0" />}
                            <span className="truncate">{event.title}</span>
                          </div>
                          {/* Tooltip */}
                          <div className="absolute hidden group-hover:block z-20 bottom-full left-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg">
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-gray-300">{event.time}</p>
                            {event.description && (
                              <p className="mt-1 text-gray-300 truncate">{event.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {hiddenEvents.length > 0 && (
                        <div className="relative">
                          <button
                            className="more-events w-full text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                            onClick={(e) => toggleMoreEvents(dateString, e)}
                          >
                            <span>+{hiddenEvents.length} more</span>
                          </button>
                          {showMoreEvents[dateString] && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1">
                              {hiddenEvents.map(event => (
                                <div
                                  key={event.id}
                                  onClick={(e) => handleEventClick(event, e)}
                                  className={`text-xs sm:text-sm px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                                    event.color || 'bg-blue-500'
                                  } text-white truncate group relative ${
                                    conflicts.includes(event.id) ? 'ring-2 ring-red-400' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    {event.isRecurring && <Repeat className="w-3 h-3 flex-shrink-0" />}
                                    {conflicts.includes(event.id) && <AlertCircle className="w-3 h-3 flex-shrink-0" />}
                                    <span className="truncate">{event.title}</span>
                                  </div>
                                  {/* Tooltip */}
                                  <div className="absolute hidden group-hover:block z-20 bottom-full left-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg">
                                    <p className="font-semibold">{event.title}</p>
                                    <p className="text-gray-300">{event.time}</p>
                                    {event.description && (
                                      <p className="mt-1 text-gray-300 truncate">{event.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          event={editingEvent}
          selectedDate={selectedDate}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
            setFormErrors({});
          }}
          onDelete={handleDeleteEvent}
          eventColors={eventColors}
          formErrors={formErrors}
        />
      )}

      {/* All Events View */}
      {showAllEvents && (
        <AllEventsView
          events={getAllEvents()}
          onClose={() => setShowAllEvents(false)}
          onEventClick={handleAllEventsClick}
          conflicts={conflicts}
        />
      )}
    </div>
  );
};

export default EventCalendar; 