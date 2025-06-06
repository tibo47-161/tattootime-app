import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { CalendarIcon, Clock } from 'lucide-react';

import { getCustomers } from '../../services/customerService';
import { createAppointment, updateAppointment } from '../../services/appointmentService';

const AppointmentDialog = ({
  isOpen,
  onClose,
  onSave,
  appointment,
  isNew,
  selectedSlot,
  appointmentTypes
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tattooDetails, setTattooDetails] = useState({
    motif: '',
    bodyPart: '',
    size: ''
  });
  
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Lade Kunden
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersData = await getCustomers();
        setCustomers(customersData);
      } catch (err) {
        console.error('Fehler beim Laden der Kunden:', err);
      }
    };
    
    fetchCustomers();
  }, []);
  
  // Setze Formularwerte basierend auf dem ausgewählten Termin oder Zeitfenster
  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title || '');
      setDate(appointment.start || new Date());
      setStartTime(format(appointment.start || new Date(), 'HH:mm'));
      setEndTime(format(appointment.end || new Date(), 'HH:mm'));
      setAppointmentTypeId(appointment.appointmentType?._id || '');
      setCustomerId(appointment.customer?._id || '');
      setNotes(appointment.notes || '');
      setIsPrivate(appointment.isPrivate || false);
      setTattooDetails(appointment.tattooDetails || {
        motif: '',
        bodyPart: '',
        size: ''
      });
    } else if (selectedSlot) {
      setDate(selectedSlot.start || new Date());
      setStartTime(format(selectedSlot.start || new Date(), 'HH:mm'));
      setEndTime(format(selectedSlot.end || new Date(), 'HH:mm'));
    }
  }, [appointment, selectedSlot]);
  
  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Erstelle Start- und Endzeit-Objekte
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(endHour, endMinute, 0, 0);
      
      // Validiere Zeiten
      if (startDate >= endDate) {
        setError('Die Endzeit muss nach der Startzeit liegen.');
        setIsLoading(false);
        return;
      }
      
      const appointmentData = {
        title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        appointmentType: appointmentTypeId || undefined,
        customer: customerId || undefined,
        notes,
        isPrivate,
        tattooDetails
      };
      
      if (isNew) {
        await createAppointment(appointmentData);
      } else if (appointment) {
        await updateAppointment(appointment.id, appointmentData);
      }
      
      onSave(appointmentData);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern des Termins');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Neuen Termin erstellen' : 'Termin bearbeiten'}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Terminbezeichnung"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: de }) : 'Datum wählen'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointmentType">Terminart</Label>
              <Select
                value={appointmentTypeId}
                onValueChange={setAppointmentTypeId}
              >
                <SelectTrigger id="appointmentType">
                  <SelectValue placeholder="Terminart wählen" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type._id} value={type._id}>
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: type.color }}
                        ></div>
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Startzeit</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">Endzeit</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer">Kunde</Label>
            <Select
              value={customerId}
              onValueChange={setCustomerId}
            >
              <SelectTrigger id="customer">
                <SelectValue placeholder="Kunde wählen" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen zum Termin"
              rows={3}
            />
          </div>
          
          <div className="space-y-4">
            <Label>Tattoo-Details</Label>
            
            <div className="space-y-2">
              <Label htmlFor="motif">Motiv</Label>
              <Input
                id="motif"
                value={tattooDetails.motif}
                onChange={(e) => setTattooDetails({ ...tattooDetails, motif: e.target.value })}
                placeholder="Beschreibung des Motivs"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bodyPart">Körperstelle</Label>
                <Input
                  id="bodyPart"
                  value={tattooDetails.bodyPart}
                  onChange={(e) => setTattooDetails({ ...tattooDetails, bodyPart: e.target.value })}
                  placeholder="z.B. Arm, Rücken"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size">Größe</Label>
                <Input
                  id="size"
                  value={tattooDetails.size}
                  onChange={(e) => setTattooDetails({ ...tattooDetails, size: e.target.value })}
                  placeholder="z.B. 10x15 cm"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPrivate"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="isPrivate">Privater Termin (nicht öffentlich sichtbar)</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Wird gespeichert...' : isNew ? 'Termin erstellen' : 'Termin speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;

