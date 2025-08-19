// Définition des routes principales
import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
  <Route path="/dashboard" element={<UserDashboard />} />
  <Route path="/owner/onboard" element={<OwnerOnboard />} />
  <Route path="/owner/request" element={<OwnerRequest />} />
  <Route path="/owner/subscribe" element={<OwnerSubscribe />} />
  <Route path="/owner/pay" element={<OwnerPay />} />
  <Route path="/owner/dashboard" element={<OwnerDashboard />} />
  <Route path="/owner/properties" element={<OwnerProperties />} />
  <Route path="/owner/agents" element={<OwnerAgents />} />
  <Route path="/owner/appointments" element={<OwnerAppointments />} />
  <Route path="/owner/messages" element={<OwnerMessages />} />
  <Route path="/owner/profile" element={<OwnerProfile />} />
  <Route path="/owner/wallet" element={<OwnerWallet />} />
  <Route path="/owner/security" element={<OwnerSecurity />} />
  <Route path="/owner/settings" element={<OwnerSettings />} />
  <Route path="/owner/privacy" element={<OwnerPrivacy />} />
  {/* agency flows */}
  <Route path="/agency/onboard" element={<AgencyOnboard />} />
  <Route path="/agency/login" element={<AgencyLogin />} />
  <Route path="/agency/dashboard" element={<AgencyDashboard />} />
  <Route path="/agency/ads" element={<AgencyAds />} />
  <Route path="/agency/products" element={<AgencyProducts />} />
  <Route path="/agency/wallet" element={<AgencyWallet />} />
  <Route path="/agency/agents" element={<AgencyAgents />} />
  <Route path="/agency/messages" element={<AgencyMessages />} />
  <Route path="/agency/pay" element={<AgencyPay />} />
  <Route path="/agency/settings" element={<AgencySettings />} />
  <Route path="/agency/security" element={<AgencySecurity />} />
  <Route path="/agency/privacy" element={<AgencyPrivacy />} />
    <Route path="/add-property" element={<AddProperty />} />
    <Route path="/subscriptions" element={<Subscriptions />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
