import { renderHook } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryClientWrapper } from '../components/providers/query-client-provider';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientWrapper>{children}</QueryClientWrapper>
);

describe('QueryClientWrapper', () => {
  it('provides a query client', () => {
    const { result } = renderHook(() => useQueryClient(), { wrapper });
    expect(result.current).toBeDefined();
  });
});
