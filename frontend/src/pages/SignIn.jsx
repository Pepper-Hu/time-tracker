import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

// Sign In page for authenticating users and storing auth via AuthContext.
// After a successful sign in, users are sent to the tracker landing page.
const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Authenticate against backend auth endpoint.
      const response = await axiosInstance.post('/api/auth/login', formData);
      if (!response?.data?.token) {
        throw new Error('Invalid auth response');
      }
      // Persist user/token through AuthContext.
      login(response.data);
      // Route to the dedicated authenticated landing page.
      navigate('/tracker');
    } catch (error) {
      setError('Sign in failed. Please check API deployment and try again.');
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          {/* App icon */}
          <div className='inline-flex justify-center items-center w-16 h-16 bg-blue-600 rounded-full mb-4'>
            <svg
              className='w-8 h-8 text-white'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
            </svg>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Time Tracker
          </h1>
          <p className='text-gray-600'>Sign in to manage your work</p>
        </div>

        {/* Sign In form */}
        <form
          onSubmit={handleSubmit}
          className='bg-white p-8 rounded-lg shadow'
        >
          {/* Email field */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email
            </label>
            <input
              type='email'
              placeholder='you@example.com'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white'
              required
            />
          </div>

          {/* Password field */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Password
            </label>
            <input
              type='password'
              placeholder='••••••••'
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white'
              required
            />
          </div>

          {/* Error message */}
          {error && <div className='mb-4 text-sm text-red-600'>{error}</div>}

          {/* Sign In button */}
          <button
            type='submit'
            className='w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition mb-4'
          >
            Sign In
          </button>

          {/* Sign up link */}
          <div className='text-center'>
            <span className='text-gray-600'>Don't have an account? </span>
            <Link to='/register' className='text-blue-600 hover:underline'>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
