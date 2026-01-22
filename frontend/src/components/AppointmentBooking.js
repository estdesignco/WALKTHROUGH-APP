import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || '';

/**
 * AppointmentBooking Component
 * Shows available time slots from Outlook calendar and allows clients to book
 * 
 * Props:
 * - clientName: Client's name
 * - clientEmail: Client's email
 * - clientPhone: Client's phone (optional)
 * - projectId: Associated project ID (optional)
 * - onBooked: Callback when appointment is booked
 */
export default function AppointmentBooking({ 
  clientName, 
  clientEmail, 
  clientPhone = '',
  projectId = null,
  onBooked = () => {}
}) {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedDetails, setBookedDetails] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  
  // Group slots by date for better display
  const [currentWeekStart, setCurrentWeekStart] = useState(0);
  const DAYS_PER_VIEW = 7;

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/api/booking/available-slots?weeks_ahead=6`);
      if (!response.ok) throw new Error('Failed to fetch available slots');
      const data = await response.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setError('Unable to load available times. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    
    try {
      setBooking(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/api/booking/book-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          start_iso: selectedSlot.start_iso,
          end_iso: selectedSlot.end_iso,
          project_id: projectId,
          notes: notes
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to book appointment');
      }
      
      const result = await response.json();
      setBooked(true);
      setBookedDetails({
        ...selectedSlot,
        appointment_id: result.appointment_id
      });
      onBooked(result);
      
    } catch (err) {
      console.error('Booking failed:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = {
        date: slot.date,
        day_name: slot.day_name,
        slots: []
      };
    }
    acc[slot.date].slots.push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(slotsByDate).sort();
  const visibleDates = sortedDates.slice(currentWeekStart, currentWeekStart + DAYS_PER_VIEW);

  // Success state
  if (booked && bookedDetails) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-[#D4A574]/30 p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        
        <h3 className="text-2xl font-light text-[#D4C5A9] mb-2">Appointment Confirmed!</h3>
        <p className="text-gray-400 mb-6">A calendar invitation has been sent to your email.</p>
        
        <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-[#D4A574]" />
            <span className="text-[#D4C5A9] font-medium">{bookedDetails.display}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#D4A574]" />
            <span className="text-gray-300">{bookedDetails.start_time} - {bookedDetails.end_time} (2 hours)</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          We look forward to meeting with you!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-[#D4A574]/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8b7355] to-[#a0845c] px-6 py-4">
        <h3 className="text-xl font-light text-white tracking-wide flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Book Your Consultation
        </h3>
        <p className="text-sm text-white/80 mt-1">Select a convenient time for your 2-hour design consultation</p>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#D4A574] animate-spin mb-4" />
            <p className="text-gray-400">Loading available times...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchAvailableSlots}
              className="px-4 py-2 bg-[#D4A574] text-[#1a1a1a] rounded-lg hover:bg-[#c49a6a] transition"
            >
              Try Again
            </button>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No available slots at this time.</p>
            <p className="text-sm text-gray-500">Please check back later or contact us directly.</p>
          </div>
        ) : (
          <>
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentWeekStart(Math.max(0, currentWeekStart - DAYS_PER_VIEW))}
                disabled={currentWeekStart === 0}
                className="p-2 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-gray-400 text-sm">
                Showing {visibleDates.length} days with availability
              </span>
              
              <button
                onClick={() => setCurrentWeekStart(Math.min(sortedDates.length - DAYS_PER_VIEW, currentWeekStart + DAYS_PER_VIEW))}
                disabled={currentWeekStart + DAYS_PER_VIEW >= sortedDates.length}
                className="p-2 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {visibleDates.map(date => {
                const dayData = slotsByDate[date];
                const dateObj = new Date(date + 'T12:00:00');
                
                return (
                  <div key={date} className="bg-[#2a2a2a] rounded-lg overflow-hidden">
                    {/* Date Header */}
                    <div className="bg-[#333] px-4 py-3 border-b border-[#444]">
                      <div className="text-[#D4A574] font-medium">{dayData.day_name}</div>
                      <div className="text-gray-400 text-sm">
                        {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    
                    {/* Time Slots */}
                    <div className="p-3 space-y-2">
                      {dayData.slots.map((slot, idx) => {
                        const isSelected = selectedSlot?.start_iso === slot.start_iso;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedSlot(slot)}
                            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-[#D4A574] text-[#1a1a1a] ring-2 ring-[#D4A574] ring-offset-2 ring-offset-[#2a2a2a]'
                                : 'bg-[#3a3a3a] text-gray-300 hover:bg-[#444] hover:text-white'
                            }`}
                          >
                            {slot.start_time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Selected Slot Summary */}
            {selectedSlot && (
              <div className="bg-[#2a2a2a] rounded-lg p-4 mb-6 border border-[#D4A574]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#D4A574] font-medium">Selected Time</p>
                    <p className="text-white">{selectedSlot.display}</p>
                    <p className="text-gray-400 text-sm">{selectedSlot.start_time} - {selectedSlot.end_time}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="text-gray-500 hover:text-white text-sm"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
            
            {/* Notes Input */}
            {selectedSlot && (
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Any notes or questions for us? (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us about your project, preferences, or any questions..."
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A574] resize-none"
                  rows={3}
                />
              </div>
            )}
            
            {/* Book Button */}
            <button
              onClick={handleBook}
              disabled={!selectedSlot || booking}
              className={`w-full py-4 rounded-xl font-medium text-lg transition-all ${
                selectedSlot && !booking
                  ? 'bg-gradient-to-r from-[#8b7355] to-[#a0845c] text-white hover:shadow-lg hover:shadow-[#D4A574]/20'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {booking ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Booking...
                </span>
              ) : selectedSlot ? (
                'Confirm Appointment'
              ) : (
                'Select a Time to Continue'
              )}
            </button>
            
            {/* Info */}
            <p className="text-center text-gray-500 text-sm mt-4">
              You'll receive a calendar invitation and confirmation email at {clientEmail}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
