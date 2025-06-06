import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Clock, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Diese Funktionen würden normalerweise aus den entsprechenden Services importiert
const fetchTodaysAppointments = async () => {
  // Platzhalter für API-Aufruf
  return [
    { id: 1, title: 'Tattoo: Max Mustermann', start: '10:00', end: '12:00' },
    { id: 2, title: 'Beratung: Lisa Schmidt', start: '14:00', end: '15:00' }
  ];
};

const fetchUpcomingAppointments = async () => {
  // Platzhalter für API-Aufruf
  return [
    { id: 3, title: 'Tattoo: Anna Müller', date: 'Morgen', start: '11:00', end: '14:00' },
    { id: 4, title: 'Nachstechen: Tim Meier', date: 'Übermorgen', start: '16:00', end: '17:00' }
  ];
};

const fetchCustomerCount = async () => {
  // Platzhalter für API-Aufruf
  return 42;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // In einer echten Anwendung würden diese Aufrufe parallel mit Promise.all erfolgen
        const todaysData = await fetchTodaysAppointments();
        const upcomingData = await fetchUpcomingAppointments();
        const customerData = await fetchCustomerCount();

        setTodaysAppointments(todaysData);
        setUpcomingAppointments(upcomingData);
        setCustomerCount(customerData);
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Aktuelle Uhrzeit und Datum
  const now = new Date();
  const formattedDate = now.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Willkommen zurück, {user?.name}!
          </p>
        </div>
        <div className="mt-2 md:mt-0 text-right">
          <p className="text-sm text-gray-500">{formattedDate}</p>
          <p className="text-lg font-semibold">{formattedTime} Uhr</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Heutige Termine</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaysAppointments.length === 0 ? 'Keine Termine für heute' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kunden</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nächster Termin</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todaysAppointments.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{todaysAppointments[0].start} Uhr</div>
                <p className="text-xs text-muted-foreground">{todaysAppointments[0].title}</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Keine Termine heute</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Heutige Termine</CardTitle>
            <CardDescription>
              Deine Termine für heute, {formattedDate.split(',')[0]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4 text-gray-500">Termine werden geladen...</p>
            ) : todaysAppointments.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Keine Termine für heute</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{appointment.title}</p>
                      <p className="text-sm text-gray-500">
                        {appointment.start} - {appointment.end} Uhr
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/appointments/${appointment.id}`}>Details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Button asChild>
                <Link to="/appointments">Alle Termine anzeigen</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Kommende Termine</CardTitle>
            <CardDescription>
              Deine nächsten anstehenden Termine
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4 text-gray-500">Termine werden geladen...</p>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Keine kommenden Termine</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{appointment.title}</p>
                      <p className="text-sm text-gray-500">
                        {appointment.date}, {appointment.start} - {appointment.end} Uhr
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/appointments/${appointment.id}`}>Details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link to="/appointments">Kalender öffnen</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

