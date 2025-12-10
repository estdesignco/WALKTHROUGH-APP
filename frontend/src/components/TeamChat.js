import React, { useState, useEffect, useRef } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * TeamChat - Real-time team chat for project collaboration
 * Features:
 * - Phone number based identification
 * - Message history
 * - Unread counts
 * - Optional room-specific chat
 */
export default function TeamChat({ 
  projectId, 
  roomId = null,
  userPhone = null,
  userName = null,
  compact = false,
  onUnreadCountChange = null 
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(!compact);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserPhone, setCurrentUserPhone] = useState(userPhone || '');
  const [currentUserName, setCurrentUserName] = useState(userName || '');
  const [showPhonePrompt, setShowPhonePrompt] = useState(!userPhone);
  
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Load messages and start polling
  useEffect(() => {
    if (projectId && currentUserPhone) {
      loadMessages();
      loadUnreadCount();
      
      // Poll for new messages every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        loadMessages();
        loadUnreadCount();
      }, 5000);
      
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [projectId, roomId, currentUserPhone]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Report unread count changes
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  const loadMessages = async () => {
    try {
      let url = `${API_URL}/chat/messages/${projectId}?limit=100`;
      if (roomId) {
        url += `&room_id=${roomId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark messages as read when chat is open
        if (isOpen && currentUserPhone && data.messages?.length > 0) {
          markMessagesRead(data.messages.map(m => m.id));
        }
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const loadUnreadCount = async () => {
    if (!currentUserPhone) return;
    
    try {
      const response = await fetch(`${API_URL}/chat/unread/${projectId}/${encodeURIComponent(currentUserPhone)}`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const markMessagesRead = async (messageIds) => {
    if (!currentUserPhone || messageIds.length === 0) return;
    
    try {
      await fetch(`${API_URL}/chat/mark-read/${projectId}?phone=${encodeURIComponent(currentUserPhone)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageIds)
      });
    } catch (error) {
      console.error('Failed to mark messages read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserPhone) return;
    
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          room_id: roomId,
          sender_phone: currentUserPhone,
          sender_name: currentUserName || currentUserPhone,
          message: newMessage.trim(),
          message_type: 'text'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (currentUserPhone.trim()) {
      setShowPhonePrompt(false);
      // Store in localStorage for persistence
      localStorage.setItem('chat_user_phone', currentUserPhone);
      localStorage.setItem('chat_user_name', currentUserName);
    }
  };

  // Load stored phone from localStorage
  useEffect(() => {
    const storedPhone = localStorage.getItem('chat_user_phone');
    const storedName = localStorage.getItem('chat_user_name');
    
    if (storedPhone && !userPhone) {
      setCurrentUserPhone(storedPhone);
      setShowPhonePrompt(false);
    }
    if (storedName && !userName) {
      setCurrentUserName(storedName);
    }
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString();
  };

  // Compact mode - just a chat bubble with unread count
  if (compact && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-[#D4A574] to-[#B49B7E] shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform z-50"
      >
        💬
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Phone number prompt
  if (showPhonePrompt) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a2e] rounded-xl p-6 max-w-md w-full border border-[#D4A574]/30">
          <h3 className="text-[#D4A574] font-bold text-xl mb-4 text-center">
            💬 Join Team Chat
          </h3>
          <form onSubmit={handlePhoneSubmit}>
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Your Phone Number</label>
              <input
                type="tel"
                value={currentUserPhone}
                onChange={(e) => setCurrentUserPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Your Name (optional)</label>
              <input
                type="text"
                value={currentUserName}
                onChange={(e) => setCurrentUserName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4A574] to-[#B49B7E] hover:from-[#B49B7E] hover:to-[#D4A574] text-white py-3 rounded-lg font-bold transition-all"
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${compact ? 'fixed bottom-4 right-4 w-96 h-[500px] shadow-2xl z-50' : 'w-full h-full'} rounded-xl border border-[#D4A574]/30 overflow-hidden flex flex-col`}
      style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.98) 0%, rgba(30,30,40,0.95) 100%)' }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between border-b border-[#B49B7E]/20"
        style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💬</span>
          <div>
            <span className="text-[#D4A574] font-semibold">Team Chat</span>
            <span className="text-gray-500 text-xs ml-2">
              {messages.length} messages
            </span>
          </div>
        </div>
        {compact && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender_phone === currentUserPhone;
            const showDate = index === 0 || 
              formatDate(msg.created_at) !== formatDate(messages[index - 1].created_at);
            
            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="text-center">
                    <span className="bg-black/50 text-gray-500 text-xs px-3 py-1 rounded-full">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isOwn 
                        ? 'bg-[#D4A574] text-white rounded-br-none' 
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs text-[#B49B7E] font-medium mb-1">
                        {msg.sender_name || msg.sender_phone}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-[#B49B7E]/20">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[#D4A574] to-[#B49B7E] hover:from-[#B49B7E] hover:to-[#D4A574] flex items-center justify-center text-white disabled:opacity-50 transition-all"
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
