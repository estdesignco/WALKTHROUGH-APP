import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, Star, CheckCircle } from 'lucide-react';

const CustomerLandingPage = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-light mb-4" style={{ color: '#D4A574' }}>
              ESTABLISHED
            </h1>
            <h2 className="text-4xl md:text-6xl font-light" style={{ color: '#F5F5DC' }}>
              DESIGN CO.
            </h2>
          </div>
          
          <p className="text-xl md:text-2xl font-light mb-12 max-w-2xl mx-auto" style={{ color: '#F5F5DC' }}>
            Creating timeless, luxurious interiors that reflect your unique story
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/customer/questionnaire"
              className="px-8 py-4 text-lg font-medium rounded-full transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #F5F5DC 50%, #D4A574 100%)',
                color: '#000',
                boxShadow: '0 8px 32px rgba(212, 165, 116, 0.3)'
              }}
            >
              Start Your Design Journey
              <ArrowRight className="inline-block ml-2" size={20} />
            </Link>
            
            <button 
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
              className="px-8 py-4 text-lg font-medium rounded-full border-2 transition-all duration-300 transform hover:scale-105"
              style={{
                borderColor: '#D4A574',
                color: '#D4A574',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Play className="inline-block mr-2" size={20} />
              Watch Our Story
            </button>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-light mb-6" style={{ color: '#D4A574' }}>
                Who We Are
              </h3>
              <p className="text-lg leading-relaxed mb-6" style={{ color: '#F5F5DC' }}>
                We are a luxury interior design studio specializing in creating spaces that tell your unique story. 
                With over a decade of experience, we blend timeless elegance with contemporary sophistication.
              </p>
              <p className="text-lg leading-relaxed mb-8" style={{ color: '#F5F5DC' }}>
                Our approach is deeply personal – we believe great design starts with understanding how you live, 
                what you love, and what makes you feel at home.
              </p>
              
              <div className="flex items-center space-x-4">
                <div className="flex">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="w-6 h-6 fill-current" style={{ color: '#D4A574' }} />
                  ))}
                </div>
                <span className="text-lg" style={{ color: '#F5F5DC' }}>5.0 from 200+ clients</span>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Luxury Interior Design"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute inset-0 rounded-lg" style={{ background: 'linear-gradient(45deg, rgba(212,165,116,0.1), transparent)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Design Process Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-4xl font-light mb-12" style={{ color: '#D4A574' }}>
            Our Design Process
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Discovery',
                description: 'We start with an in-depth questionnaire to understand your vision, lifestyle, and preferences.',
                image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
              },
              {
                step: '02', 
                title: 'Design Development',
                description: 'Our team creates a comprehensive design plan tailored specifically to you and your space.',
                image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
              },
              {
                step: '03',
                title: 'Implementation',
                description: 'We manage every detail from procurement to installation, ensuring flawless execution.',
                image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
              }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <img 
                    src={process.image}
                    alt={process.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div 
                    className="absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-lg"
                    style={{ background: '#D4A574' }}
                  >
                    {process.step}
                  </div>
                </div>
                
                <h4 className="text-2xl font-light mb-4" style={{ color: '#D4A574' }}>
                  {process.title}
                </h4>
                <p className="text-lg leading-relaxed" style={{ color: '#F5F5DC' }}>
                  {process.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All in the Details Section */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-light mb-12 text-center" style={{ color: '#D4A574' }}>
            All in the Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Custom Furniture',
                description: 'Bespoke pieces designed specifically for your space',
                image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
              },
              {
                title: 'Luxury Textiles',
                description: 'Premium fabrics and materials sourced globally',
                image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
              },
              {
                title: 'Art Curation',
                description: 'Carefully selected artwork to complete your vision',
                image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
              },
              {
                title: 'Lighting Design',
                description: 'Custom lighting solutions for ambiance and function',
                image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
              },
              {
                title: 'Color Consultation',
                description: 'Perfect color palettes that reflect your personality',
                image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
              },
              {
                title: 'Project Management',
                description: 'Seamless coordination from concept to completion',
                image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
              }
            ].map((detail, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg mb-4">
                  <img 
                    src={detail.image}
                    alt={detail.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 group-hover:bg-opacity-20" />
                </div>
                
                <h4 className="text-xl font-light mb-2" style={{ color: '#D4A574' }}>
                  {detail.title}
                </h4>
                <p className="text-base" style={{ color: '#F5F5DC' }}>
                  {detail.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-black text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl font-light mb-6" style={{ color: '#D4A574' }}>
            Ready to Transform Your Space?
          </h3>
          <p className="text-xl leading-relaxed mb-12" style={{ color: '#F5F5DC' }}>
            Let's begin the journey to create your dream interior. Our comprehensive questionnaire 
            will help us understand your vision and preferences.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/customer/questionnaire"
              className="px-12 py-4 text-xl font-medium rounded-full transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #F5F5DC 50%, #D4A574 100%)',
                color: '#000',
                boxShadow: '0 8px 32px rgba(212, 165, 116, 0.3)'
              }}
            >
              Start Your Design Journey
              <ArrowRight className="inline-block ml-2" size={24} />
            </Link>
            
            <Link 
              to="/contact"
              className="px-12 py-4 text-xl font-medium rounded-full border-2 transition-all duration-300 transform hover:scale-105"
              style={{
                borderColor: '#D4A574',
                color: '#D4A574',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              Schedule Consultation
            </Link>
          </div>
          
          <div className="mt-12 flex justify-center items-center space-x-8">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6" style={{ color: '#D4A574' }} />
              <span style={{ color: '#F5F5DC' }}>Free Consultation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6" style={{ color: '#D4A574' }} />
              <span style={{ color: '#F5F5DC' }}>No Obligation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6" style={{ color: '#D4A574' }} />
              <span style={{ color: '#F5F5DC' }}>Personalized Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isVideoPlaying && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setIsVideoPlaying(false)}>
          <div className="relative w-full max-w-4xl mx-4">
            <button 
              onClick={() => setIsVideoPlaying(false)}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
            >
              ✕
            </button>
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 mx-auto mb-4" style={{ color: '#D4A574' }} />
                <p style={{ color: '#F5F5DC' }}>Video content would be embedded here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLandingPage;