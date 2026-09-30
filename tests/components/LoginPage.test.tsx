import React from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../src/pages/LoginPage';
import { AppProvider } from '../../src/context/AppContext';

describe('LoginPage Component Tests', () => {
  it('renders instantly with Sign in and Demo user options', () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <LoginPage />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('ScanKavach')).toBeInTheDocument();
    expect(screen.getByText('Your shield for safer medical image screening')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue as demo user/i })).toBeInTheDocument();
  });

  it('switches between Sign in and Create account tabs', () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <LoginPage />
        </AppProvider>
      </MemoryRouter>
    );

    const createTab = screen.getByRole('button', { name: /Create account/i });
    fireEvent.click(createTab);

    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Professional Role')).toBeInTheDocument();
  });
});
