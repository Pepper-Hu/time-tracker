import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Top navigation for auth and tracker routes.
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Clears auth state and returns users to the sign in page.
  const handleSignOut = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  // Navigate to profile and close dropdown.
  const handleProfileClick = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  return (
    <nav className='bg-blue-600 text-white p-4 flex justify-between items-center'>
      <Link to='/' className='text-2xl font-bold'>
        Time Tracker
      </Link>
      <div>
        {user ? (
          <div className='relative' ref={dropdownRef}>
            {/* User name with dropdown trigger */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className='px-4 py-2 rounded hover:bg-blue-700 transition'
            >
              {user.name} ▼
            </button>
            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className='absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-50'>
                <button
                  onClick={handleProfileClick}
                  className='w-full text-left px-4 py-2 hover:bg-gray-100 border-b'
                >
                  Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className='w-full text-left px-4 py-2 hover:bg-red-50 text-red-600'
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to='/login' className='mr-4'>
              Sign In
            </Link>
            <Link
              to='/register'
              className='bg-green-500 px-4 py-2 rounded hover:bg-green-700'
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
