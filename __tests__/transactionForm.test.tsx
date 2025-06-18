import { render, screen } from '@testing-library/react';
import { TransactionForm } from '../components/forms/transaction-form';
import { LocaleProvider } from '../components/providers/locale-provider';

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  categories: [],
};

describe('TransactionForm i18n', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('shows portuguese text by default', () => {
    render(
      <LocaleProvider>
        <TransactionForm {...baseProps} />
      </LocaleProvider>
    );
    expect(screen.getByText('Tipo de Transação')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('switches to english when locale is en-US', () => {
    window.localStorage.setItem('locale', 'en-US');
    render(
      <LocaleProvider>
        <TransactionForm {...baseProps} />
      </LocaleProvider>
    );
    expect(screen.getByText('Transaction Type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});
