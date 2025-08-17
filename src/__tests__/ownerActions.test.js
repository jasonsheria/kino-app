import { addListingRequest, getListingRequests, acceptListingRequest } from '../api/ownerActions';
import agenciesApi from '../api/agencies';

describe('ownerActions flow', ()=>{
  beforeEach(()=> localStorage.clear());

  test('owner accepts agency request', async ()=>{
    const { agency } = await agenciesApi.registerAgency({ name:'A2', email:'a2@test' });
    const props = [{ id: 'p1', title:'House' }];
    localStorage.setItem('owner_props', JSON.stringify(props));
    const req = addListingRequest({ agencyId: agency.id, propertyId: 'p1' });
    expect(getListingRequests().length).toBe(1);
    await acceptListingRequest(req.id);
    const newProps = JSON.parse(localStorage.getItem('owner_props')||'[]');
    expect(newProps[0].acceptedByAgency).toBe(agency.id);
  });
});
