import React, { useState } from 'react';
import { X, Clock, Repeat, AlertCircle, Search } from 'lucide-react';

const AllEventsView = ({ events, onClose, onEventClick, conflicts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'title'

  // Get all months from events
  const months = [...new Set(events.map(event => {
    const [year, month] = event.date.split('-');
    return `${year}-${month}`;
  }))].sort();

  // Filter and sort events
  const filteredEvents = events.filter(event => {
    const matchesSearch = (
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesMonth = selectedMonth === 'all' || event.date.startsWith(selectedMonth);
    
    return matchesSearch && matchesMonth;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = event.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">All Events</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Months</option>
              {months.map(month => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });
                return (
                  <option key={month} value={month}>
                    {monthName} {year}
                  </option>
                );
              })}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => {
            const formattedDate = new Date(date).toLocaleDateString('default', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div key={date} className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 sticky top-0 bg-white py-2">
                  {formattedDate}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`${event.color || 'bg-blue-500'} bg-opacity-10 border-l-4 ${event.color || 'border-blue-500'} 
                        p-3 rounded-lg cursor-pointer hover:bg-opacity-20 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            {event.title}
                            {event.isRecurring && <Repeat className="w-4 h-4 text-gray-500" />}
                            {conflicts.includes(event.id) && (
                              <AlertCircle className="w-4 h-4 text-red-500" title="Time conflict" />
                            )}
                          </h4>
                          <div className="mt-1 text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </div>
                            {event.description && (
                              <p className="text-gray-600 line-clamp-2">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredEvents.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No events found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllEventsView; 