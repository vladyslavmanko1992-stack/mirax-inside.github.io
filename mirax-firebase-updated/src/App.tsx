import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProjectPage } from './pages/ProjectPage';
import { SubmitProjectPage } from './pages/SubmitProjectPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { RulesPage } from './pages/RulesPage';
import { EditProjectPage } from './pages/EditProjectPage';
import { NotificationsPage } from './pages/NotificationsPage';

export function App() {
  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-200 flex flex-col font-vt323 selection:bg-[#55ff55] selection:text-black">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/rules" element={<RulesPage />} />
          
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/submit" element={<SubmitProjectPage />} />
          <Route path="/edit-project/:id" element={<EditProjectPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          
          <Route path="*" element={<div className="text-center mt-20 text-3xl text-gray-500">404 - Page Not Found</div>} />
        </Routes>
      </main>
      
      <footer className="bg-[#111] border-t-4 border-[#181818] p-6 text-center text-gray-500 font-vt323">
         <div>&copy; {new Date().getFullYear()} MiraX-Inside. Not affiliated with Mojang Studios.</div>
         <div className="mt-2">
           <a href="https://t.me/MiraXsupportbot" target="_blank" rel="noopener noreferrer" className="text-[#55ff55] hover:underline">
             Support: @MiraXsupportbot
           </a>
         </div>
      </footer>
    </div>
  );
}
