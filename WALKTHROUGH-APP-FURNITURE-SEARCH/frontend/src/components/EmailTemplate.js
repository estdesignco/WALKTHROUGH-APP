import React from 'react';

const EmailTemplate = ({ clientName, questionnaireLinkId }) => {
    const questionnaireUrl = `${process.env.REACT_APP_FRONTEND_URL || 'https://designhub-74.preview.emergentagent.com'}/customer/questionnaire/${questionnaireLinkId}`;

    return (
        <div style={{
            fontFamily: 'Georgia, serif',
            backgroundColor: '#0F0F0F',
            color: '#F5F5DC',
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            {/* Email Header */}
            <div style={{
                background: 'linear-gradient(135deg, #B49B7E 0%, #A08B6F 50%, #8B7355 100%)',
                padding: '40px 30px',
                textAlign: 'center',
                borderRadius: '15px 15px 0 0',
                marginBottom: '0'
            }}>
                <img 
                    src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
                    alt="Established Design Co." 
                    style={{
                        height: '120px',
                        objectFit: 'contain'
                    }} 
                />
            </div>

            {/* Email Body */}
            <div style={{
                backgroundColor: '#1A1A1A',
                padding: '40px 30px',
                borderRadius: '0 0 15px 15px'
            }}>
                {/* Personal Greeting */}
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: '300',
                    color: '#B49B7E',
                    margin: '0 0 15px 0',
                    textAlign: 'center'
                }}>
                    Welcome, {clientName}
                </h2>
                
                <p style={{
                    fontSize: '16px',
                    color: '#F5F5DC',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    margin: '0 0 30px 0'
                }}>
                    We are honored that you're considering us for your design journey
                </p>

                {/* Main Content */}
                <div style={{
                    backgroundColor: 'rgba(180, 155, 126, 0.1)',
                    borderRadius: '10px',
                    padding: '25px',
                    marginBottom: '25px'
                }}>
                    <p style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: '#F5F5DC',
                        margin: '0 0 20px 0'
                    }}>
                        Creating your dream space begins with understanding your unique story, lifestyle, and vision. We've carefully crafted a comprehensive questionnaire that will help us design a space that truly reflects who you are.
                    </p>
                    
                    <p style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: '#F5F5DC',
                        margin: '0 0 20px 0'
                    }}>
                        This personalized assessment takes approximately <strong style={{ color: '#B49B7E' }}>10-15 minutes</strong> and covers everything from your design preferences to your family's daily routines.
                    </p>

                    {/* Benefits */}
                    <div style={{ margin: '20px 0' }}>
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#B49B7E', marginRight: '10px' }}>•</span>
                            <span style={{ color: '#F5F5DC', fontSize: '14px' }}>Completely confidential and secure</span>
                        </div>
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#B49B7E', marginRight: '10px' }}>•</span>
                            <span style={{ color: '#F5F5DC', fontSize: '14px' }}>Save and continue at your convenience</span>
                        </div>
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#B49B7E', marginRight: '10px' }}>•</span>
                            <span style={{ color: '#F5F5DC', fontSize: '14px' }}>No obligation for our initial consultation</span>
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <a href={questionnaireUrl} style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #B49B7E 0%, #A08B6F 100%)',
                        color: '#F5F5DC',
                        textDecoration: 'none',
                        padding: '15px 35px',
                        borderRadius: '25px',
                        fontSize: '14px',
                        fontWeight: '500',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                    }}>
                        BEGIN YOUR DESIGN JOURNEY
                    </a>
                    <p style={{
                        fontSize: '12px',
                        color: '#A0A0A0',
                        margin: '15px 0 0 0',
                        fontStyle: 'italic'
                    }}>
                        This link is exclusively for you and expires in 30 days
                    </p>
                </div>

                {/* Quote */}
                <div style={{
                    backgroundColor: 'rgba(180, 155, 126, 0.05)',
                    padding: '20px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <p style={{
                        fontSize: '16px',
                        fontStyle: 'italic',
                        color: '#B49B7E',
                        margin: '0 0 8px 0'
                    }}>
                        "The details are not the details. They make the design."
                    </p>
                    <p style={{
                        fontSize: '12px',
                        color: '#A0A0A0',
                        margin: '0'
                    }}>
                        — Charles Eames
                    </p>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center' }}>
                    <img 
                        src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
                        alt="Established Design Co." 
                        style={{
                            height: '50px',
                            objectFit: 'contain',
                            filter: 'brightness(0) saturate(100%) invert(85%) sepia(15%) saturate(664%) hue-rotate(349deg) brightness(95%) contrast(88%)'
                        }} 
                    />
                    <p style={{
                        fontSize: '12px',
                        color: '#808080',
                        margin: '0'
                    }}>
                        Creating extraordinary spaces since 2020
                    </p>
                </div>
            </div>
        </div>
    );
};

// Export both the component and the HTML string version for email sending
export const generateEmailHTML = (clientName, questionnaireLinkId) => {
    const questionnaireUrl = `${process.env.REACT_APP_FRONTEND_URL || 'https://designhub-74.preview.emergentagent.com'}/customer/questionnaire/${questionnaireLinkId}`;
    
    return `
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Design Journey Begins - Established Design Co.</title>
        <style type="text/css">
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500&family=Lato:wght@300;400&display=swap');
        </style>
    </head>
    <body style="margin:0; padding:0; font-family: 'Lato', Georgia, serif; background-color: #0F0F0F; color: #F5F5DC;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0F0F0F; min-height: 100vh;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #1A1A1A; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(180, 155, 126, 0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #B49B7E 0%, #A08B6F 50%, #8B7355 100%); padding: 60px 40px; text-align: center;">
                                <div style="width: 80px; height: 1px; background-color: rgba(255, 255, 255, 0.3); margin: 0 auto 30px auto;"></div>
                                <img src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" alt="Established Design Co." style="height: 120px; object-fit: contain;" />
                                <div style="width: 120px; height: 1px; background-color: rgba(255, 255, 255, 0.4); margin: 0 auto;"></div>
                            </td>
                        </tr>

                        <!-- Personal Greeting -->
                        <tr>
                            <td style="padding: 50px 40px 30px 40px; text-align: center;">
                                <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 300; color: #B49B7E; margin: 0 0 20px 0; letter-spacing: 1px;">Welcome, ${clientName}</h2>
                                <p style="font-size: 18px; line-height: 1.6; color: #E0E0E0; margin: 0; font-style: italic;">We are honored that you're considering us for your design journey</p>
                            </td>
                        </tr>

                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 0 40px 40px 40px;">
                                <div style="background-color: rgba(180, 155, 126, 0.05); border-radius: 15px; padding: 40px; border: 1px solid rgba(180, 155, 126, 0.1);">
                                    <p style="font-size: 16px; line-height: 1.7; color: #D0D0D0; margin: 0 0 25px 0;">Creating your dream space begins with understanding your unique story, lifestyle, and vision. We've carefully crafted a comprehensive questionnaire that will help us design a space that truly reflects who you are.</p>
                                    <p style="font-size: 16px; line-height: 1.7; color: #D0D0D0; margin: 0 0 25px 0;">This personalized assessment takes approximately <strong style="color: #B49B7E;">10-15 minutes</strong> and covers everything from your design preferences to your family's daily routines. Every detail matters when creating spaces that enhance your life.</p>
                                    
                                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                        <tr><td style="padding: 6px 0;"><div style="width: 8px; height: 8px; background-color: #B49B7E; border-radius: 50%; display: inline-block; margin-right: 15px; vertical-align: middle;"></div><span style="color: #D0D0D0; font-size: 15px;">Completely confidential and secure</span></td></tr>
                                        <tr><td style="padding: 6px 0;"><div style="width: 8px; height: 8px; background-color: #B49B7E; border-radius: 50%; display: inline-block; margin-right: 15px; vertical-align: middle;"></div><span style="color: #D0D0D0; font-size: 15px;">Save and continue at your convenience</span></td></tr>
                                        <tr><td style="padding: 6px 0;"><div style="width: 8px; height: 8px; background-color: #B49B7E; border-radius: 50%; display: inline-block; margin-right: 15px; vertical-align: middle;"></div><span style="color: #D0D0D0; font-size: 15px;">No obligation for our initial consultation</span></td></tr>
                                    </table>
                                </div>
                            </td>
                        </tr>

                        <!-- CTA Button -->
                        <tr>
                            <td style="padding: 0 40px 50px 40px; text-align: center;">
                                <a href="${questionnaireUrl}" style="display: inline-block; background: linear-gradient(135deg, #B49B7E 0%, #A08B6F 100%); color: white; text-decoration: none; padding: 18px 45px; border-radius: 50px; font-size: 16px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 8px 25px rgba(180, 155, 126, 0.3);">Begin Your Design Journey</a>
                                <p style="font-size: 14px; color: #A0A0A0; margin: 25px 0 0 0; font-style: italic;">This link is exclusively for you and expires in 30 days</p>
                            </td>
                        </tr>

                        <!-- Quote Section -->
                        <tr>
                            <td style="background-color: rgba(180, 155, 126, 0.08); padding: 40px; text-align: center; border-top: 1px solid rgba(180, 155, 126, 0.1);">
                                <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-style: italic; color: #B49B7E; margin: 0 0 15px 0; line-height: 1.5;">"The details are not the details. They make the design."</p>
                                <p style="font-size: 14px; color: #A0A0A0; margin: 0;">— Charles Eames</p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #0F0F0F; padding: 40px; text-align: center;">
                                <img src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" alt="Established Design Co." style="height: 50px; object-fit: contain; filter: brightness(0) saturate(100%) invert(85%) sepia(15%) saturate(664%) hue-rotate(349deg) brightness(95%) contrast(88%);" />
                                <p style="font-size: 14px; color: #808080; margin: 0 0 20px 0;">Creating extraordinary spaces since 2020</p>
                                <p style="margin: 0 0 20px 0;">
                                    <a href="#" style="color: #B49B7E; text-decoration: none; font-size: 13px; margin: 0 15px;">Pinterest</a>
                                    <a href="#" style="color: #B49B7E; text-decoration: none; font-size: 13px; margin: 0 15px;">Instagram</a>
                                    <a href="#" style="color: #B49B7E; text-decoration: none; font-size: 13px; margin: 0 15px;">Houzz</a>
                                </p>
                                <p style="font-size: 12px; color: #606060; margin: 0;">If you no longer wish to receive these emails, you can <a href="#" style="color: #B49B7E;">unsubscribe here</a></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

export default EmailTemplate;