import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import SignInAuthButton from '@/components/SignInAuthButton';

const LandingPage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      navigate('/home');
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-500 text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Will redirect
  }

  return (
    <div className="h-dvh bg-black text-white flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-black to-purple-600/20"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.svg" 
              alt="DRS Music" 
              className="w-16 h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <img src="/DRS.png" alt="" height={100} width={100}/>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-700 via-blue-600 to-violet-700 bg-clip-text text-transparent">
          DRS Music
        </h1>

        <p className="text-md sm:text-md text-zinc-300 mb-12 max-w-2xl mx-auto">
          Experience the future of music streaming with personalized recommendations, 
          social features, and millions of songs at your fingertips.
        </p>

        {/* CTA Button */}
        <div className="flex justify-center w-full max-w-sm mx-auto">
          <SignInAuthButton />
        </div>

        <div className="text-zinc-400 text-sm mt-4">
          Free forever • Login to Access
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
