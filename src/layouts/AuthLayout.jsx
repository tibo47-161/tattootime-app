import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">TattooTime</h2>
          <p className="mt-2 text-sm text-gray-600">
            Dein persönlicher Kalender für Tattoo-Termine und mehr
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;

