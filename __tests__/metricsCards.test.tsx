import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricsCards } from '../components/dashboard/metrics-cards';
import { LocaleProvider } from '../components/providers/locale-provider';

describe('MetricsCards', () => {
  it('triggers month change handlers', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <MetricsCards
          totalIncome={10}
          totalExpenses={5}
          balance={5}
          monthlyGrowth={1}
          currentMonth={new Date('2024-05-01')}
          onMonthChange={onChange}
        />
      </LocaleProvider>
    );
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]); // next month
    await user.click(buttons[1]); // prev month
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
