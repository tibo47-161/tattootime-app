import { useState, useEffect } from 'react';
import { 
  getWorkingHours, 
  createWorkingHours, 
  updateWorkingHours, 
  deleteWorkingHours 
} from '../../services/workingHoursService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Pencil, Trash2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sonntag' },
  { id: 1, name: 'Montag' },
  { id: 2, name: 'Dienstag' },
  { id: 3, name: 'Mittwoch' },
  { id: 4, name: 'Donnerstag' },
  { id: 5, name: 'Freitag' },
  { id: 6, name: 'Samstag' }
];

const WorkingHoursPage = () => {
  const [workingHours, setWorkingHours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentWorkingHours, setCurrentWorkingHours] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    isWorkingDay: true,
    startTime: '09:00',
    endTime: '17:00'
  });

  // Lade Arbeitszeiten
  useEffect(() => {
    const fetchWorkingHours = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const data = await getWorkingHours();
        
        // Sortiere nach Wochentag
        const sortedData = [...data].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        
        setWorkingHours(sortedData);
      } catch (err) {
        setError(err.message || 'Fehler beim Laden der Arbeitszeiten');
        console.error('Fehler beim Laden der Arbeitszeiten:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkingHours();
  }, []);

  // Dialog zum Bearbeiten öffnen
  const handleOpenDialog = (workingHour = null) => {
    if (workingHour) {
      setCurrentWorkingHours(workingHour);
      setFormData({
        dayOfWeek: workingHour.dayOfWeek,
        isWorkingDay: workingHour.isWorkingDay,
        startTime: workingHour.startTime || '09:00',
        endTime: workingHour.endTime || '17:00'
      });
    } else {
      // Finde den nächsten Tag, für den noch keine Arbeitszeiten definiert sind
      const definedDays = workingHours.map(wh => wh.dayOfWeek);
      const nextDay = DAYS_OF_WEEK.find(day => !definedDays.includes(day.id))?.id || 1;
      
      setCurrentWorkingHours(null);
      setFormData({
        dayOfWeek: nextDay,
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00'
      });
    }
    
    setIsDialogOpen(true);
  };

  // Dialog zum Löschen öffnen
  const handleOpenDeleteDialog = (workingHour) => {
    setCurrentWorkingHours(workingHour);
    setIsDeleteDialogOpen(true);
  };

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validiere Zeiten
    if (formData.isWorkingDay) {
      const startParts = formData.startTime.split(':').map(Number);
      const endParts = formData.endTime.split(':').map(Number);
      
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      
      if (startMinutes >= endMinutes) {
        setError('Die Endzeit muss nach der Startzeit liegen.');
        return;
      }
    }
    
    try {
      if (currentWorkingHours) {
        // Arbeitszeiten aktualisieren
        await updateWorkingHours(currentWorkingHours._id, formData);
        
        // Aktualisiere die Liste
        setWorkingHours(prevHours => 
          prevHours.map(hour => 
            hour._id === currentWorkingHours._id ? { ...hour, ...formData } : hour
          ).sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        );
      } else {
        // Neue Arbeitszeiten erstellen
        const newHours = await createWorkingHours(formData);
        
        // Füge die neuen Arbeitszeiten zur Liste hinzu
        setWorkingHours(prevHours => 
          [...prevHours, newHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        );
      }
      
      // Dialog schließen
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern der Arbeitszeiten');
    }
  };

  // Arbeitszeiten löschen
  const handleDelete = async () => {
    if (!currentWorkingHours) return;
    
    try {
      await deleteWorkingHours(currentWorkingHours._id);
      
      // Entferne die gelöschten Arbeitszeiten aus der Liste
      setWorkingHours(prevHours => 
        prevHours.filter(hour => hour._id !== currentWorkingHours._id)
      );
      
      // Dialog schließen
      setIsDeleteDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen der Arbeitszeiten');
    }
  };

  // Formatiere Zeit für die Anzeige
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // Nur Stunden und Minuten anzeigen (HH:MM)
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arbeitszeiten</h1>
          <p className="text-gray-500">
            Lege fest, an welchen Tagen und zu welchen Zeiten du arbeitest
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => handleOpenDialog()}
            disabled={workingHours.length >= 7}
          >
            Arbeitszeiten hinzufügen
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Wöchentliche Arbeitszeiten</CardTitle>
          <CardDescription>
            Hier kannst du deine regulären Arbeitszeiten für jeden Wochentag festlegen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Arbeitszeiten werden geladen...</div>
          ) : workingHours.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Keine Arbeitszeiten definiert.</p>
              <p className="text-muted-foreground mt-2">Füge Arbeitszeiten hinzu, um loszulegen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wochentag</TableHead>
                  <TableHead>Arbeitstag</TableHead>
                  <TableHead>Startzeit</TableHead>
                  <TableHead>Endzeit</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workingHours.map((hours) => (
                  <TableRow key={hours._id}>
                    <TableCell className="font-medium">
                      {DAYS_OF_WEEK.find(day => day.id === hours.dayOfWeek)?.name || 'Unbekannt'}
                    </TableCell>
                    <TableCell>
                      {hours.isWorkingDay ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ja
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Nein
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{hours.isWorkingDay ? formatTime(hours.startTime) : '-'}</TableCell>
                    <TableCell>{hours.isWorkingDay ? formatTime(hours.endTime) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(hours)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(hours)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog zum Erstellen/Bearbeiten von Arbeitszeiten */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentWorkingHours ? 'Arbeitszeiten bearbeiten' : 'Neue Arbeitszeiten hinzufügen'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Wochentag</Label>
              <select
                id="dayOfWeek"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                disabled={currentWorkingHours !== null}
                required
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option 
                    key={day.id} 
                    value={day.id}
                    disabled={workingHours.some(wh => wh.dayOfWeek === day.id && wh._id !== currentWorkingHours?._id)}
                  >
                    {day.name}
                  </option>
                ))}
              </select>
              {currentWorkingHours && (
                <p className="text-xs text-muted-foreground">
                  Der Wochentag kann nicht geändert werden. Lösche diese Arbeitszeiten und erstelle neue, wenn du den Tag ändern möchtest.
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isWorkingDay"
                checked={formData.isWorkingDay}
                onCheckedChange={(checked) => setFormData({ ...formData, isWorkingDay: checked })}
              />
              <Label htmlFor="isWorkingDay">Arbeitstag</Label>
            </div>
            
            {formData.isWorkingDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Startzeit</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required={formData.isWorkingDay}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">Endzeit</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required={formData.isWorkingDay}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit">
                {currentWorkingHours ? 'Speichern' : 'Hinzufügen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog zum Löschen von Arbeitszeiten */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Arbeitszeiten löschen</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Bist du sicher, dass du die Arbeitszeiten für <strong>
                {DAYS_OF_WEEK.find(day => day.id === currentWorkingHours?.dayOfWeek)?.name}
              </strong> löschen möchtest?
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkingHoursPage;

