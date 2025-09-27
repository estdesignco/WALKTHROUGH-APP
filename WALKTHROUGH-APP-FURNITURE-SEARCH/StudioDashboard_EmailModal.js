import React, { useState } from 'react';

const EmailModal = ({ isOpen, onClose, onSend }) => {
  const [emailData, setEmailData] = useState({ email: '', name: '' });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (emailData.email && emailData.name) {
      setSending(true);
      try {
        await onSend(emailData);
        setEmailData({ email: '', name: '' });
        onClose();
      } catch (error) {
        console.error('Error sending email:', error);
      } finally {
        setSending(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-black/90 to-gray-900/90 p-8 rounded-3xl border border-[#B49B7E]/20 shadow-2xl max-w-md w-full mx-4">
        <h3 className="text-2xl font-light text-[#B49B7E] mb-6 text-center tracking-wide">
          Email Questionnaire
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F5F5DC]/80 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={emailData.name}
              onChange={(e) => setEmailData({...emailData, name: e.target.value})}
              className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] placeholder:text-[#B49B7E]/50"
              placeholder="Enter client name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#F5F5DC]/80 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={emailData.email}
              onChange={(e) => setEmailData({...emailData, email: e.target.value})}
              className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] placeholder:text-[#B49B7E]/50"
              placeholder="Enter email address"
            />
          </div>
        </div>
        
        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gradient-to-br from-black/80 to-gray-900/90 hover:from-gray-900/80 hover:to-black/90 border border-[#B49B7E]/30 text-[#F5F5DC] rounded-full transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!emailData.email || !emailData.name || sending}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-[#F5F5DC] rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;