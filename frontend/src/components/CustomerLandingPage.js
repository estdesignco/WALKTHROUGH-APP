import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Users, Award, Star } from 'lucide-react';

const CustomerLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
      
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] shadow-2xl flex items-center justify-center px-4 py-2" style={{ height: '150px' }}>
        <img
          src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
          alt="Established Design Co."
          className="w-full h-full object-contain"
          style={{ transform: 'scale(1.8)', maxWidth: '95%', maxHeight: '90%' }}
        />
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
        {/* Hero Content */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-[#B49B7E] tracking-wide mb-6">
            Transform Your Space
          </h1>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-8"></div>
          <p className="text-xl leading-relaxed mb-8" style={{ color: '#F5F5DC', opacity: '0.9' }}>
            Experience luxury interior design that reflects your unique lifestyle and vision
          </p>
          
          <Link
            to="/customer/questionnaire"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-10 py-5 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide"
            style={{ color: '#F5F5DC' }}
          >
            Start Your Project
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>

        {/* Hero Image - Real Portfolio Image */}
        <div className="bg-gradient-to-br from-black/40 to-gray-900/60 rounded-2xl border border-[#B49B7E]/20 p-4 text-center mb-8">
          <img
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/unq2tzy0_5-IMG_2599.jpg"
            alt="Luxury Interior Design by Established Design Co."
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
          <p className="text-lg text-[#F5F5DC]/80">
            Experience Our Award-Winning Design Excellence
          </p>
        </div>
      </div>

      {/* Who We Are Section */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">Who We Are</h2>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-8"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Content */}
          <div className="space-y-6">
            <p className="text-lg leading-relaxed" style={{ color: '#F5F5DC', opacity: '0.9' }}>
              Established Design Co. is a premier interior design studio dedicated to creating 
              exceptional spaces that tell your unique story. With years of experience in luxury 
              residential design, we blend timeless elegance with contemporary functionality.
            </p>
            
            <p className="text-lg leading-relaxed" style={{ color: '#F5F5DC', opacity: '0.9' }}>
              Our comprehensive approach encompasses every detail, from initial concept to final 
              installation, ensuring a seamless experience and stunning results that exceed expectations.
            </p>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#B49B7E]" />
                <span className="text-[#F5F5DC]/80">Personalized Service</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#B49B7E]" />
                <span className="text-[#F5F5DC]/80">Award Winning</span>
              </div>
            </div>
          </div>

          {/* Real Portfolio Image */}
          <div className="bg-gradient-to-br from-black/40 to-gray-900/60 rounded-2xl border border-[#B49B7E]/20 p-4">
            <img
              src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/gtmb5fh5_20-IMG_2441.jpg"
              alt="Established Design Co. Portfolio"
              className="w-full aspect-square object-cover rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">Our Work</h2>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-8"></div>
          <p className="text-lg" style={{ color: '#F5F5DC', opacity: '0.8' }}>
            Discover the transformative power of thoughtful design
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-gradient-to-br from-black/40 to-gray-900/60 rounded-xl border border-[#B49B7E]/20 p-4">
              <div className="aspect-square bg-[#B49B7E]/10 rounded-lg mb-3 flex items-center justify-center">
                <Star className="w-8 h-8 text-[#B49B7E]/50" />
              </div>
              <h3 className="text-[#B49B7E] font-medium mb-2">Project {item}</h3>
              <p className="text-sm text-[#F5F5DC]/70">Luxury residential design showcasing our expertise in creating beautiful, functional spaces.</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            to="/customer/questionnaire"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-lg font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide"
            style={{ color: '#F5F5DC' }}
          >
            Begin Your Journey
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerLandingPage;