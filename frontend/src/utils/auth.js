import { toast } from 'react-hot-toast';

export const handleSignOut = (navigate) => {
  const confirmSignOut = window.confirm('Are you sure you want to sign out?');
  
  if (confirmSignOut) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userSettings');
    toast.success('Signed out successfully');
    navigate('/login');
  }
};
