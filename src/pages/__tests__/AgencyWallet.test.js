import React from 'react';
import { render, screen } from '@testing-library/react';
import AgencyWallet from '../AgencyWallet';
import { MemoryRouter } from 'react-router-dom';

test('renders AgencyWallet without crashing', () => {
  render(<MemoryRouter><AgencyWallet /></MemoryRouter>);
  expect(screen.getByText(/Wallet/i)).toBeInTheDocument();
});
