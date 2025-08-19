import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgencyProducts from '../AgencyProducts';
import { act } from 'react-dom/test-utils';

// Mock currentAgencySession to a stable id
jest.mock('../../api/agencies', () => ({ currentAgencySession: () => ({ id: 'test-agency' }) }));

beforeEach(()=>{ localStorage.clear(); });

test('create, edit and delete product flows', async ()=>{
  render(<AgencyProducts />);
  // wait for load
  await waitFor(()=> expect(screen.queryByText(/Chargement/)).not.toBeInTheDocument());

  // no products initially
  expect(screen.getByText(/Aucun produit/)).toBeInTheDocument();

  // open create
  const newBtn = screen.getByText(/Nouveau produit/);
  fireEvent.click(newBtn);

  const nameInput = screen.getByTestId('name-input');
  fireEvent.change(nameInput, { target: { value: 'Test product' } });

  const saveBtn = screen.getByTestId('save-btn');
  fireEvent.click(saveBtn);

  // product should appear
  await waitFor(()=> expect(screen.getByText('Test product')).toBeInTheDocument());

  // open edit
  const editBtn = screen.getByText('Éditer');
  fireEvent.click(editBtn);
  const nameInput2 = screen.getByTestId('name-input');
  fireEvent.change(nameInput2, { target: { value: 'Updated product' } });
  const saveBtn2 = screen.getByTestId('save-btn');
  fireEvent.click(saveBtn2);

  await waitFor(()=> expect(screen.getByText('Updated product')).toBeInTheDocument());

  // delete
  const delBtn = screen.getByText('Supprimer');
  fireEvent.click(delBtn);
  // confirm prompt - mock window.confirm
  await act(async ()=>{
    window.confirm = () => true;
  });
  // After deletion, the product should be removed
  await waitFor(()=> expect(screen.queryByText('Updated product')).not.toBeInTheDocument());
});
