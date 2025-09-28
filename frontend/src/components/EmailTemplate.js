import React from 'react';

const EmailTemplate = ({ 
  clientName = 'Valued Client',
  designerName = 'The Established Design Team',
  questionnaireLink = '#',
  companyName = 'Established Design Co.',
  contactEmail = 'hello@establisheddesign.co',
  phoneNumber = '(555) 123-4567'
}) => {
  const emailHTML = `
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
                Dear <span class="highlight">${clientName}</span>,
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
                <a href="${questionnaireLink}" class="cta-button">
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
                <span class="highlight">${designerName}</span><br>
                <em>Your Personal Design Team</em>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="contact-info">
                <strong>${companyName}</strong>
            </div>
            <div class="contact-info">
                📧 ${contactEmail} | 📞 ${phoneNumber}
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

  return (
    <div>
      <div 
        className="email-preview bg-white"
        dangerouslySetInnerHTML={{ __html: emailHTML }}
        style={{ 
          maxWidth: '600px', 
          margin: '0 auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
};

export default EmailTemplate;