import { useState, useEffect } from 'react';
import { 
  getAppointmentTypes, 
  createAppointmentType, 
  updateAppointmentType, 
  deleteAppointmentType 
} from '../../services/appointmentTypeService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const AppointmentTypesPage = () => {
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    duration: 60,
    description: ''
  });

  // Lade Termintypen
  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const data = await getAppointmentTypes();
        setAppointmentTypes(data);
      } catch (err) {
        setError(err.message || 'Fehler beim Laden der Termintypen');
        console.error('Fehler beim Laden der Termintypen:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointmentTypes();
  }, []);

  // Dialog zum Erstellen/Bearbeiten öffnen
  const handleOpenDialog = (type = null) => {
    if (type) {
      setCurrentType(type);
      setFormData({
        name: type.name || '',
        color: type.color || '#3B82F6',
        duration: type.duration || 60,
        description: type.description || ''
      });
    } else {
      setCurrentType(null);
      setFormData({
        name: '',
        color: '#3B82F6',
        duration: 60,
        description: ''
      });
    }
    
    setIsDialogOpen(true);
  };

  // Dialog zum Löschen öffnen
  const handleOpenDeleteDialog = (type) => {
    setCurrentType(type);
    setIsDeleteDialogOpen(true);
  };

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (currentType) {
        // Termintyp aktualisieren
        await updateAppointmentType(currentType._id, formData);
        
        // Aktualisiere die Liste
        setAppointmentTypes(prevTypes => 
          prevTypes.map(type => 
            type._id === currentType._id ? { ...type, ...formData } : type
          )
        );
      } else {
        // Neuen Termintyp erstellen
        const newType = await createAppointmentType(formData);
        
        // Füge den neuen Typ zur Liste hinzu
        setAppointmentTypes(prevTypes => [...prevTypes, newType]);
      }
      
      // Dialog schließen
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern des Termintyps');
    }
  };

  // Termintyp löschen
  const handleDelete = async () => {
    if (!currentType) return;
    
    try {
      await deleteAppointmentType(currentType._id);
      
      // Entferne den gelöschten Typ aus der Liste
      setAppointmentTypes(prevTypes => 
        prevTypes.filter(type => type._id !== currentType._id)
      );
      
      // Dialog schließen
      setIsDeleteDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen des Termintyps');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminarten</h1>
          <p className="text-gray-500">
            Verwalte die verschiedenen Arten von Terminen
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => handleOpenDialog()}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Neue Terminart
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
          <CardTitle>Terminarten</CardTitle>
          <CardDescription>
            Hier kannst du verschiedene Arten von Terminen definieren und mit Farben kennzeichnen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Terminarten werden geladen...</div>
          ) : appointmentTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Keine Terminarten vorhanden.</p>
              <p className="text-muted-foreground mt-2">Erstelle eine neue Terminart, um loszulegen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Farbe</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Dauer</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentTypes.map((type) => (
                  <TableRow key={type._id}>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: type.color }}
                      ></div>
                    </TableCell>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.duration} Min.</TableCell>
                    <TableCell className="max-w-xs truncate">{type.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(type)}
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

      {/* Dialog zum Erstellen/Bearbeiten von Termintypen */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentType ? 'Terminart bearbeiten' : 'Neue Terminart erstellen'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Tattoo, Beratung, Nachstechen"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Farbe</Label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  ></div>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Standarddauer (Minuten)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit">
                {currentType ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog zum Löschen von Termintypen */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Terminart löschen</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Bist du sicher, dass du die Terminart <strong>{currentType?.name}</strong> löschen möchtest?
            </p>
            <p className="text-muted-foreground mt-2">
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Termine mit dieser Terminart bleiben erhalten, verlieren jedoch die Zuordnung.
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

export default AppointmentTypesPage;

