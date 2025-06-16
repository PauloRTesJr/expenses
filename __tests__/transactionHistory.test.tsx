import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionHistory } from '../components/dashboard/transaction-history';
import { TransactionWithShares } from '../types/shared-transactions';

const baseTx = {
  amount: 10,
  category_id: 'c1',
  date: '2024-06-10',
  type: 'income' as const,
  user_id: 'u1',
  is_installment: false,
  installment_count: null,
  installment_current: null,
  installment_group_id: null,
  updated_at: '2024-06-10',
};

const shared = (name: string) => ({
  id: `s-${name}`,
  transaction_id: 't',
  shared_with_user_id: `u-${name}`,
  share_type: 'equal' as const,
  share_value: null,
  status: 'accepted' as const,
  created_at: '2024-06-10',
  updated_at: '2024-06-10',
  profiles: { full_name: name, email: `${name}@x.com` },
});

function tx(id: string, desc: string, created: string, shares: any[] = []): TransactionWithShares {
  return {
    ...baseTx,
    id,
    description: desc,
    created_at: created,
    transaction_shares: shares,
  } as TransactionWithShares;
}

describe('TransactionHistory filters and sorting', () => {
  it('filters shared transactions', async () => {
    const data = [tx('1', 'A', '2024-06-11'), tx('2', 'B', '2024-06-10', [shared('Alice')])];
    const user = userEvent.setup();
    const { container } = render(
      <TransactionHistory transactions={data} isLoading={false} />
    );
    expect(container.querySelectorAll('.group')).toHaveLength(2);
    await user.click(screen.getByLabelText('Toggle shared filter'));
    await waitFor(() =>
      expect(container.querySelectorAll('.group')).toHaveLength(1)
    );
    expect(screen.queryByText('A')).toBeNull();
  });

  it('sorts by shared user', async () => {
    const data = [
      tx('1', 'First', '2024-06-10', [shared('Charlie')]),
      tx('2', 'Second', '2024-06-09', [shared('Alice')]),
    ];
    const user = userEvent.setup();
    const { container } = render(
      <TransactionHistory transactions={data} isLoading={false} />
    );
    // initial sort by date
    let items = Array.from(container.querySelectorAll('.group'));
    expect(items[0].textContent).toContain('First');
    await user.click(screen.getByLabelText('Toggle sort mode'));
    await waitFor(() => {
      const sorted = Array.from(container.querySelectorAll('.group'));
      expect(sorted[0].textContent).toContain('Second');
    });
  });

  it('handles sorting when shares are missing', async () => {
    const data = [tx('1', 'NoShare1', '2024-06-10'), tx('2', 'NoShare2', '2024-06-09')];
    const user = userEvent.setup();
    const { container } = render(
      <TransactionHistory transactions={data} isLoading={false} />
    );
    await user.click(screen.getByLabelText('Toggle sort mode'));
    await waitFor(() => {
      expect(container.querySelectorAll('.group')).toHaveLength(2);
    });
  });
});
