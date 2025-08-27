// Définition des routes principales
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import PropertyDetails from './pages/PropertyDetails';
import Agents from './pages/Agents';
import AgentDetails from './pages/AgentDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AddProperty from './pages/AddProperty';
import Subscriptions from './pages/Subscriptions';
import Voitures from './pages/Voitures';
import Terrain from './pages/Terrain';
import Appartement from './pages/Appartement';
import SalleFete from './pages/SalleFete';
import NotFound from './pages/NotFound';
import AuthCallback from './pages/AuthCallback';
import About from './pages/About';
import Contact from './pages/Contact';
import OwnerOnboard from './pages/OwnerOnboard';
import OwnerRequest from './pages/OwnerRequest';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerProperties from './pages/OwnerProperties';
import OwnerMessages from './pages/OwnerMessages';
import OwnerWallet from './pages/OwnerWallet';
import OwnerSubscribe from './pages/OwnerSubscribe';
import OwnerPay from './pages/OwnerPay';
import OwnerAgents from './pages/OwnerAgents';
import OwnerAppointments from './pages/OwnerAppointments';
import OwnerPrivacy from './pages/OwnerPrivacy';
import OwnerProfile from './pages/OwnerProfile';
import OwnerSecurity from './pages/OwnerSecurity';
import OwnerSettings from './pages/OwnerSettings';
import AgencyOnboard from './pages/AgencyOnboard';
import AgencyLogin from './pages/AgencyLogin';
import AgencyDashboard from './pages/AgencyDashboard';
import AgencyAds from './pages/AgencyAds';
import AgencyProducts from './pages/AgencyProducts';
import AgencyWallet from './pages/AgencyWallet';
import AgencySettings from './pages/AgencySettings';
import AgencySecurity from './pages/AgencySecurity';
import AgencyPrivacy from './pages/AgencyPrivacy';
import AgencyAgents from './pages/AgencyAgents';
import AgencyMessages from './pages/AgencyMessages';
import AgencyPay from './pages/AgencyPay';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/voitures" element={<Voitures />} />
  <Route path="/terrain" element={<Terrain />} />
  <Route path="/appartement" element={<Appartement />} />
  <Route path="/salle" element={<SalleFete />} />
    <Route path="/properties/:id" element={<PropertyDetails />} />
    <Route path="/agents" element={<Agents />} />
    <Route path="/agents/:id" element={<AgentDetails />} />
    <Route path="/login" element={<Login />} />
  <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/register" element={<Register />} />
  <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
  <Route path="/owner/onboard" element={<OwnerOnboard />} />
  <Route path="/owner/request" element={<OwnerRequest />} />
  <Route path="/owner/subscribe" element={<PrivateRoute><OwnerSubscribe /></PrivateRoute>} />
  <Route path="/owner/pay" element={<PrivateRoute><OwnerPay /></PrivateRoute>} />
  <Route path="/owner/dashboard" element={<PrivateRoute><OwnerDashboard /></PrivateRoute>} />
  <Route path="/owner/properties" element={<PrivateRoute><OwnerProperties /></PrivateRoute>} />
  <Route path="/owner/agents" element={<PrivateRoute><OwnerAgents /></PrivateRoute>} />
  <Route path="/owner/appointments" element={<PrivateRoute><OwnerAppointments /></PrivateRoute>} />
  <Route path="/owner/messages" element={<PrivateRoute><OwnerMessages /></PrivateRoute>} />
  <Route path="/owner/profile" element={<PrivateRoute><OwnerProfile /></PrivateRoute>} />
  <Route path="/owner/wallet" element={<PrivateRoute><OwnerWallet /></PrivateRoute>} />
  <Route path="/owner/security" element={<PrivateRoute><OwnerSecurity /></PrivateRoute>} />
  <Route path="/owner/settings" element={<PrivateRoute><OwnerSettings /></PrivateRoute>} />
  <Route path="/owner/privacy" element={<PrivateRoute><OwnerPrivacy /></PrivateRoute>} />
  {/* agency flows */}
  <Route path="/agency/onboard" element={<AgencyOnboard />} />
  <Route path="/agency/login" element={<AgencyLogin />} />
  <Route path="/agency/dashboard" element={<PrivateRoute><AgencyDashboard /></PrivateRoute>} />
  <Route path="/agency/ads" element={<PrivateRoute><AgencyAds /></PrivateRoute>} />
  <Route path="/agency/products" element={<PrivateRoute><AgencyProducts /></PrivateRoute>} />
  <Route path="/agency/wallet" element={<PrivateRoute><AgencyWallet /></PrivateRoute>} />
  <Route path="/agency/agents" element={<PrivateRoute><AgencyAgents /></PrivateRoute>} />
  <Route path="/agency/messages" element={<PrivateRoute><AgencyMessages /></PrivateRoute>} />
  <Route path="/agency/pay" element={<PrivateRoute><AgencyPay /></PrivateRoute>} />
  <Route path="/agency/settings" element={<PrivateRoute><AgencySettings /></PrivateRoute>} />
  <Route path="/agency/security" element={<PrivateRoute><AgencySecurity /></PrivateRoute>} />
  <Route path="/agency/privacy" element={<PrivateRoute><AgencyPrivacy /></PrivateRoute>} />
  <Route path="/add-property" element={<PrivateRoute><AddProperty /></PrivateRoute>} />
  <Route path="/subscriptions" element={<PrivateRoute><Subscriptions /></PrivateRoute>} />
  <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
