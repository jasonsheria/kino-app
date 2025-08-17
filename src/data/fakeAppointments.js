// Fake appointment data per owner (ownerId -> appointments[])
// Each appointment: { id, ownerId, date: ISO date, time, guestName, propertyId, note }
const fakeAppointments = [
  { id: 'a1', ownerId: 'owner-123', date: '2025-08-18', time: '09:30', guestName: 'Jean Dupont', propertyId: 'p1', note: 'Visite initiale' },
  { id: 'a2', ownerId: 'owner-123', date: '2025-08-18', time: '14:00', guestName: 'Marie Curie', propertyId: 'p2', note: 'Deuxième visite' },
  { id: 'a3', ownerId: 'owner-123', date: '2025-08-20', time: '11:00', guestName: 'Paul Martin', propertyId: 'p3', note: 'Visite avec agent' },
  { id: 'a4', ownerId: 'owner-456', date: '2025-08-19', time: '10:00', guestName: 'Lucie Bernard', propertyId: 'p4', note: 'Contrat' },
  { id: 'a5', ownerId: 'owner-123', date: '2025-09-02', time: '16:00', guestName: 'Ahmed Salah', propertyId: 'p1', note: 'Relance' }
];

export function getAppointmentsForOwner(ownerId){
  return fakeAppointments.filter(a => a.ownerId === ownerId);
}

export default fakeAppointments;
