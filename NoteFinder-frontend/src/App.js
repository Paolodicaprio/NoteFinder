import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ServerError from './components/ServerError';
import ErrorBoundary from './components/ErrorBoundary';

// Pages Utilisateurs
import LoginPage from '../src/pages/UsersPages/LoginPage';
import DashboardPage from '../src/pages/UsersPages/DashboardPage';
import GradesPage from '../src/pages/UsersPages/GradesPage';
import Home from '../src/pages/UsersPages/Home';
import ProfilPage from '../src/pages/UsersPages/ProfilPage';

// Pages Admin
import Annees from '../src/pages/AdminPages/Annees';
import Dashboard from '../src/pages/AdminPages/Dashboard';
import Enseignants from '../src/pages/AdminPages/Enseignants';
import Etudiants from '../src/pages/AdminPages/Etudiants';
import Filieres from '../src/pages/AdminPages/Filieres';
import Login from '../src/pages/AdminPages/Login';
import Notes from '../src/pages/AdminPages/Notes';
import Offres from '../src/pages/AdminPages/Offres';
import Parcours from '../src/pages/AdminPages/Parcours';
import Users from '../src/pages/AdminPages/Users';
// import Register from '../src/pages/AdminPages/Register';
import ResultPage from './pages/AdminPages/ResultPage';


function App() {
  return (
    <Router>
      <ErrorBoundary>
      <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      <Routes>
      <Route path="/server-error" element={<ServerError />} />


      // Pages Utilisateurs
      <Route path="/" element={<Home />} />
        <Route path="/log" element={<LoginPage />} />
        <Route path="/dash" element={<DashboardPage />} />
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/profil" element={<ProfilPage />} />

        // Pages Admin
        <Route path="/annees" element={<Annees />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/enseignants" element={<Enseignants />} />
        <Route path="/etudiants" element={<Etudiants />} />
        <Route path="/filieres" element={<Filieres />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/offres" element={<Offres />} />
        <Route path="/parcours" element={<Parcours />} />
        <Route path="/users" element={<Users />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/result" element={<ResultPage />} />
      </Routes>
      </ErrorBoundary>
    </Router>
  );
}
export default App