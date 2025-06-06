import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">TattooTime</h1>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} TattooTime. Alle Rechte vorbehalten.</p>
            <p className="mt-2">
              Erstellt mit <span className="text-red-500">♥</span> für Tätowierer:innen
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

