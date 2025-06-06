import { useState, useEffect } from 'react';
import { 
  getCustomers, 
  getCustomer,
  getCustomerAppointments,
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../../services/customerService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Plus, Pencil, Trash2, Search, Calendar, User } from 'lucide-react';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAppointments, setCustomerAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Lade Kunden
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        setError(err.message || 'Fehler beim Laden der Kunden');
        console.error('Fehler beim Laden der Kunden:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  // Gefilterte Kunden basierend auf der Suche
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  // Dialog zum Erstellen/Bearbeiten öffnen
  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setCurrentCustomer(customer);
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        notes: customer.notes || ''
      });
    } else {
      setCurrentCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        notes: ''
      });
    }
    
    setIsDialogOpen(true);
  };

  // Dialog zum Löschen öffnen
  const handleOpenDeleteDialog = (customer) => {
    setCurrentCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  // Dialog für Kundendetails öffnen
  const handleOpenDetailsDialog = async (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
    setIsLoadingDetails(true);
    
    try {
      // Lade detaillierte Kundeninformationen und Termine
      const [customerDetails, appointments] = await Promise.all([
        getCustomer(customer._id),
        getCustomerAppointments(customer._id)
      ]);
      
      setSelectedCustomer(customerDetails);
      setCustomerAppointments(appointments);
    } catch (err) {
      console.error('Fehler beim Laden der Kundendetails:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (currentCustomer) {
        // Kunde aktualisieren
        await updateCustomer(currentCustomer._id, formData);
        
        // Aktualisiere die Liste
        setCustomers(prevCustomers => 
          prevCustomers.map(customer => 
            customer._id === currentCustomer._id ? { ...customer, ...formData } : customer
          )
        );
      } else {
        // Neuen Kunden erstellen
        const newCustomer = await createCustomer(formData);
        
        // Füge den neuen Kunden zur Liste hinzu
        setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
      }
      
      // Dialog schließen
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern des Kunden');
    }
  };

  // Kunde löschen
  const handleDelete = async () => {
    if (!currentCustomer) return;
    
    try {
      await deleteCustomer(currentCustomer._id);
      
      // Entferne den gelöschten Kunden aus der Liste
      setCustomers(prevCustomers => 
        prevCustomers.filter(customer => customer._id !== currentCustomer._id)
      );
      
      // Dialog schließen
      setIsDeleteDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen des Kunden');
    }
  };

  // Formatiere Datum für die Anzeige
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
          <p className="text-gray-500">
            Verwalte deine Kundendaten und Termine
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => handleOpenDialog()}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Neuer Kunde
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Kunden suchen..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kundenliste</CardTitle>
          <CardDescription>
            Hier findest du alle deine Kunden und kannst ihre Daten verwalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Kunden werden geladen...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              {searchTerm ? (
                <p className="text-muted-foreground">Keine Kunden gefunden, die "{searchTerm}" entsprechen.</p>
              ) : (
                <>
                  <p className="text-muted-foreground">Keine Kunden vorhanden.</p>
                  <p className="text-muted-foreground mt-2">Füge einen neuen Kunden hinzu, um loszulegen.</p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetailsDialog(customer)}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(customer)}
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

      {/* Dialog zum Erstellen/Bearbeiten von Kunden */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentCustomer ? 'Kunden bearbeiten' : 'Neuen Kunden erstellen'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Vollständiger Name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="E-Mail-Adresse"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Telefonnummer (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Zusätzliche Informationen zum Kunden"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit">
                {currentCustomer ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog zum Löschen von Kunden */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Kunden löschen</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Bist du sicher, dass du den Kunden <strong>{currentCustomer?.name}</strong> löschen möchtest?
            </p>
            <p className="text-muted-foreground mt-2">
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Termine dieses Kunden bleiben erhalten, verlieren jedoch die Zuordnung.
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

      {/* Dialog für Kundendetails */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Kundendetails</DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="text-center py-4">Details werden geladen...</div>
          ) : selectedCustomer ? (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="info">Informationen</TabsTrigger>
                <TabsTrigger value="appointments">Termine</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1">{selectedCustomer.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">E-Mail</h3>
                    <p className="mt-1">{selectedCustomer.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Telefon</h3>
                    <p className="mt-1">{selectedCustomer.phone || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Notizen</h3>
                    <p className="mt-1 whitespace-pre-wrap">{selectedCustomer.notes || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Erstellt am</h3>
                    <p className="mt-1">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="appointments">
                {customerAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Keine Termine für diesen Kunden vorhanden.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Termine</h3>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Titel</TableHead>
                          <TableHead>Typ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerAppointments.map((appointment) => (
                          <TableRow key={appointment._id}>
                            <TableCell>{formatDate(appointment.start)}</TableCell>
                            <TableCell>{appointment.title}</TableCell>
                            <TableCell>
                              {appointment.appointmentType?.name || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-4">Kunde nicht gefunden</div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;

