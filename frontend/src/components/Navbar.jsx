import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Top navigation for auth and tracker routes.
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Clears auth state and returns users to the login page.
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className='bg-blue-600 text-white p-4 flex justify-between items-center'>
      <Link to='/' className='text-2xl font-bold'>
        Time Tracker
      </Link>
      <div>
        {user ? (
          <>
            {/* Primary authenticated destination for timer and entry management. */}
            <Link to='/tracker' className='mr-4'>
              Tracker
            </Link>
            <Link to='/profile' className='mr-4'>
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className='bg-red-500 px-4 py-2 rounded hover:bg-red-700'
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to='/login' className='mr-4'>
              Login
            </Link>
            <Link
              to='/register'
              className='bg-green-500 px-4 py-2 rounded hover:bg-green-700'
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
