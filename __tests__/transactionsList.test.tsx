import { render, screen } from '@testing-library/react';
import { TransactionsList } from '../components/dashboard/transactions-list';

const tx = {
  id: '1',
  description: 'desc',
  amount: 10,
  type: 'income' as const,
  category_id: 'c',
  date: '2024-05-15',
  is_installment: false
};

describe('TransactionsList', () => {
  it('shows empty state', () => {
    render(<TransactionsList transactions={[]} />);
    expect(screen.getByText(/nenhuma transação/i)).toBeInTheDocument();
  });

  it('renders a transaction', () => {
    render(<TransactionsList transactions={[tx]} />);
    expect(screen.getByText('desc')).toBeInTheDocument();
  });
});
