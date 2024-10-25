import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Calendar, Wifi, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/Logo';

const ListItem = ({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) => (
  <li className="flex items-center text-gray-300">
    {icon || <Zap className="h-5 w-5 text-[#34C759] mr-2 flex-shrink-0" />}
    {children}
  </li>
);

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F1A] relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20">
          <div className="text-center max-w-3xl mx-auto fade-in">
            <div className="flex justify-center items-center mb-12">
              <div className="transform scale-125">
                <Logo />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Sync Your Space with
              <span className="block">F1 Race Flags</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Transform your room into a dynamic F1 experience. Race RGB connects your LIFX smart lights
              to live F1 race broadcasts, bringing the track atmosphere home.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base 
                         font-medium rounded-lg text-black bg-white hover:bg-neutral-100 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 border border-white/10 text-base 
                         font-medium rounded-lg text-white hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 bg-[#0D1119]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <div className="text-[#34C759]">🏁</div>,
                title: "Real-Time Flag Sync",
                description: "Instant synchronization with live F1 race flags through the OpenF1 API"
              },
              {
                icon: <div className="text-[#007AFF]">💡</div>,
                title: "LIFX Integration",
                description: "Seamless connection with your LIFX smart lights for immersive racing"
              },
              {
                icon: <div className="text-[#FF3B30]">📅</div>,
                title: "Race Schedule",
                description: "Never miss a session with our integrated F1 calendar and notifications"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group fade-in" style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="flex justify-center mb-4 transform transition-transform group-hover:scale-110 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing section */}
      <div className="py-24 bg-[#151A2D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">Start with a free race weekend, then unlock lifetime access.</p>
          </div>

          <div className="max-w-lg mx-auto bg-[#1A1F35] rounded-xl overflow-hidden fade-in">
            <div className="px-6 py-8">
              <h3 className="text-2xl font-bold text-white mb-4">Lifetime Access</h3>
              <p className="text-4xl font-bold text-white mb-6">
                $7 <span className="text-lg text-gray-400">USD</span>
              </p>
              
              {/* Core Features */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Core Features</h4>
                <ul className="space-y-3">
                  <ListItem>Unlimited race weekends</ListItem>
                  <ListItem>Real-time flag synchronization</ListItem>
                  <ListItem>Full LIFX integration</ListItem>
                  <ListItem>Race calendar access</ListItem>
                </ul>
              </div>

              {/* Advanced Features */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Advanced Features</h4>
                <ul className="space-y-3">
                  <ListItem>Live F1 session data</ListItem>
                  <ListItem>Broadcast delay synchronization</ListItem>
                  <ListItem>Custom light effects for each flag type</ListItem>
                  <ListItem>Multiple room configuration</ListItem>
                </ul>
              </div>

              {/* Coming Soon */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Coming Soon</h4>
                <ul className="space-y-3">
                  <ListItem icon={<Lock className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />}>
                    Philips Hue integration
                  </ListItem>
                  <ListItem icon={<Lock className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />}>
                    Nanoleaf integration
                  </ListItem>
                  <ListItem icon={<Lock className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />}>
                    Custom animation editor
                  </ListItem>
                </ul>
              </div>

              <a
                href="https://www.paypal.com/ncp/payment/ULSN3LZGJUHPQ"
                className="block w-full bg-white text-black text-center px-6 py-3 rounded-lg 
                         hover:bg-neutral-100 transition-colors font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Lifetime Access
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;