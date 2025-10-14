import React, { useState } from 'react';
import { Copy, Eye, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmailTemplate from './EmailTemplate';

const EmailPreview = () => {
  const [copied, setCopied] = useState(false);
  const [clientName, setClientName] = useState("Valued Client");
  const [projectName, setProjectName] = useState("Your Design Project");

  const generateHTMLString = () => {
    const htmlString = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Questionnaire - Established Design Co.</title>
</head>
<body style="font-family: 'Century Gothic', Arial, sans-serif; background-color: #000000; background: linear-gradient(to bottom, #000000, #1f2937, #000000); margin: 0; padding: 40px 20px; min-height: 100vh;">
    
    <!-- Email Container -->
    <div style="max-width: 600px; margin: 0 auto; background-color: rgba(0, 0, 0, 0.8); border-radius: 24px; border: 1px solid rgba(180, 155, 126, 0.2); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(180, 155, 126, 0.1); backdrop-filter: blur(16px); overflow: hidden;">

        <!-- Header with Logo -->
        <div style="background: linear-gradient(to right, #B49B7E, #A08B6F); padding: 20px; text-align: center; height: 120px; display: flex; align-items: center; justify-content: center;">
            <img src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" alt="Established Design Co." style="height: 80px; width: auto; object-fit: contain; display: block;">
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            
            <!-- Greeting -->
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-size: 32px; font-weight: 300; color: #B49B7E; margin: 0 0 20px 0; letter-spacing: 1px;">Welcome to Established Design Co.</h1>
                <div style="width: 80px; height: 2px; background: linear-gradient(to right, transparent, #B49B7E, transparent); margin: 0 auto 20px;"></div>
                <p style="font-size: 18px; color: #F5F5DC; opacity: 0.9; margin: 0; line-height: 1.6;">Dear ${clientName},</p>
            </div>

            <!-- Main Message -->
            <div style="margin-bottom: 40px;">
                <p style="font-size: 16px; color: #F5F5DC; opacity: 0.9; line-height: 1.7; margin: 0 0 20px 0;">Thank you for considering Established Design Co. for your interior design project. We are excited about the possibility of transforming your space into something truly extraordinary.</p>
                
                <p style="font-size: 16px; color: #F5F5DC; opacity: 0.9; line-height: 1.7; margin: 0 0 20px 0;">To begin this journey and ensure we create a space that perfectly reflects your vision and lifestyle, we would love for you to complete our design questionnaire. This helps us understand your preferences, needs, and dreams for your project.</p>

                <p style="font-size: 16px; color: #F5F5DC; opacity: 0.9; line-height: 1.7; margin: 0;">The questionnaire takes just a few minutes to complete and will provide us with valuable insights to create a personalized design approach for <strong style="color: #B49B7E;">${projectName}</strong>.</p>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin-bottom: 40px;">
                <a href="https://designhub-74.preview.emergentagent.com/customer/questionnaire" style="display: inline-block; background: linear-gradient(to right, #B49B7E, #A08B6F); color: #F5F5DC; font-size: 18px; font-weight: 500; padding: 16px 32px; border-radius: 50px; text-decoration: none; box-shadow: 0 10px 25px rgba(180, 155, 126, 0.3); letter-spacing: 0.5px;">Complete Design Questionnaire</a>
            </div>

            <!-- What to Expect -->
            <div style="background-color: rgba(180, 155, 126, 0.1); border: 1px solid rgba(180, 155, 126, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 40px;">
                <h3 style="font-size: 20px; font-weight: 400; color: #B49B7E; margin: 0 0 16px 0; letter-spacing: 0.5px;">What to Expect:</h3>
                <ul style="color: #F5F5DC; opacity: 0.9; font-size: 15px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Personalized design approach based on your responses</li>
                    <li style="margin-bottom: 8px;">Detailed project timeline and next steps</li>
                    <li style="margin-bottom: 8px;">Initial design consultation to discuss your vision</li>
                    <li>Comprehensive design proposal tailored to your needs and budget</li>
                </ul>
            </div>

            <!-- Closing -->
            <div style="margin-bottom: 30px;">
                <p style="font-size: 16px; color: #F5F5DC; opacity: 0.9; line-height: 1.7; margin: 0 0 20px 0;">We look forward to learning more about your project and creating a space that you will love for years to come.</p>
                <p style="font-size: 16px; color: #F5F5DC; opacity: 0.9; line-height: 1.7; margin: 0;">Warm regards,<br><strong style="color: #B49B7E;">The Established Design Co. Team</strong></p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: rgba(180, 155, 126, 0.1); padding: 20px; text-align: center; border-top: 1px solid rgba(180, 155, 126, 0.2);">
            <p style="font-size: 14px; color: #F5F5DC; opacity: 0.7; margin: 0 0 8px 0;">Established Design Co. | Luxury Interior Design</p>
            <p style="font-size: 12px; color: #F5F5DC; opacity: 0.6; margin: 0;">Creating extraordinary spaces that reflect your unique story</p>
        </div>
    </div>
</body>
</html>`;
    return htmlString;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateHTMLString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] shadow-2xl flex items-center justify-center px-4 py-2" style={{ height: '150px' }}>
        <img
          src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
          alt="Established Design Co."
          className="w-full h-full object-contain"
          style={{ transform: 'scale(1.8)', maxWidth: '95%', maxHeight: '90%' }}
        />
      </div>

      {/* Controls */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">Email Template Preview</h1>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto"></div>
        </div>

        {/* Customization Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[#F5F5DC]/90 font-medium mb-2">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] placeholder:text-[#B49B7E]/50"
              placeholder="Enter client name"
            />
          </div>
          
          <div>
            <label className="block text-[#F5F5DC]/90 font-medium mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] placeholder:text-[#B49B7E]/50"
              placeholder="Enter project name"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link
            to="/studio"
            className="flex items-center gap-2 bg-gradient-to-br from-black/80 to-gray-900/90 hover:from-gray-900/80 hover:to-black/90 px-6 py-3 text-lg font-medium rounded-full border border-[#B49B7E]/30 transition-all duration-300"
            style={{ color: '#F5F5DC' }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Studio
          </Link>
          
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 text-lg font-medium rounded-full shadow-xl hover:shadow-[#B49B7E]/25 transition-all duration-300"
            style={{ color: '#F5F5DC' }}
          >
            <Copy className="w-5 h-5" />
            {copied ? 'Copied!' : 'Copy HTML'}
          </button>
          
          <a
            href={`mailto:?subject=Design Questionnaire - Established Design Co.&body=${encodeURIComponent(generateHTMLString())}`}
            className="flex items-center gap-2 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 text-lg font-medium rounded-full shadow-xl hover:shadow-[#B49B7E]/25 transition-all duration-300"
            style={{ color: '#F5F5DC' }}
          >
            <Mail className="w-5 h-5" />
            Send Email
          </a>
        </div>
      </div>

      {/* Email Preview */}
      <div className="px-4 pb-8">
        <EmailTemplate clientName={clientName} projectName={projectName} />
      </div>
    </div>
  );
};

export default EmailPreview;