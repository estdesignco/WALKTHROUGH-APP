import React, { useState } from 'react';
import { Copy, Download, Mail, Eye } from 'lucide-react';
import EmailTemplate from './EmailTemplate';

const EmailPreview = () => {
  const [formData, setFormData] = useState({
    clientName: 'Sarah Johnson',
    designerName: 'The Established Design Team',
    questionnaireLink: 'https://yourwebsite.com/customer/questionnaire',
    companyName: 'Established Design Co.',
    contactEmail: 'hello@establisheddesign.co',
    phoneNumber: '(555) 123-4567'
  });
  
  const [activeTab, setActiveTab] = useState('preview');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateHTML = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your VIP Design Experience Awaits</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Georgia', serif;
            background-color: #000000;
            color: #F5F5DC;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }
        .header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }
        .logo {
            font-size: 32px;
            font-weight: 300;
            color: #D4A574;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }
        .tagline {
            font-size: 18px;
            color: #F5F5DC;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 24px;
            color: #D4A574;
            margin-bottom: 20px;
            text-align: center;
        }
        .vip-badge {
            background: linear-gradient(135deg, #D4A574 0%, #F5F5DC 50%, #D4A574 100%);
            color: #000;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin: 20px auto;
            display: inline-block;
        }
        .main-text {
            font-size: 16px;
            line-height: 1.8;
            color: #F5F5DC;
            margin-bottom: 30px;
        }
        .cta-button {
            background: linear-gradient(135deg, #D4A574 0%, #F5F5DC 50%, #D4A574 100%);
            color: #000;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-size: 18px;
            font-weight: bold;
            display: inline-block;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 8px 32px rgba(212, 165, 116, 0.3);
        }
        .time-commitment {
            background: rgba(212, 165, 116, 0.1);
            border: 1px solid #D4A574;
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .privacy-note {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            font-size: 14px;
            color: #D4A574;
            margin: 20px 0;
        }
        .footer {
            background: #000000;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #333;
        }
        .contact-info {
            color: #D4A574;
            font-size: 14px;
            margin: 10px 0;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            color: #D4A574;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }
        .unsubscribe {
            color: #888;
            font-size: 12px;
            margin-top: 20px;
        }
        .highlight {
            color: #D4A574;
            font-weight: bold;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            .content {
                padding: 20px !important;
            }
            .logo {
                font-size: 28px !important;
            }
            .greeting {
                font-size: 20px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">ESTABLISHED</div>
            <div class="tagline">DESIGN CO.</div>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Welcome to Your VIP Design Experience</div>
            
            <div style="text-align: center;">
                <span class="vip-badge">🌟 VIP CLIENT 🌟</span>
            </div>

            <div class="main-text">
                Dear <span class="highlight">${formData.clientName}</span>,
            </div>

            <div class="main-text">
                Thank you for choosing <strong>Established Design Co.</strong> for your interior design project. 
                We are thrilled to begin this exciting design journey with you and create a space that truly 
                reflects your unique style and lifestyle.
            </div>

            <div class="main-text">
                As part of our <span class="highlight">VIP client experience</span>, we've prepared a comprehensive 
                questionnaire that will help us understand your vision, preferences, and needs in detail. 
                This personalized approach ensures we create a design that is uniquely yours.
            </div>

            <!-- Time Commitment Box -->
            <div class="time-commitment">
                <div style="font-size: 18px; color: #D4A574; margin-bottom: 10px; font-weight: bold;">⏱️ Time Investment</div>
                <div style="font-size: 16px;">Approximately <strong>15-20 minutes</strong></div>
                <div style="font-size: 14px; margin-top: 5px; opacity: 0.8;">Your investment in this questionnaire directly translates to a more personalized design experience</div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
                <a href="${formData.questionnaireLink}" class="cta-button">
                    🎨 START YOUR DESIGN JOURNEY 🎨
                </a>
            </div>

            <div class="main-text">
                <strong>What to expect after completion:</strong>
                <ul style="color: #F5F5DC; line-height: 1.8;">
                    <li>📞 Personal consultation call within 24-48 hours</li>
                    <li>🎯 Customized design proposal based on your responses</li>
                    <li>📅 Scheduling of your in-home design consultation</li>
                    <li>✨ Beginning of your luxury design transformation</li>
                </ul>
            </div>

            <!-- Privacy Note -->
            <div class="privacy-note">
                🔒 <strong>Privacy & Security:</strong> Your information is completely secure and will only be used 
                to create your personalized design experience. We never share client information with third parties.
            </div>

            <div class="main-text">
                Should you have any questions before starting the questionnaire, please don't hesitate to 
                reach out to us directly. We're here to make this process as smooth and enjoyable as possible.
            </div>

            <div class="main-text" style="text-align: center; font-size: 18px; color: #D4A574;">
                We can't wait to bring your dream space to life!
            </div>

            <div class="main-text" style="text-align: center;">
                Warm regards,<br>
                <span class="highlight">${formData.designerName}</span><br>
                <em>Your Personal Design Team</em>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="contact-info">
                <strong>${formData.companyName}</strong>
            </div>
            <div class="contact-info">
                📧 ${formData.contactEmail} | 📞 ${formData.phoneNumber}
            </div>
            
            <div class="social-links">
                <a href="#">Instagram</a> |
                <a href="#">Facebook</a> |
                <a href="#">Pinterest</a> |
                <a href="#">Houzz</a>
            </div>
            
            <div style="color: #D4A574; font-size: 14px; margin: 15px 0;">
                Creating timeless, luxurious interiors that reflect your unique story
            </div>
            
            <div class="unsubscribe">
                If you no longer wish to receive emails from us, you can 
                <a href="#" style="color: #888;">unsubscribe here</a>.
            </div>
        </div>
    </div>
</body>
</html>
`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateHTML());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'email-template.html';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-light text-center" style={{ color: '#D4A574' }}>
            Email Template Preview
          </h1>
          <p className="text-center text-gray-300 mt-2">
            Customize and preview your VIP client email template
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 rounded-md flex items-center space-x-2 transition-colors ${
                activeTab === 'preview' 
                  ? 'bg-[#D4A574] text-black' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Eye size={20} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('customize')}
              className={`px-6 py-3 rounded-md flex items-center space-x-2 transition-colors ${
                activeTab === 'customize' 
                  ? 'bg-[#D4A574] text-black' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Mail size={20} />
              <span>Customize</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customization Panel */}
          {activeTab === 'customize' && (
            <div className="lg:col-span-1 bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-6" style={{ color: '#D4A574' }}>
                Customize Email
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Designer/Team Name
                  </label>
                  <input
                    type="text"
                    value={formData.designerName}
                    onChange={(e) => handleInputChange('designerName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Questionnaire Link
                  </label>
                  <input
                    type="url"
                    value={formData.questionnaireLink}
                    onChange={(e) => handleInputChange('questionnaireLink', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={copyToClipboard}
                  className="w-full px-4 py-3 bg-[#D4A574] text-black rounded-md font-medium hover:bg-[#C4956A] transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy size={20} />
                  <span>{copySuccess ? 'Copied!' : 'Copy HTML Code'}</span>
                </button>
                
                <button
                  onClick={downloadHTML}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-md font-medium hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download size={20} />
                  <span>Download HTML File</span>
                </button>
              </div>
              
              {/* Usage Instructions */}
              <div className="mt-8 p-4 bg-gray-800 rounded-md">
                <h4 className="font-medium mb-2" style={{ color: '#D4A574' }}>Usage Instructions:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Copy the HTML code and paste into your email service</li>
                  <li>• Update the questionnaire link to your actual URL</li>
                  <li>• Test the email before sending to clients</li>
                  <li>• Customize colors and branding as needed</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Email Preview */}
          <div className={`${activeTab === 'customize' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-gray-100 rounded-lg p-4`}>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-xl font-medium text-gray-800">Email Preview</h3>
              {activeTab === 'preview' && (
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-[#D4A574] text-black rounded-md font-medium hover:bg-[#C4956A] transition-colors flex items-center space-x-2"
                  >
                    <Copy size={16} />
                    <span>{copySuccess ? 'Copied!' : 'Copy HTML'}</span>
                  </button>
                  
                  <button
                    onClick={downloadHTML}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md font-medium hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-md overflow-hidden" style={{ minHeight: '800px' }}>
              <EmailTemplate {...formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;