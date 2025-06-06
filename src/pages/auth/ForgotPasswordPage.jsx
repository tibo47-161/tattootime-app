import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/authService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Fehler beim Zurücksetzen des Passworts. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
          Passwort zurücksetzen
        </h2>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success ? (
          <div className="space-y-6">
            <Alert className="mb-6 border-green-500 bg-green-50">
              <CheckCircledIcon className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Eine E-Mail mit Anweisungen zum Zurücksetzen deines Passworts wurde an {email} gesendet.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                Zurück zur Anmeldung
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Wird gesendet...' : 'Link senden'}
              </Button>
            </div>
            
            <div className="text-center">
              <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                Zurück zur Anmeldung
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

