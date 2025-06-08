import { render, fireEvent, waitFor } from '@testing-library/react';
import { AvatarUpload } from '../components/profile/avatar-upload';

jest.mock('../components/profile/user-avatar', () => ({
  UserAvatar: (props: any) => <div {...props} />
}));

const mockService = {
  getCurrentProfile: jest.fn().mockResolvedValue({ id: '1' }),
  uploadAvatar: jest.fn().mockResolvedValue({ url: 'pic.png' })
};

jest.mock('../lib/profile/service', () => ({ ProfileService: mockService }));

describe('AvatarUpload', () => {
  it('calls upload on file select', async () => {
    const onComplete = jest.fn();
    const { container } = render(<AvatarUpload onUploadComplete={onComplete} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['a'], 'a.png', { type: 'image/png' });
    await fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(mockService.uploadAvatar).toHaveBeenCalled());
    expect(mockService.uploadAvatar).toHaveBeenCalledWith('1', file);
    expect(onComplete).toHaveBeenCalledWith('pic.png');
  });
});
