import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import { useAuth } from './context/AuthContext';

// App route map for public and authenticated navigation.
// Authenticated users are directed to the tracker page after login.
function App() {
  // User state is restored by AuthContext and used for route decisions.
  const { user } = useAuth();

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Default route sends authenticated users to tracker and guests to login. */}
        <Route
          path='/'
          element={<Navigate to={user ? '/tracker' : '/login'} replace />}
        />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/profile' element={<Profile />} />
        {/* Temporary tracker target that currently reuses the Tasks page. */}
        <Route path='/tracker' element={<Tasks />} />
        {/* Keep /tasks as an alias so existing links still work during transition. */}
        <Route path='/tasks' element={<Navigate to='/tracker' replace />} />
      </Routes>
    </Router>
  );
}

export default App;
