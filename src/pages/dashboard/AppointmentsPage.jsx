import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { getCalendarAppointments } from '../../services/appointmentService';
import { getAppointmentTypes } from '../../services/appointmentTypeService';
import { getBlockedTimes } from '../../services/blockedTimeService';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Filter } from 'lucide-react';
import AppointmentDialog from '../../features/calendar/AppointmentDialog';

// Lokalisierung für den Kalender
const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: de }),
  getDay,
  locales,
});

// Deutsche Übersetzungen für den Kalender
const messages = {
  allDay: 'Ganztägig',
  previous: 'Zurück',
  next: 'Weiter',
  today: 'Heute',
  month: 'Monat',
  week: 'Woche',
  day: 'Tag',
  agenda: 'Agenda',
  date: 'Datum',
  time: 'Zeit',
  event: 'Termin',
  noEventsInRange: 'Keine Termine in diesem Zeitraum.',
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isNewAppointment, setIsNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Lade Termine, Termintypen und Sperrzeiten
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Berechne Start- und Enddatum basierend auf der aktuellen Ansicht
        let start, end;
        
        if (view === 'day') {
          start = new Date(date);
          start.setHours(0, 0, 0, 0);
          end = new Date(date);
          end.setHours(23, 59, 59, 999);
        } else if (view === 'week') {
          start = startOfWeek(date, { locale: de });
          end = new Date(start);
          end.setDate(end.getDate() + 7);
        } else if (view === 'month') {
          start = new Date(date.getFullYear(), date.getMonth(), 1);
          end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }
        
        // Lade Daten parallel
        const [appointmentsData, appointmentTypesData, blockedTimesData] = await Promise.all([
          getCalendarAppointments(start.toISOString(), end.toISOString()),
          getAppointmentTypes(),
          getBlockedTimes({ start: start.toISOString(), end: end.toISOString() })
        ]);
        
        // Formatiere Termine für den Kalender
        const formattedAppointments = appointmentsData.map(appointment => ({
          id: appointment._id,
          title: appointment.title,
          start: new Date(appointment.start),
          end: new Date(appointment.end),
          appointmentType: appointment.appointmentType,
          customer: appointment.customer,
          isPrivate: appointment.isPrivate,
          color: appointment.appointmentType?.color || '#3B82F6'
        }));
        
        // Formatiere Sperrzeiten für den Kalender
        const formattedBlockedTimes = blockedTimesData.map(blockedTime => ({
          id: blockedTime._id,
          title: `Gesperrt: ${blockedTime.title}`,
          start: new Date(blockedTime.start),
          end: new Date(blockedTime.end),
          isBlockedTime: true,
          color: '#EF4444'
        }));
        
        setAppointments(formattedAppointments);
        setAppointmentTypes(appointmentTypesData);
        setBlockedTimes(formattedBlockedTimes);
      } catch (err) {
        setError(err.message || 'Fehler beim Laden der Daten');
        console.error('Fehler beim Laden der Kalenderdaten:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [view, date]);

  // Kombiniere Termine und Sperrzeiten für den Kalender
  const events = useMemo(() => {
    return [...appointments, ...blockedTimes];
  }, [appointments, blockedTimes]);

  // Event-Style für den Kalender
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0',
        display: 'block'
      }
    };
  };

  // Termin auswählen
  const handleSelectEvent = (event) => {
    if (event.isBlockedTime) {
      // Hier könnte ein Dialog für Sperrzeiten geöffnet werden
      return;
    }
    
    setSelectedAppointment(event);
    setIsNewAppointment(false);
    setIsDialogOpen(true);
  };

  // Zeitfenster auswählen für neuen Termin
  const handleSelectSlot = ({ start, end }) => {
    setSelectedSlot({ start, end });
    setSelectedAppointment(null);
    setIsNewAppointment(true);
    setIsDialogOpen(true);
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAppointment(null);
    setSelectedSlot(null);
  };

  // Termin speichern (erstellen oder aktualisieren)
  const handleSaveAppointment = async (appointmentData) => {
    // Hier würde die Logik zum Speichern des Termins implementiert werden
    // Nach dem Speichern den Dialog schließen und Daten neu laden
    handleCloseDialog();
    
    // Daten neu laden
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    try {
      const appointmentsData = await getCalendarAppointments(start.toISOString(), end.toISOString());
      
      const formattedAppointments = appointmentsData.map(appointment => ({
        id: appointment._id,
        title: appointment.title,
        start: new Date(appointment.start),
        end: new Date(appointment.end),
        appointmentType: appointment.appointmentType,
        customer: appointment.customer,
        isPrivate: appointment.isPrivate,
        color: appointment.appointmentType?.color || '#3B82F6'
      }));
      
      setAppointments(formattedAppointments);
    } catch (err) {
      setError(err.message || 'Fehler beim Aktualisieren der Termine');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminkalender</h1>
          <p className="text-gray-500">
            Verwalte deine Termine und Sperrzeiten
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button
            size="sm"
            className="flex items-center"
            onClick={() => {
              setSelectedSlot({ start: new Date(), end: new Date(new Date().getTime() + 60 * 60 * 1000) });
              setSelectedAppointment(null);
              setIsNewAppointment(true);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Neuer Termin
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs
            defaultValue={view}
            onValueChange={setView}
            className="w-full"
          >
            <div className="border-b px-4">
              <TabsList className="h-12">
                <TabsTrigger value="month">Monat</TabsTrigger>
                <TabsTrigger value="week">Woche</TabsTrigger>
                <TabsTrigger value="day">Tag</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-[600px]">
                  <p>Kalender wird geladen...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-[600px]">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  messages={messages}
                  defaultView={view}
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable
                  popup
                  culture="de"
                />
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog für Termin erstellen/bearbeiten */}
      {isDialogOpen && (
        <AppointmentDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveAppointment}
          appointment={selectedAppointment}
          isNew={isNewAppointment}
          selectedSlot={selectedSlot}
          appointmentTypes={appointmentTypes}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;

