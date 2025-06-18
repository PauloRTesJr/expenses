import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../components/forms/login-form';
import { LocaleProvider } from '../components/providers/locale-provider';

jest.mock('../lib/supabase/client', () => ({
  supabase: {
    auth: { signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) }
  }
}));

const signInWithPassword = require('../lib/supabase/client').supabase.auth.signInWithPassword;

describe('LoginForm', () => {
  it('submits credentials', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LoginForm />
      </LocaleProvider>
    );
    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Senha', { selector: 'input' }), 'secret');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LoginForm />
      </LocaleProvider>
    );
    const pwd = screen.getByLabelText('Senha', { selector: 'input' });
    expect(pwd).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /mostrar senha/i }));
    expect(pwd).toHaveAttribute('type', 'text');
  });
});
