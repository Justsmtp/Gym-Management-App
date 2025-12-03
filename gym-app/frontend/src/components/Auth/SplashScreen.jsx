import React, { useState } from 'react';
import { 
  Dumbbell, Users, TrendingUp, Award, ArrowRight, 
  Mail, MapPin, Phone, Clock, Menu, X,
  Facebook, Instagram, Twitter, ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SplashScreen = () => {
  const { setCurrentScreen } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation Header */}
      <nav className=" z-50 bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="1st Impression" className="w-12 h-12 object-contain" />
              <span className="text-white font-black text-xl">1st Impression</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('hero')} className="text-gray-300 hover:text-white transition font-semibold">Home</button>
              <button onClick={() => scrollToSection('about')} className="text-gray-300 hover:text-white transition font-semibold">About</button>
              <button onClick={() => scrollToSection('programs')} className="text-gray-300 hover:text-white transition font-semibold">Programs</button>
              <button onClick={() => scrollToSection('schedule')} className="text-gray-300 hover:text-white transition font-semibold">Schedule</button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-300 hover:text-white transition font-semibold">Contact</button>
              <button
                onClick={() => setCurrentScreen('login')}
                className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition"
              >
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white">
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 animate-fadeIn">
              <button onClick={() => scrollToSection('hero')} className="block w-full text-left text-gray-300 hover:text-white transition py-2 font-semibold">Home</button>
              <button onClick={() => scrollToSection('about')} className="block w-full text-left text-gray-300 hover:text-white transition py-2 font-semibold">About</button>
              <button onClick={() => scrollToSection('programs')} className="block w-full text-left text-gray-300 hover:text-white transition py-2 font-semibold">Programs</button>
              <button onClick={() => scrollToSection('schedule')} className="block w-full text-left text-gray-300 hover:text-white transition py-2 font-semibold">Schedule</button>
              <button onClick={() => scrollToSection('contact')} className="block w-full text-left text-gray-300 hover:text-white transition py-2 font-semibold">Contact</button>
              <button onClick={() => setCurrentScreen('login')} className="w-full bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition">Login</button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding */}
            <div className="text-center md:text-left">
              <div className="mb-8 flex justify-center md:justify-start">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-50 group-hover:opacity-70 transition rounded-full"></div>
                  <img 
                    src="/logo.png" 
                    alt="1st Impression" 
                    className="w-40 h-40 object-contain relative z-10 drop-shadow-2xl animate-float"
                  />
                </div>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-4 leading-tight animate-slideInLeft">
                1st Impression
              </h1>
              <p className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-black mb-6 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                Fitness Center
              </p>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
                Transform your body, elevate your mind, and make your first impression count.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-slideInLeft" style={{ animationDelay: '0.6s' }}>
                <button
                  onClick={() => setCurrentScreen('login')}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  Login
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setCurrentScreen('register')}
                  className="group bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 py-4 px-8 rounded-full font-bold text-lg hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Scroll Indicator */}
              <div className="mt-12 flex justify-center md:justify-start">
                <button onClick={() => scrollToSection('about')} className="text-white/50 hover:text-white transition animate-bounce">
                  <ChevronDown size={32} />
                </button>
              </div>
            </div>

            {/* Right Side - Features */}
            <div className="grid grid-cols-2 gap-4 animate-slideInRight">
              <FeatureCard 
                icon={<Dumbbell size={32} />}
                title="Modern Equipment"
                description="State-of-the-art fitness gear"
                delay="0s"
              />
              <FeatureCard 
                icon={<Users size={32} />}
                title="Expert Trainers"
                description="Professional guidance"
                delay="0.1s"
              />
              <FeatureCard 
                icon={<TrendingUp size={32} />}
                title="Track Progress"
                description="Monitor your journey"
                delay="0.2s"
              />
              <FeatureCard 
                icon={<Award size={32} />}
                title="Proven Results"
                description="Achieve your goals"
                delay="0.3s"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="relative z-10 bg-black/70 backdrop-blur-2xl border-y border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem number="500+" label="Active Members" />
            <StatItem number="24/7" label="Access" />
            <StatItem number="15+" label="Trainers" />
            <StatItem number="4.9★" label="Rating" />
          </div>
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition"></div>
              <img 
                src="/GymImg.jpeg" 
                alt="Gym Interior" 
                className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover border-2 border-white/10"
              />
            </div>
            <div>
              <h2 className="text-5xl font-black text-white mb-6">About 1st Impression Gym</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Located at Arogun Junction, Mowe-Ofada Road, Ogun State, 1st Impression Gym is dedicated to helping you achieve your fitness goals through expert training, supportive community, and personalized programs.
              </p>
              <p className="text-gray-400 leading-relaxed mb-8">
                Our state-of-the-art facility features cutting-edge equipment, professional trainers, and a diverse range of programs designed for all fitness levels. Whether you're a beginner or a seasoned athlete, we're here to guide you on your fitness journey.
              </p>
              <div className="space-y-4">
                <ContactItem icon={<Mail size={20} />} label="Email" value="stimpressionfitnesscenter@gmail.com" />
                <ContactItem icon={<MapPin size={20} />} label="Address" value="Arogun Junction, Mowe Ofada Road, Ogun State" />
                <ContactItem icon={<Phone size={20} />} label="Phone" value="+2347043383975" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="relative z-10 py-32 bg-black/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-4">Our Programs & Membership</h2>
            <p className="text-gray-400 text-lg">Discover a variety of training programs designed to keep you motivated</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProgramCard title="Strength Training" description="Build power and endurance with comprehensive strength programs" gradient="from-red-500 to-orange-500" />
            <ProgramCard title="Yoga & Core" description="Improve balance and flexibility with guided yoga sessions" gradient="from-green-500 to-teal-500" />
            <ProgramCard title="Tabata Thursdays" description="High-intensity interval workouts every Thursday!" gradient="from-purple-500 to-pink-500" />
            <ProgramCard title="Dance Class" description="Fun and energetic movement sessions" gradient="from-blue-500 to-cyan-500" />
          </div>
          <div className="mt-12 text-center">
            <p className="text-white text-xl font-bold mb-4">Open Every Day — Walk In Anytime for Enquiries! 🏋️‍♀️</p>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-4">Weekly Activity Timetable</h2>
            <p className="text-gray-400 text-lg">Join us for structured sessions designed to maximize your results</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <ScheduleCard 
              title="Morning Sessions" 
              time="8:30am – 9:30am"
              schedule={[
                { day: 'Monday', activity: 'Aerobic & Core' },
                { day: 'Tuesday', activity: 'Tabata & Yoga' },
                { day: 'Wednesday', activity: 'Leg Day & Core' },
                { day: 'Thursday', activity: 'Dance Class' },
                { day: 'Friday', activity: 'Tabata' },
                { day: 'Saturday', activity: 'Aerobic' },
              ]}
            />
            <ScheduleCard 
              title="Evening Sessions" 
              time="6:30pm – 7:30pm"
              schedule={[
                { day: 'Monday', activity: 'Circuit Training' },
                { day: 'Tuesday', activity: 'Aerobic' },
                { day: 'Wednesday', activity: 'Aerobic Core' },
                { day: 'Thursday', activity: 'Full Body' },
                { day: 'Friday', activity: 'Strength Training' },
                { day: 'Saturday', activity: 'Aerobic' },
              ]}
            />
          </div>
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/20 rounded-2xl p-8 inline-block">
              <p className="text-white text-2xl font-black mb-2">🚶 Special Monthly Event</p>
              <p className="text-gray-300 text-lg">Every Last Saturday — Road Walk</p>
              <p className="text-purple-400 text-xl font-bold mt-2">7:30am – 8:30am</p>
            </div>
          </div>
        </div>
      </section>

      {/* Opening Hours */}
      <section id="hours" className="relative z-10 py-32 bg-black/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-4">We're Open Every Day!</h2>
            <p className="text-gray-400 text-lg">Visit us during our convenient operating hours</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <HoursCard days="Monday – Saturday" hours="6:30am – 8:30pm" gradient="from-purple-600 to-pink-600" />
            <HoursCard days="Sunday" hours="12:00pm – 7:00pm" gradient="from-blue-600 to-cyan-600" />
          </div>
          <div className="mt-12 text-center">
            <p className="text-white text-xl">Walk in Anytime for Enquiries or Trial Sessions</p>
            <button onClick={() => setCurrentScreen('register')} className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-full font-black text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
              Contact Us Today
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative z-10 bg-black/90 border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-white font-black text-2xl mb-4">1st Impression Gym</h3>
              <p className="text-gray-400 mb-6">Your journey to a healthier, stronger you starts here.</p>
              <div className="flex gap-4">
                <SocialIcon icon={<Facebook size={20} />} />
                <SocialIcon icon={<Instagram size={20} />} />
                <SocialIcon icon={<Twitter size={20} />} />
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Quick Links</h4>
              <div className="space-y-2">
                <button onClick={() => scrollToSection('hero')} className="block text-gray-400 hover:text-white transition">Home</button>
                <button onClick={() => scrollToSection('about')} className="block text-gray-400 hover:text-white transition">About</button>
                <button onClick={() => scrollToSection('programs')} className="block text-gray-400 hover:text-white transition">Programs</button>
                <button onClick={() => scrollToSection('schedule')} className="block text-gray-400 hover:text-white transition">Schedule</button>
                <button onClick={() => scrollToSection('contact')} className="block text-gray-400 hover:text-white transition">Contact</button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Contact Us</h4>
              <div className="space-y-3 text-gray-400">
                <p className="flex items-start gap-2"><MapPin size={20} className="flex-shrink-0 mt-1" /> Arogun Junction, Mowe Ofada Road, Ogun State</p>
                <p className="flex items-center gap-2"><Phone size={20} /> +2347043383975</p>
                <p className="flex items-center gap-2"><Mail size={20} /> stimpressionfitnesscenter@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-500">© 2025 1st Impression Gym. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Components
const FeatureCard = ({ icon, title, description, delay }) => (
  <div className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-gradient-to-br hover:from-purple-600/20 hover:to-pink-600/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20" style={{ animationDelay: delay }}>
    <div className="text-white mb-3 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

const StatItem = ({ number, label }) => (
  <div className="group cursor-default">
    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 group-hover:scale-110 transition-transform">
      {number}
    </p>
    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
      {label}
    </p>
  </div>
);

const ContactItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 text-gray-300">
    <div className="text-purple-400 mt-1">{icon}</div>
    <div>
      <p className="text-white font-bold text-sm mb-1">{label}</p>
      <p className="text-gray-400">{value}</p>
    </div>
  </div>
);

const ProgramCard = ({ title, description, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group`}>
    <h3 className="text-white font-black text-xl mb-3">{title}</h3>
    <p className="text-white/90 text-sm">{description}</p>
    <div className="mt-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
      <ArrowRight size={24} />
    </div>
  </div>
);

const ScheduleCard = ({ title, time, schedule }) => (
  <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
    <h3 className="text-white font-black text-2xl mb-2">{title}</h3>
    <p className="text-purple-400 font-bold mb-6">{time}</p>
    <div className="space-y-3">
      {schedule.map((item, i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b border-white/10">
          <span className="text-white font-semibold">{item.day}</span>
          <span className="text-gray-400">{item.activity}</span>
        </div>
      ))}
    </div>
  </div>
);

const HoursCard = ({ days, hours, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} p-8 rounded-2xl shadow-2xl text-center`}>
    <Clock size={48} className="mx-auto mb-4 text-white" />
    <h3 className="text-white font-black text-2xl mb-2">{days}</h3>
    <p className="text-white text-3xl font-bold">{hours}</p>
  </div>
);

const SocialIcon = ({ icon }) => (
  <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
    {icon}
  </button>
);

export default SplashScreen;