import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { getBookingByToken, cancelBooking } from '../../services/publicService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Calendar, Clock, XCircle, CheckCircle, Loader2 } from 'lucide-react';

const CancelAppointmentPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Lade Buchungsinformationen
  useEffect(() => {
    const fetchBooking = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const data = await getBookingByToken(token);
        setBooking(data);
      } catch (err) {
        setError(err.message || 'Fehler beim Laden der Buchungsinformationen');
        console.error('Fehler beim Laden der Buchungsinformationen:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) {
      fetchBooking();
    } else {
      setError('Ungültiger Stornierungslink');
      setIsLoading(false);
    }
  }, [token]);

  // Termin stornieren
  const handleCancelBooking = async () => {
    setIsCancelling(true);
    setError('');
    
    try {
      await cancelBooking(token);
      setSuccess(true);
      setIsConfirmDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler bei der Stornierung des Termins');
    } finally {
      setIsCancelling(false);
    }
  };

  // Formatiere Datum für die Anzeige
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = parseISO(dateString);
    return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
  };

  // Formatiere Zeit für die Anzeige
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = parseISO(dateString);
    return format(date, 'HH:mm', { locale: de });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Lade Termindetails...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : success ? (
        <>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Termin erfolgreich storniert
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Dein Termin wurde erfolgreich storniert.
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">
                Eine Bestätigung wurde an deine E-Mail-Adresse gesendet.
              </p>
              <div className="flex justify-center mt-6">
                <Button asChild>
                  <Link to="/">Zur Startseite</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : booking ? (
        <>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Termin stornieren
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Hier kannst du deinen gebuchten Termin stornieren.
            </p>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Termindetails</CardTitle>
              <CardDescription>
                Überprüfe die Details deines Termins vor der Stornierung.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Datum</p>
                  <p className="text-gray-600">{formatDate(booking.start)}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Uhrzeit</p>
                  <p className="text-gray-600">
                    {formatTime(booking.start)} - {formatTime(booking.end)}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p>{booking.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">E-Mail</p>
                    <p>{booking.email}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Tattoo-Motiv</p>
                  <p>{booking.tattooMotif}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setIsConfirmDialogOpen(true)}
              >
                Termin stornieren
              </Button>
            </CardFooter>
          </Card>
          
          {/* Dialog zur Bestätigung der Stornierung */}
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Termin wirklich stornieren?</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <p>
                  Bist du sicher, dass du deinen Termin am <strong>{formatDate(booking.start)}</strong> um <strong>{formatTime(booking.start)}</strong> stornieren möchtest?
                </p>
                <p className="text-muted-foreground mt-2">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConfirmDialogOpen(false)}
                  disabled={isCancelling}
                >
                  Abbrechen
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird storniert...
                    </>
                  ) : (
                    'Ja, stornieren'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
};

export default CancelAppointmentPage;

