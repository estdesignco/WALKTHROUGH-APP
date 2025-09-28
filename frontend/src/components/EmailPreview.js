import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailTemplate, { generateEmailHTML } from './EmailTemplate';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const EmailPreview = () => {
    const navigate = useNavigate();
    const [clientName, setClientName] = useState('Sarah Johnson');
    const [questionnaireLinkId, setQuestionnaireLinkId] = useState('abc123xyz');

    const copyEmailHTML = () => {
        const htmlContent = generateEmailHTML(clientName, questionnaireLinkId);
        navigator.clipboard.writeText(htmlContent).then(() => {
            alert('Email HTML copied to clipboard!');
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 py-8 px-4">
            {/* Back Button */}
            <div className="absolute top-4 left-4 z-50">
                <button
                    onClick={() => navigate('/')}
                    className="text-white hover:text-stone-300 transition-colors duration-200 flex items-center space-x-2 p-2 rounded-lg"
                    style={{
                        background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
                        border: '1px solid #d4af37',
                        boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)'
                    }}
                >
                    <span>←</span>
                    <span>Back to Dashboard</span>
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-light text-[#B49B7E] mb-4">Email Template Preview</h1>
                    <p className="text-white/70">Preview your elegant customer questionnaire email</p>
                </div>

                {/* Controls */}
                <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-[#B49B7E]/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <Label className="text-[#B49B7E] mb-2 block">Client Name</Label>
                            <Input
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div>
                            <Label className="text-[#B49B7E] mb-2 block">Questionnaire Link ID</Label>
                            <Input
                                value={questionnaireLinkId}
                                onChange={(e) => setQuestionnaireLinkId(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div>
                            <Button
                                onClick={copyEmailHTML}
                                className="w-full bg-[#B49B7E] hover:bg-[#A08B6F]"
                            >
                                Copy HTML Code
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Email Preview */}
                <div className="bg-white rounded-lg overflow-hidden shadow-2xl border">
                    <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="text-sm text-gray-600 font-mono">
                            Email Preview - {clientName} Design Questionnaire
                        </div>
                    </div>
                    
                    {/* Email Content */}
                    <div className="h-96 overflow-auto">
                        <EmailTemplate 
                            clientName={clientName}
                            questionnaireLinkId={questionnaireLinkId}
                        />
                    </div>
                </div>

                {/* Usage Instructions */}
                <div className="mt-8 bg-gradient-to-r from-[#B49B7E]/10 to-[#A08B6F]/10 rounded-lg p-6 border border-[#B49B7E]/20">
                    <h3 className="text-xl font-medium text-[#B49B7E] mb-4">How to Use This Email Template</h3>
                    <div className="space-y-3 text-white/80">
                        <p>• <strong>Copy HTML:</strong> Use the "Copy HTML Code" button to get the email template code</p>
                        <p>• <strong>Email Service:</strong> Paste this HTML into your email service (SendGrid, Mailgun, etc.)</p>
                        <p>• <strong>Customization:</strong> Update client name and generate unique questionnaire link IDs</p>
                        <p>• <strong>Link Generation:</strong> The questionnaire URL automatically includes the link ID for tracking</p>
                    </div>
                </div>

                {/* Email Features */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 rounded-lg p-6 border border-[#B49B7E]/20">
                        <h4 className="text-lg font-medium text-[#B49B7E] mb-3">Email Features</h4>
                        <ul className="space-y-2 text-white/80 text-sm">
                            <li>✨ Luxury design matching your brand</li>
                            <li>📱 Mobile responsive layout</li>
                            <li>🎨 Elegant typography and spacing</li>
                            <li>🔗 Personalized questionnaire links</li>
                            <li>💫 Professional gradient backgrounds</li>
                            <li>📧 Email client compatibility</li>
                        </ul>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-[#B49B7E]/20">
                        <h4 className="text-lg font-medium text-[#B49B7E] mb-3">Customer Experience</h4>
                        <ul className="space-y-2 text-white/80 text-sm">
                            <li>💎 Makes customers feel VIP</li>
                            <li>📝 Clear call-to-action</li>
                            <li>⏱️ Sets time expectations (10-15 min)</li>
                            <li>🔒 Emphasizes privacy & security</li>
                            <li>🎯 No pressure, no obligation</li>
                            <li>🌟 Builds trust and excitement</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailPreview;