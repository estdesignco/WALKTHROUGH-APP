import React from 'react';

const EmailTemplate = ({ clientName, projectName }) => {
    return (
        <div style={{
            fontFamily: 'Century Gothic, sans-serif',
            backgroundColor: '#0F0F0F',
            color: '#F5F5DC',
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            {/* Email Container */}
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '24px',
                border: '1px solid rgba(180, 155, 126, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(180, 155, 126, 0.1)',
                backdropFilter: 'blur(16px)',
                overflow: 'hidden'
            }}>

                {/* Header with Logo */}
                <div style={{
                    background: 'linear-gradient(to right, #B49B7E, #A08B6F)',
                    padding: '20px',
                    textAlign: 'center',
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img 
                        src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
                        alt="Established Design Co." 
                        style={{
                            height: '80px',
                            width: 'auto',
                            objectFit: 'contain',
                            display: 'block'
                        }}
                    />
                </div>

                {/* Main Content */}
                <div style={{ padding: '40px 30px' }}>
                    
                    {/* Greeting */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '300',
                            color: '#B49B7E',
                            margin: '0 0 20px 0',
                            letterSpacing: '1px'
                        }}>Welcome to Established Design Co.</h1>
                        <div style={{
                            width: '80px',
                            height: '2px',
                            background: 'linear-gradient(to right, transparent, #B49B7E, transparent)',
                            margin: '0 auto 20px'
                        }}></div>
                        <p style={{
                            fontSize: '18px',
                            color: '#F5F5DC',
                            opacity: '0.9',
                            margin: '0',
                            lineHeight: '1.6'
                        }}>Dear {clientName || 'Valued Client'},</p>
                    </div>

                    {/* Main Message */}
                    <div style={{ marginBottom: '40px' }}>
                        <p style={{
                            fontSize: '16px',
                            color: '#F5F5DC',
                            opacity: '0.9',
                            lineHeight: '1.7',
                            margin: '0 0 20px 0'
                        }}>Thank you for considering Established Design Co. for your interior design project. We are excited about the possibility of transforming your space into something truly extraordinary.</p>
                        
                        <p style={{
                            fontSize: '16px',
                            color: '#F5F5DC',
                            opacity: '0.9',
                            lineHeight: '1.7',
                            margin: '0 0 20px 0'
                        }}>To begin this journey and ensure we create a space that perfectly reflects your vision and lifestyle, we would love for you to complete our design questionnaire. This helps us understand your preferences, needs, and dreams for your project.</p>

                        <p style={{
                            fontSize: '16px',
                            color: '#F5F5DC',
                            opacity: '0.9',
                            lineHeight: '1.7',
                            margin: '0'
                        }}>The questionnaire takes just a few minutes to complete and will provide us with valuable insights to create a personalized design approach for <strong style={{ color: '#B49B7E' }}>{projectName || 'Your Design Project'}</strong>.</p>
                    </div>

                    {/* Call to Action Button */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <a 
                            href="https://designflow-master.preview.emergentagent.com/customer/questionnaire" 
                            style={{
                                display: 'inline-block',
                                background: 'linear-gradient(to right, #B49B7E, #A08B6F)',
                                color: '#F5F5DC',
                                fontSize: '18px',
                                fontWeight: '500',
                                padding: '16px 32px',
                                borderRadius: '50px',
                                textDecoration: 'none',
                                boxShadow: '0 10px 25px rgba(180, 155, 126, 0.3)',
                                letterSpacing: '0.5px'
                            }}
                        >Complete Design Questionnaire</a>
                    </div>

                    {/* What to Expect */}
                    <div style={{
                        backgroundColor: 'rgba(180, 155, 126, 0.1)',
                        border: '1px solid rgba(180, 155, 126, 0.2)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '40px'
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '400',
                            color: '#B49B7E',
                            margin: '0 0 16px 0',
                            letterSpacing: '0.5px'
                        }}>What to Expect:</h3>
                        <ul style={{
                            color: '#F5F5DC',
                            opacity: '0.9',
                            fontSize: '15px',
                            lineHeight: '1.6',
                            margin: '0',
                            paddingLeft: '20px'
                        }}>
                            <li style={{ marginBottom: '8px' }}>Personalized design approach based on your responses</li>
                            <li style={{ marginBottom: '8px' }}>Detailed project timeline and next steps</li>
                            <li style={{ marginBottom: '8px' }}>Initial design consultation to discuss your vision</li>
                            <li>Comprehensive design proposal tailored to your needs and budget</li>
                        </ul>
                    </div>

                    {/* Closing */}
                    <div style={{ marginBottom: '30px' }}>
                        <p style={{
                            fontSize: '16px',
                            color: '#F5F5DC',
                            opacity: '0.9',
                            lineHeight: '1.7',
                            margin: '0 0 20px 0'
                        }}>We look forward to learning more about your project and creating a space that you will love for years to come.</p>
                        <p style={{
                            fontSize: '16px',
                            color: '#F5F5DC',
                            opacity: '0.9',
                            lineHeight: '1.7',
                            margin: '0'
                        }}>Warm regards,<br/><strong style={{ color: '#B49B7E' }}>The Established Design Co. Team</strong></p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    backgroundColor: 'rgba(180, 155, 126, 0.1)',
                    padding: '20px',
                    textAlign: 'center',
                    borderTop: '1px solid rgba(180, 155, 126, 0.2)'
                }}>
                    <p style={{
                        fontSize: '14px',
                        color: '#F5F5DC',
                        opacity: '0.7',
                        margin: '0 0 8px 0'
                    }}>Established Design Co. | Luxury Interior Design</p>
                    <p style={{
                        fontSize: '12px',
                        color: '#F5F5DC',
                        opacity: '0.6',
                        margin: '0'
                    }}>Creating extraordinary spaces that reflect your unique story</p>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplate;