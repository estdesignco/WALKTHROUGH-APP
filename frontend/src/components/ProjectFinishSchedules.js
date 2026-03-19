import React, { useState, useEffect } from 'react';
import { Ruler, ChevronRight, Home, Layers } from 'lucide-react';
import RoomFinishSchedule from './RoomFinishSchedule';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const ProjectFinishSchedules = ({ projectId }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [scheduleCounts, setScheduleCounts] = useState({});

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}`);
        const project = await res.json();
        const projectRooms = project.rooms || [];
        setRooms(projectRooms);

        // Fetch schedule counts per room
        const counts = {};
        await Promise.all(
          projectRooms.map(async (room) => {
            try {
              const schedRes = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${room.id}/finish-schedules`);
              const schedules = await schedRes.json();
              counts[room.id] = Array.isArray(schedules) ? schedules.length : 0;
            } catch { counts[room.id] = 0; }
          })
        );
        setScheduleCounts(counts);
      } catch (err) { console.error('Failed to fetch rooms:', err); }
      finally { setLoading(false); }
    };
    if (projectId) fetchRooms();
  }, [projectId]);

  if (loading) {
    return (
      <div className="text-center py-12 text-[#D4C5A9]/60">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-[#D4A574] border-t-transparent rounded-full mb-2" />
        <div>Loading rooms...</div>
      </div>
    );
  }

  // If a room is selected, show its finish schedule
  if (selectedRoom) {
    return (
      <div>
        <button
          onClick={() => setSelectedRoom(null)}
          className="mb-4 px-4 py-2 rounded-lg text-sm text-[#D4C5A9] hover:text-white border border-[#B49B7E]/30 hover:border-[#B49B7E]/60 transition-all flex items-center gap-2"
          data-testid="back-to-rooms-btn"
        >
          <ChevronRight size={14} className="rotate-180" /> All Rooms
        </button>
        <RoomFinishSchedule
          projectId={projectId}
          roomId={selectedRoom.id}
          roomName={selectedRoom.name}
          onClose={() => setSelectedRoom(null)}
        />
      </div>
    );
  }

  return (
    <div data-testid="project-finish-schedules">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers size={20} className="text-[#D4A574]" />
          Room Finish Schedules
        </h2>
        <p className="text-sm text-[#B49B7E]/60 mt-1">
          Select a room to manage tile, paint, wallpaper, and material schedules with measurements
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-[#B49B7E]/20" style={{ background: 'rgba(15,15,25,0.5)' }}>
          <Home size={32} className="mx-auto mb-3 text-[#B49B7E]/30" />
          <div className="text-[#D4C5A9]/40 text-lg mb-1">No rooms found</div>
          <div className="text-[#B49B7E]/40 text-sm">Add rooms to the project first via the Walkthrough tab</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map(room => {
            const count = scheduleCounts[room.id] || 0;
            return (
              <button
                key={room.id}
                data-testid={`room-card-${room.id}`}
                onClick={() => setSelectedRoom(room)}
                className="text-left p-4 rounded-xl border border-[#B49B7E]/20 hover:border-[#D4A574]/50 transition-all group"
                style={{ background: 'rgba(15,15,25,0.6)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-white font-bold text-sm group-hover:text-[#D4A574] transition-colors">
                      {room.name}
                    </div>
                    <div className="text-[#B49B7E]/50 text-xs mt-1">
                      {count > 0 ? `${count} schedule${count !== 1 ? 's' : ''}` : 'No schedules yet'}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#B49B7E]/30 group-hover:text-[#D4A574] transition-colors mt-1" />
                </div>
                {count > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Ruler size={10} className="text-[#D4A574]/60" />
                    <div className="h-1 flex-1 rounded-full bg-[#B49B7E]/10">
                      <div className="h-1 rounded-full bg-[#D4A574]/40" style={{ width: `${Math.min(count * 25, 100)}%` }} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectFinishSchedules;
