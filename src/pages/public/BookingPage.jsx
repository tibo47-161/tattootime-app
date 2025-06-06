import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  getAvailableSlots, 
  getUserPublicProfile,
  createBooking
} from '../../services/publicService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const BookingPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tattooMotif: '',
    tattooBodyPart: '',
    tattooSize: '',
    notes: ''
  });

  // Lade Benutzerprofil und verfügbare Zeitfenster
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Lade Benutzerprofil
        const profile = await getUserPublicProfile(userId);
        setUserProfile(profile);
        
        // Lade verfügbare Zeitfenster für die aktuelle Woche
        await fetchAvailableSlots(currentWeekStart);
      } catch (err) {
        setError(err.message || 'Fehler beim Laden der Buchungsseite');
        console.error('Fehler beim Laden der Buchungsseite:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId, currentWeekStart]);

  // Lade verfügbare Zeitfenster für eine bestimmte Woche
  const fetchAvailableSlots = async (weekStart) => {
    try {
      const endDate = addDays(weekStart, 6);
      
      const slots = await getAvailableSlots(userId, {
        start: weekStart.toISOString(),
        end: endDate.toISOString()
      });
      
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Fehler beim Laden der verfügbaren Zeitfenster:', err);
      setError('Die verfügbaren Zeitfenster konnten nicht geladen werden.');
    }
  };

  // Zur vorherigen Woche wechseln
  const goToPreviousWeek = () => {
    const newWeekStart = addDays(currentWeekStart, -7);
    setCurrentWeekStart(newWeekStart);
  };

  // Zur nächsten Woche wechseln
  const goToNextWeek = () => {
    const newWeekStart = addDays(currentWeekStart, 7);
    setCurrentWeekStart(newWeekStart);
  };

  // Zeitfenster auswählen
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setSelectedDate(parseISO(slot.start));
    setIsBookingDialogOpen(true);
  };

  // Buchung absenden
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (!selectedSlot) {
        throw new Error('Bitte wähle ein Zeitfenster aus.');
      }
      
      const bookingData = {
        ...formData,
        slotId: selectedSlot.id,
        start: selectedSlot.start,
        end: selectedSlot.end,
        userId
      };
      
      const booking = await createBooking(bookingData);
      
      // Weiterleitung zur Bestätigungsseite
      navigate('/booking-confirmation', { 
        state: { 
          booking,
          userProfile
        } 
      });
    } catch (err) {
      setError(err.message || 'Fehler bei der Buchung');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generiere Wochentage für die aktuelle Woche
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      date,
      dayName: format(date, 'EEEE', { locale: de }),
      dayNumber: format(date, 'd', { locale: de }),
      month: format(date, 'MMMM', { locale: de }),
      isToday: isSameDay(date, new Date()),
      slots: availableSlots.filter(slot => isSameDay(parseISO(slot.start), date))
    };
  });

  // Formatiere Zeit für die Anzeige
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = parseISO(dateString);
    return format(date, 'HH:mm', { locale: de });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Lade Buchungsseite...</p>
        </div>
      ) : (
        <>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {userProfile?.businessName || 'Terminbuchung'}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Buche deinen Termin bei {userProfile?.name || 'uns'}
            </p>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Verfügbare Termine</CardTitle>
                  <CardDescription>
                    Wähle einen freien Termin aus dem Kalender
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousWeek}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(currentWeekStart, 'dd.MM.', { locale: de })} - {format(addDays(currentWeekStart, 6), 'dd.MM.yyyy', { locale: de })}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextWeek}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className={`p-3 rounded-lg border ${
                      day.isToday ? 'border-primary' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <p className="text-sm font-medium text-gray-500">
                        {day.dayName}
                      </p>
                      <p className={`text-lg font-bold ${day.isToday ? 'text-primary' : 'text-gray-900'}`}>
                        {day.dayNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {day.month}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {day.slots.length === 0 ? (
                        <p className="text-center text-xs text-gray-500 py-2">
                          Keine freien Termine
                        </p>
                      ) : (
                        day.slots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center justify-center"
                            onClick={() => handleSelectSlot(slot)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </Button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Dialog für die Terminbuchung */}
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Termin buchen</DialogTitle>
              </DialogHeader>
              
              {selectedSlot && (
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-primary mr-2" />
                      <span className="font-medium">
                        {format(parseISO(selectedSlot.start), 'EEEE, d. MMMM yyyy', { locale: de })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-primary mr-2" />
                      <span>
                        {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Dein vollständiger Name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Deine E-Mail-Adresse"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Deine Telefonnummer (optional)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tattooMotif">Tattoo-Motiv *</Label>
                    <Textarea
                      id="tattooMotif"
                      value={formData.tattooMotif}
                      onChange={(e) => setFormData({ ...formData, tattooMotif: e.target.value })}
                      placeholder="Beschreibe dein gewünschtes Tattoo-Motiv"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tattooBodyPart">Körperstelle *</Label>
                      <Input
                        id="tattooBodyPart"
                        value={formData.tattooBodyPart}
                        onChange={(e) => setFormData({ ...formData, tattooBodyPart: e.target.value })}
                        placeholder="z.B. Arm, Rücken, Bein"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tattooSize">Größe *</Label>
                      <Input
                        id="tattooSize"
                        value={formData.tattooSize}
                        onChange={(e) => setFormData({ ...formData, tattooSize: e.target.value })}
                        placeholder="z.B. 10x15 cm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Zusätzliche Informationen</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Weitere Informationen oder Fragen"
                      rows={3}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Wird gebucht...' : 'Termin buchen'}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default BookingPage;

