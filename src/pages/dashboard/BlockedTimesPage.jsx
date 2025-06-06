import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  getBlockedTimes, 
  createBlockedTime, 
  updateBlockedTime, 
  deleteBlockedTime 
} from '../../services/blockedTimeService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Plus, Pencil, Trash2, CalendarIcon } from 'lucide-react';

const BlockedTimesPage = () => {
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentBlockedTime, setCurrentBlockedTime] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    allDay: false,
    notes: ''
  });

  // Lade Sperrzeiten
  useEffect(() => {
    const fetchBlockedTimes = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Lade Sperrzeiten für die nächsten 6 Monate
        const now = new Date();
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        
        const data = await getBlockedTimes({
          start: now.toISOString(),
          end: sixMonthsLater.toISOString()
        });
        
        // Sortiere nach Startdatum
        const sortedData = [...data].sort((a, b) => new Date(a.start) - new Date(b.start));
        
        setBlockedTimes(sortedData);
      } catch (err) {
        setError(err.message || 'Fehler beim Laden der Sperrzeiten');
        console.error('Fehler beim Laden der Sperrzeiten:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlockedTimes();
  }, []);

  // Dialog zum Erstellen/Bearbeiten öffnen
  const handleOpenDialog = (blockedTime = null) => {
    if (blockedTime) {
      const start = new Date(blockedTime.start);
      const end = new Date(blockedTime.end);
      
      setCurrentBlockedTime(blockedTime);
      setFormData({
        title: blockedTime.title || '',
        start: start,
        end: end,
        startTime: format(start, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        allDay: blockedTime.allDay || false,
        notes: blockedTime.notes || ''
      });
    } else {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setCurrentBlockedTime(null);
      setFormData({
        title: '',
        start: now,
        end: tomorrow,
        startTime: '09:00',
        endTime: '17:00',
        allDay: false,
        notes: ''
      });
    }
    
    setIsDialogOpen(true);
  };

  // Dialog zum Löschen öffnen
  const handleOpenDeleteDialog = (blockedTime) => {
    setCurrentBlockedTime(blockedTime);
    setIsDeleteDialogOpen(true);
  };

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Erstelle Start- und Endzeit-Objekte
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      
      if (!formData.allDay) {
        const [startHour, startMinute] = formData.startTime.split(':').map(Number);
        const [endHour, endMinute] = formData.endTime.split(':').map(Number);
        
        startDate.setHours(startHour, startMinute, 0, 0);
        endDate.setHours(endHour, endMinute, 0, 0);
      } else {
        // Bei ganztägigen Sperrzeiten: Start auf 00:00 Uhr, Ende auf 23:59 Uhr setzen
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      // Validiere Daten
      if (startDate >= endDate) {
        setError('Das Enddatum muss nach dem Startdatum liegen.');
        return;
      }
      
      const blockedTimeData = {
        title: formData.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: formData.allDay,
        notes: formData.notes
      };
      
      if (currentBlockedTime) {
        // Sperrzeit aktualisieren
        await updateBlockedTime(currentBlockedTime._id, blockedTimeData);
        
        // Aktualisiere die Liste
        setBlockedTimes(prevTimes => 
          prevTimes.map(time => 
            time._id === currentBlockedTime._id ? { ...time, ...blockedTimeData } : time
          ).sort((a, b) => new Date(a.start) - new Date(b.start))
        );
      } else {
        // Neue Sperrzeit erstellen
        const newBlockedTime = await createBlockedTime(blockedTimeData);
        
        // Füge die neue Sperrzeit zur Liste hinzu
        setBlockedTimes(prevTimes => 
          [...prevTimes, newBlockedTime].sort((a, b) => new Date(a.start) - new Date(b.start))
        );
      }
      
      // Dialog schließen
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern der Sperrzeit');
    }
  };

  // Sperrzeit löschen
  const handleDelete = async () => {
    if (!currentBlockedTime) return;
    
    try {
      await deleteBlockedTime(currentBlockedTime._id);
      
      // Entferne die gelöschte Sperrzeit aus der Liste
      setBlockedTimes(prevTimes => 
        prevTimes.filter(time => time._id !== currentBlockedTime._id)
      );
      
      // Dialog schließen
      setIsDeleteDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen der Sperrzeit');
    }
  };

  // Formatiere Datum und Zeit für die Anzeige
  const formatDateTime = (dateString, allDay = false) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    
    if (allDay) {
      return format(date, 'dd.MM.yyyy', { locale: de });
    }
    
    return format(date, 'dd.MM.yyyy HH:mm', { locale: de });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sperrzeiten</h1>
          <p className="text-gray-500">
            Verwalte Zeiträume, in denen keine Termine gebucht werden können
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => handleOpenDialog()}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Neue Sperrzeit
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
          <CardTitle>Sperrzeiten</CardTitle>
          <CardDescription>
            Hier kannst du Zeiträume definieren, in denen keine Termine gebucht werden können, z.B. für Urlaub oder andere Abwesenheiten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Sperrzeiten werden geladen...</div>
          ) : blockedTimes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Keine Sperrzeiten definiert.</p>
              <p className="text-muted-foreground mt-2">Füge Sperrzeiten hinzu, um Zeiträume zu blockieren.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Von</TableHead>
                  <TableHead>Bis</TableHead>
                  <TableHead>Ganztägig</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedTimes.map((blockedTime) => (
                  <TableRow key={blockedTime._id}>
                    <TableCell className="font-medium">{blockedTime.title}</TableCell>
                    <TableCell>{formatDateTime(blockedTime.start, blockedTime.allDay)}</TableCell>
                    <TableCell>{formatDateTime(blockedTime.end, blockedTime.allDay)}</TableCell>
                    <TableCell>
                      {blockedTime.allDay ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Ja
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Nein
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(blockedTime)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(blockedTime)}
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

      {/* Dialog zum Erstellen/Bearbeiten von Sperrzeiten */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentBlockedTime ? 'Sperrzeit bearbeiten' : 'Neue Sperrzeit erstellen'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Urlaub, Fortbildung, Krankheit"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="allDay"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
              />
              <Label htmlFor="allDay">Ganztägig</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start ? format(formData.start, 'PPP', { locale: de }) : 'Datum wählen'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start}
                      onSelect={(date) => setFormData({ ...formData, start: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Enddatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end ? format(formData.end, 'PPP', { locale: de }) : 'Datum wählen'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end}
                      onSelect={(date) => setFormData({ ...formData, end: date })}
                      initialFocus
                      disabled={(date) => date < formData.start}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {!formData.allDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Startzeit</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required={!formData.allDay}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">Endzeit</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required={!formData.allDay}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optionale Notizen"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit">
                {currentBlockedTime ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog zum Löschen von Sperrzeiten */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sperrzeit löschen</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Bist du sicher, dass du die Sperrzeit <strong>{currentBlockedTime?.title}</strong> löschen möchtest?
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

export default BlockedTimesPage;

