import agenciesApi from '../api/agencies';

describe('agencies API basic', ()=>{
  beforeEach(()=>{ localStorage.clear(); });

  test('register, login and add product', async ()=>{
    const { agency } = await agenciesApi.registerAgency({ name:'A1', email:'a1@test' });
    expect(agency).toBeDefined();
    const l = await agenciesApi.loginAgency({ email:'a1@test' });
    expect(l.agency.email).toBe('a1@test');
    const p = await agenciesApi.addProduct(agency.id, { name:'Product X' });
    expect(p.id).toBeDefined();
    const prods = await agenciesApi.getProducts(agency.id);
    expect(prods.length).toBe(1);
  });
});
