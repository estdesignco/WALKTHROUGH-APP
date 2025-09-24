import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle, Users, Award, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CustomerLandingPage = () => {
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const navigate = useNavigate();

    // Sample portfolio images - replace with your actual images
    const portfolioImages = [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2058&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2043&q=80"
    ];

    // Auto-rotate portfolio images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % portfolioImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Video/Image */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={portfolioImages[currentImageIndex]}
                        alt="Luxury Interior" 
                        className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
                    {/* Your Logo */}
                    <div className="mb-8">
                        <img
                            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
                            alt="Established Design Co."
                            className="h-24 md:h-32 mx-auto object-contain"
                            style={{ filter: 'brightness(0) saturate(100%) invert(85%) sepia(15%) saturate(664%) hue-rotate(349deg) brightness(95%) contrast(88%)' }} // Converts to your brand gold color
                        />
                        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mt-6"></div>
                    </div>

                    {/* Tagline */}
                    <p className="text-xl md:text-2xl font-light mb-8 max-w-3xl mx-auto leading-relaxed" style={{ color: '#F5F5DC' }}>
                        Creating extraordinary spaces that reflect your unique story and elevate your everyday life
                    </p>

                    {/* Video Section */}
                    <div className="mb-12">
                        <div className="relative inline-block">
                            {!isVideoPlaying ? (
                                <div 
                                    className="relative cursor-pointer group"
                                    onClick={() => setIsVideoPlaying(true)}
                                >
                                    <div className="w-64 h-36 bg-black/50 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-[#B49B7E]/30 group-hover:border-[#B49B7E]/60 transition-all duration-300">
                                        <Play className="w-12 h-12 text-[#B49B7E] group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-light" style={{ color: '#F5F5DC' }}>
                                        Meet Our Team
                                    </div>
                                </div>
                            ) : (
                                <div className="w-96 h-56 bg-black rounded-2xl overflow-hidden border border-[#B49B7E]/30">
                                    {/* Replace with your actual video */}
                                    <iframe
                                        src="https://player.vimeo.com/video/example"
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Button 
                        onClick={() => navigate('/customer/questionnaire')}
                        className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-white px-12 py-4 text-lg font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105"
                    >
                        Begin Your Design Journey
                        <ArrowRight className="ml-3 w-5 h-5" />
                    </Button>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Who We Are Section */}
            <section className="py-20 px-6 bg-gradient-to-b from-gray-800 to-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-light text-[#B49B7E] mb-6">Who We Are</h2>
                        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-8"></div>
                        <p className="text-xl max-w-4xl mx-auto leading-relaxed" style={{ color: '#F5F5DC' }}>
                            We are passionate creators of extraordinary living spaces, dedicated to transforming your vision into reality with unparalleled attention to detail and timeless elegance.
                        </p>
                    </div>

                    {/* Team Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {/* Philosophy */}
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#B49B7E] to-[#A08B6F] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Heart className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-light mb-4" style={{ color: '#F5F5DC' }}>Our Philosophy</h3>
                            <p className="leading-relaxed" style={{ color: '#F5F5DC', opacity: '0.8' }}>
                                Every space tells a story. We believe in creating environments that not only inspire but deeply connect with who you are and how you live.
                            </p>
                        </div>

                        {/* Expertise */}
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#B49B7E] to-[#A08B6F] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Award className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-light text-white mb-4">Our Expertise</h3>
                            <p className="text-white/70 leading-relaxed">
                                With years of experience in luxury design, we specialize in new builds, renovations, and complete styling transformations.
                            </p>
                        </div>

                        {/* Commitment */}
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#B49B7E] to-[#A08B6F] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Star className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-light text-white mb-4">Our Commitment</h3>
                            <p className="text-white/70 leading-relaxed">
                                From initial concept to final installation, we ensure every detail exceeds your expectations and creates lasting memories.
                            </p>
                        </div>
                    </div>

                    {/* Process Overview */}
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-3xl p-12 border border-[#B49B7E]/20">
                        <h3 className="text-4xl font-light text-[#B49B7E] text-center mb-12">Our Design Process</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                { step: "01", title: "Discovery", desc: "We start with your comprehensive questionnaire to understand your vision, lifestyle, and dreams." },
                                { step: "02", title: "Planning", desc: "Our team creates detailed plans and concepts tailored specifically to your unique needs." },
                                { step: "03", title: "Curation", desc: "We carefully select every piece, from furniture to finishes, ensuring perfect harmony." },
                                { step: "04", title: "Installation", desc: "We bring your vision to life with meticulous attention to every detail and timeline." }
                            ].map((item, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-3xl font-light text-[#B49B7E] mb-4">{item.step}</div>
                                    <h4 className="text-xl font-medium text-white mb-3">{item.title}</h4>
                                    <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Portfolio Showcase */}
            <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-black">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-light text-[#B49B7E] mb-6">Recent Projects</h2>
                        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-8"></div>
                        <p className="text-xl text-white/80 max-w-3xl mx-auto">
                            Discover some of our recent transformations where luxury meets livability
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {portfolioImages.map((image, index) => (
                            <div key={index} className="group cursor-pointer">
                                <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
                                    <img 
                                        src={image} 
                                        alt={`Project ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <h4 className="text-lg font-medium">Luxury Residence</h4>
                                        <p className="text-sm text-white/80">Complete Interior Design</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-20 px-6 bg-gradient-to-r from-[#B49B7E]/10 to-[#A08B6F]/10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-light text-[#B49B7E] mb-8">Ready to Begin?</h2>
                    <p className="text-xl text-white/80 mb-12 leading-relaxed">
                        Take the first step towards your dream space. Our comprehensive questionnaire helps us understand your unique vision and creates the foundation for an extraordinary design journey.
                    </p>
                    
                    <div className="flex flex-col items-center gap-6">
                        <Button 
                            onClick={() => navigate('/customer/questionnaire')}
                            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-white px-16 py-6 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105"
                        >
                            Start Your Questionnaire
                            <ArrowRight className="ml-4 w-6 h-6" />
                        </Button>
                        
                        <div className="flex items-center gap-6 text-white/60 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#B49B7E]" />
                                <span>Takes 10-15 minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#B49B7E]" />
                                <span>Completely confidential</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#B49B7E]" />
                                <span>No obligation consultation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 bg-black">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-2xl font-light tracking-widest text-[#B49B7E] mb-4">
                        ESTABLISHED DESIGN CO.
                    </div>
                    <p className="text-white/60 text-sm mb-6">
                        Creating extraordinary spaces since 2020
                    </p>
                    <div className="flex justify-center gap-8 text-white/40 text-sm">
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                        <span>Contact</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CustomerLandingPage;