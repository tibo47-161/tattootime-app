import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Table } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Nutzer laden
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError('Fehler beim Laden der Nutzer.');
    }
    setLoading(false);
  };

  // Aktuellen User laden
  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setCurrentUser(res.data.user);
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUsers();
  }, []);

  // Rolle ändern
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.post(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch {
      setError('Fehler beim Ändern der Rolle.');
    }
  };

  // Nutzer löschen
  const handleDelete = async (userId) => {
    if (!window.confirm('Nutzer wirklich löschen?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch {
      setError('Fehler beim Löschen des Nutzers.');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (!currentUser) return <div>Bitte einloggen...</div>;
  if (currentUser.role !== 'admin') return <div>Kein Zugriff (nur für Admins).</div>;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 20 }}>
      <h2>Admin-Benutzerverwaltung</h2>
      <Button onClick={handleLogout} style={{ float: 'right', marginBottom: 10 }}>Logout</Button>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      {loading ? (
        <div>Lade Nutzer...</div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Rolle</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ background: user.role === 'admin' ? '#f0f8ff' : 'white' }}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <Select
                    value={user.role}
                    onChange={e => handleRoleChange(user._id, e.target.value)}
                    disabled={user._id === currentUser.id}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Select>
                </td>
                <td>
                  <Button
                    onClick={() => handleDelete(user._id)}
                    disabled={user._id === currentUser.id}
                    variant="destructive"
                  >
                    Löschen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default AdminUsersPage; 