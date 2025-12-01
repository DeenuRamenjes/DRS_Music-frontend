import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-500 text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
