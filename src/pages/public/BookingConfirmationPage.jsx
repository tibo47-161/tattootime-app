import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { CheckCircle, Calendar, Clock, MapPin, Mail, Phone, ArrowLeft } from 'lucide-react';

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Überprüfe, ob Buchungsdaten in der Location vorhanden sind
    if (location.state?.booking) {
      setBooking(location.state.booking);
      setUserProfile(location.state.userProfile);
    } else {
      setError('Keine Buchungsdaten gefunden. Bitte versuche es erneut.');
    }
  }, [location]);

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
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : booking ? (
        <>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Buchung erfolgreich!
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Dein Termin wurde erfolgreich gebucht.
            </p>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Termindetails</CardTitle>
              <CardDescription>
                Hier findest du alle Informationen zu deinem gebuchten Termin.
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
              
              {userProfile && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Ort</p>
                    <p className="text-gray-600">
                      {userProfile.businessName || userProfile.name}
                    </p>
                    {userProfile.address && (
                      <p className="text-gray-600">{userProfile.address}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-medium mb-2">Deine Angaben</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p>{booking.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">E-Mail</p>
                    <p>{booking.email}</p>
                  </div>
                  
                  {booking.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p>{booking.phone}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Tattoo-Motiv</p>
                  <p>{booking.tattooMotif}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Körperstelle</p>
                    <p>{booking.tattooBodyPart}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Größe</p>
                    <p>{booking.tattooSize}</p>
                  </div>
                </div>
                
                {booking.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Zusätzliche Informationen</p>
                    <p>{booking.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="bg-blue-50 p-4 rounded-md w-full">
                <h3 className="font-medium text-blue-800 mb-2">Wichtige Informationen</h3>
                <p className="text-sm text-blue-700">
                  Eine Bestätigung wurde an deine E-Mail-Adresse gesendet. Bitte überprüfe auch deinen Spam-Ordner.
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Falls du den Termin stornieren oder verschieben möchtest, nutze bitte den Link in der E-Mail.
                </p>
              </div>
            </CardFooter>
          </Card>
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Button
              variant="outline"
              className="mb-4 md:mb-0 flex items-center"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Buchungsseite
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              {userProfile?.email && (
                <a
                  href={`mailto:${userProfile.email}`}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  {userProfile.email}
                </a>
              )}
              
              {userProfile?.phone && (
                <a
                  href={`tel:${userProfile.phone}`}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  {userProfile.phone}
                </a>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Lade Buchungsdetails...</p>
        </div>
      )}
    </div>
  );
};

export default BookingConfirmationPage;

