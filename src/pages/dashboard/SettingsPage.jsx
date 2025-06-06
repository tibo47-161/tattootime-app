import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateSettings } from '../../services/authService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [defaultView, setDefaultView] = useState('week');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Benutzereinstellungen laden
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDefaultView(user.settings?.defaultView || 'week');
      setNotificationsEnabled(user.settings?.notificationsEnabled !== false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await updateSettings({
        name,
        settings: {
          defaultView,
          notificationsEnabled
        }
      });
      
      setSuccess(true);
      
      // Nach 3 Sekunden die Erfolgsmeldung ausblenden
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Fehler beim Aktualisieren der Einstellungen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-8">Einstellungen werden geladen...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Einstellungen</h1>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Einstellungen</CardTitle>
              <CardDescription>
                Verwalte deine persönlichen Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-6 border-green-500 bg-green-50">
                  <CheckCircledIcon className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Einstellungen erfolgreich gespeichert.
                  </AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dein Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultView">Standard-Kalenderansicht</Label>
                  <Select
                    value={defaultView}
                    onValueChange={setDefaultView}
                  >
                    <SelectTrigger id="defaultView">
                      <SelectValue placeholder="Wähle eine Ansicht" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Tag</SelectItem>
                      <SelectItem value="week">Woche</SelectItem>
                      <SelectItem value="month">Monat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                  <Label htmlFor="notifications">Benachrichtigungen aktivieren</Label>
                </div>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Wird gespeichert...' : 'Einstellungen speichern'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Kalendereinstellungen</CardTitle>
              <CardDescription>
                Passe die Darstellung und Funktionen deines Kalenders an
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Diese Einstellungen werden in einer zukünftigen Version verfügbar sein.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungseinstellungen</CardTitle>
              <CardDescription>
                Verwalte, wann und wie du benachrichtigt werden möchtest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Diese Einstellungen werden in einer zukünftigen Version verfügbar sein.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

