import { ProfileService } from '../lib/profile/service';

const mockSingle = jest.fn();
const chain: any = {
  select: jest.fn(() => chain),
  update: jest.fn(() => chain),
  upsert: jest.fn(() => chain),
  insert: jest.fn(() => chain),
  delete: jest.fn(() => chain),
  eq: jest.fn(() => chain),
  neq: jest.fn(() => chain),
  order: jest.fn(() => chain),
  limit: jest.fn(() => chain),
  or: jest.fn(() => chain),
  single: mockSingle,
  then: jest.fn(),
};

const storage = {
  remove: jest.fn(),
  getPublicUrl: jest.fn(),
  upload: jest.fn(),
  list: jest.fn(),
};

const supabaseMock = {
  auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  from: jest.fn(() => chain),
  storage: { from: jest.fn(() => storage) },
};

jest.mock('../lib/supabase/client', () => ({
  supabase: {
    auth: { getUser: (...args: any[]) => supabaseMock.auth.getUser(...args) },
    from: (...args: any[]) => supabaseMock.from(...args),
    storage: { from: (...args: any[]) => supabaseMock.storage.from(...args) },
  },
}));

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseMock.from.mockImplementation(() => chain);
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
  });
  it('gets current profile', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'u1' }, error: null });
    const res = await ProfileService.getCurrentProfile();
    expect(res).toEqual({ id: 'u1' });
  });

  it('updates profile', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'u1', full_name: 'A' }, error: null });
    const res = await ProfileService.updateProfile('u1', { full_name: 'A' } as any);
    expect(res.full_name).toBe('A');
  });

  it('completes onboarding', async () => {
    chain.update.mockReturnValue(chain);
    chain.eq.mockResolvedValue({ error: null });
    await ProfileService.completeOnboarding('u1');
    expect(chain.update).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'u1');
  });

  it('searches users', async () => {
    chain.then.mockImplementation((resolve) =>
      resolve({ data: [{ id: 'u2' }], error: null })
    );
    const res = await ProfileService.searchUsers('te');
    expect(chain.or).toHaveBeenCalled();
    expect(res).toEqual([{ id: 'u2' }]);
  });

  it('throws on search error', async () => {
    chain.then.mockImplementation((resolve) =>
      resolve({ data: null, error: new Error('fail') })
    );
    await expect(ProfileService.searchUsers('te')).rejects.toThrow('Erro ao buscar usuários');
  });

  it('uploads avatar and updates profile', async () => {
    storage.upload.mockResolvedValue({ error: null });
    storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'url' } });
    const updateSpy = jest.spyOn(ProfileService, 'updateProfile').mockResolvedValue({} as any);
    const file = new File(['x'], 'a.png');
    const res = await ProfileService.uploadAvatar('u1', file);
    expect(storage.upload).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith('u1', { avatar_url: 'url' });
    expect(res.url).toBe('url');
    updateSpy.mockRestore();
  });

  it('removes avatar when exists', async () => {
    const getSpy = jest.spyOn(ProfileService, 'getProfile').mockResolvedValue({ avatar_url: 'http://x/avatars/pic.png' } as any);
    const updateSpy = jest.spyOn(ProfileService, 'updateProfile').mockResolvedValue({} as any);
    storage.remove.mockResolvedValue(undefined);
    await ProfileService.removeAvatar('u1');
    expect(storage.remove).toHaveBeenCalledWith(['avatars/pic.png']);
    expect(updateSpy).toHaveBeenCalledWith('u1', { avatar_url: null });
    getSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('gets profile stats', async () => {
    const transChain: any = { select: jest.fn(() => transChain), eq: jest.fn().mockResolvedValue({ data: [{ type: 'income', amount: 100 }, { type: 'expense', amount: 40 }], error: null }) };
    const shareChain: any = { select: jest.fn(() => shareChain), eq: jest.fn().mockResolvedValue({ data: [{ status: 'accepted' }, { status: 'pending' }], error: null }) };
    const profileChain: any = { select: jest.fn(() => profileChain), eq: jest.fn(() => profileChain), single: jest.fn().mockResolvedValue({ data: { created_at: '2024-01-01' }, error: null }) };
    supabaseMock.from
      .mockImplementationOnce(() => transChain)
      .mockImplementationOnce(() => shareChain)
      .mockImplementationOnce(() => profileChain);

    const res = await ProfileService.getProfileStats('u1');
    expect(res.totalTransactions).toBe(2);
    expect(res.totalExpenses).toBe(40);
    expect(res.totalIncome).toBe(100);
    expect(res.totalSharedTransactions).toBe(2);
    expect(res.acceptedShares).toBe(1);
    expect(res.joinedDate).toBe('2024-01-01');
  });

  it('creates or updates profile', async () => {
    const upsertChain: any = {
      upsert: jest.fn(() => upsertChain),
      select: jest.fn(() => upsertChain),
      single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null }),
    };
    supabaseMock.from.mockReturnValueOnce(upsertChain);
    const res = await ProfileService.createOrUpdateProfile('u1', 'a@b.com');
    expect(upsertChain.upsert).toHaveBeenCalled();
    expect(res.id).toBe('u1');
  });

  it('throws on createOrUpdate error', async () => {
    const upsertChain: any = {
      upsert: jest.fn(() => upsertChain),
      select: jest.fn(() => upsertChain),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
    };
    supabaseMock.from.mockReturnValueOnce(upsertChain);
    await expect(ProfileService.createOrUpdateProfile('u1', 'a@b.com')).rejects.toThrow('Erro ao criar/atualizar perfil');
  });
});
