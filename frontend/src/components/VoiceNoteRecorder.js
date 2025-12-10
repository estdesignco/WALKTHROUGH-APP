import React, { useState, useRef, useEffect } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * VoiceNoteRecorder - A component for recording voice notes on mobile/desktop
 * Features:
 * - Record audio from microphone
 * - Playback recorded audio
 * - Save to server
 * - View existing voice notes
 */
export default function VoiceNoteRecorder({ 
  projectId, 
  roomId = null, 
  itemId = null,
  onNoteSaved = null,
  compact = false 
}) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingNoteId, setPlayingNoteId] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Load existing voice notes
  useEffect(() => {
    loadVoiceNotes();
  }, [projectId, roomId, itemId]);

  const loadVoiceNotes = async () => {
    try {
      let url = `${API_URL}/voice-notes/project/${projectId}`;
      if (itemId) {
        url = `${API_URL}/voice-notes/item/${itemId}`;
      } else if (roomId) {
        url = `${API_URL}/voice-notes/room/${roomId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVoiceNotes(data.voice_notes || []);
      }
    } catch (error) {
      console.error('Failed to load voice notes:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setRecording(true);
      setDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const saveVoiceNote = async () => {
    if (!audioBlob) return;
    
    setLoading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        
        const response = await fetch(`${API_URL}/voice-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            room_id: roomId,
            item_id: itemId,
            audio_data: base64Audio,
            duration: duration,
            file_name: `voice_note_${Date.now()}.webm`
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setVoiceNotes(prev => [data.voice_note, ...prev]);
          setAudioBlob(null);
          setAudioUrl(null);
          setDuration(0);
          
          if (onNoteSaved) {
            onNoteSaved(data.voice_note);
          }
        } else {
          alert('Failed to save voice note');
        }
        
        setLoading(false);
      };
    } catch (error) {
      console.error('Failed to save voice note:', error);
      alert('Failed to save voice note');
      setLoading(false);
    }
  };

  const deleteVoiceNote = async (noteId) => {
    if (!window.confirm('Delete this voice note?')) return;
    
    try {
      const response = await fetch(`${API_URL}/voice-notes/${noteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setVoiceNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch (error) {
      console.error('Failed to delete voice note:', error);
    }
  };

  const playVoiceNote = (note) => {
    if (playingNoteId === note.id) {
      // Stop playing
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingNoteId(null);
    } else {
      // Play this note
      const audio = new Audio(note.audio_data);
      audioPlayerRef.current = audio;
      
      audio.onended = () => setPlayingNoteId(null);
      audio.play();
      setPlayingNoteId(note.id);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    // Compact mode - just a microphone button
    return (
      <div className="flex items-center gap-2">
        {recording ? (
          <button
            onClick={stopRecording}
            className="w-8 h-8 rounded-full bg-red-600 animate-pulse flex items-center justify-center text-white"
          >
            ⏹
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="w-8 h-8 rounded-full bg-[#D4A574] hover:bg-[#B49B7E] flex items-center justify-center text-white"
            title="Record voice note"
          >
            🎤
          </button>
        )}
        
        {voiceNotes.length > 0 && (
          <span className="text-xs text-gray-400">{voiceNotes.length} notes</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#D4A574]/30 overflow-hidden"
         style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,30,40,0.9) 100%)' }}>
      
      {/* Header */}
      <div 
        className="px-4 py-3 cursor-pointer flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}
        onClick={() => setShowNotes(!showNotes)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎤</span>
          <span className="text-[#D4A574] font-semibold text-sm">
            VOICE NOTES ({voiceNotes.length})
          </span>
        </div>
        <span className="text-[#B49B7E]">{showNotes ? '▼' : '▶'}</span>
      </div>
      
      {/* Recording Controls */}
      <div className="p-4 border-b border-[#B49B7E]/20">
        <div className="flex items-center justify-center gap-4">
          {!recording && !audioUrl && (
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D4A574] to-[#B49B7E] hover:from-[#B49B7E] hover:to-[#D4A574] flex items-center justify-center text-white text-2xl shadow-lg transition-all"
            >
              🎤
            </button>
          )}
          
          {recording && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                <span className="text-red-400 font-mono">{formatDuration(duration)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-2xl shadow-lg transition-all"
              >
                ⏹
              </button>
            </div>
          )}
          
          {audioUrl && !recording && (
            <div className="flex items-center gap-4 w-full">
              <audio src={audioUrl} controls className="flex-1 h-10" />
              <span className="text-gray-400 font-mono text-sm">{formatDuration(duration)}</span>
              <button
                onClick={saveVoiceNote}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
              >
                {loading ? '💾...' : '💾 Save'}
              </button>
              <button
                onClick={() => { setAudioUrl(null); setAudioBlob(null); setDuration(0); }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-all"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        
        {!recording && !audioUrl && (
          <p className="text-center text-gray-500 text-sm mt-2">
            Tap to start recording a voice note
          </p>
        )}
      </div>
      
      {/* Voice Notes List */}
      {showNotes && voiceNotes.length > 0 && (
        <div className="p-4 max-h-64 overflow-y-auto">
          {voiceNotes.map((note) => (
            <div 
              key={note.id} 
              className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-black/30 border border-[#B49B7E]/20"
            >
              <button
                onClick={() => playVoiceNote(note)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${
                  playingNoteId === note.id 
                    ? 'bg-green-600 animate-pulse' 
                    : 'bg-[#D4A574] hover:bg-[#B49B7E]'
                }`}
              >
                {playingNoteId === note.id ? '⏸' : '▶'}
              </button>
              
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {note.file_name || 'Voice Note'}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatDuration(Math.round(note.duration || 0))} • {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <button
                onClick={() => deleteVoiceNote(note.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
      
      {showNotes && voiceNotes.length === 0 && (
        <p className="p-4 text-center text-gray-500 text-sm">
          No voice notes yet. Record one above!
        </p>
      )}
    </div>
  );
}
