import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { ProfilePage } from './ProfilePage';
import * as useAuthModule from '../hooks/useAuth';

const mockUser = {
  id: 'user-123',
  tenantId: 'tenant-1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'CUSTOMER' as const,
  status: 'ACTIVE' as const,
  addresses: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: true,
      loading: false,
    });
  });

  it('should render the profile page', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('should display personal information section', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
  });

  it('should display user name from auth context', () => {
    renderWithRouter(<ProfilePage />);
    const nameDisplay = screen.getByTestId('profile-name-display');
    expect(nameDisplay).toHaveTextContent('John Doe');
  });

  it('should display user email', () => {
    renderWithRouter(<ProfilePage />);
    const emailDisplay = screen.getByTestId('profile-email-display');
    expect(emailDisplay).toHaveTextContent('john.doe@example.com');
  });

  it('should display user phone number', () => {
    renderWithRouter(<ProfilePage />);
    const phoneDisplay = screen.getByTestId('profile-phone-display');
    expect(phoneDisplay).toHaveTextContent('+1234567890');
  });

  it('should show "Not provided" when phone is missing', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: { ...mockUser, phone: undefined },
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: true,
      loading: false,
    });

    renderWithRouter(<ProfilePage />);
    const phoneDisplay = screen.getByTestId('profile-phone-display');
    expect(phoneDisplay).toHaveTextContent('Not provided');
  });

  it('should display edit profile button', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByTestId('edit-profile-button')).toBeInTheDocument();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('should enter edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    const editButton = screen.getByTestId('edit-profile-button');
    await user.click(editButton);

    // Should show input fields
    expect(screen.getByTestId('profile-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('profile-phone-input')).toBeInTheDocument();

    // Should show save and cancel buttons
    expect(screen.getByTestId('save-profile-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-profile-button')).toBeInTheDocument();

    // Edit button should be hidden
    expect(screen.queryByTestId('edit-profile-button')).not.toBeInTheDocument();
  });

  it('should allow editing name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    const editButton = screen.getByTestId('edit-profile-button');
    await user.click(editButton);

    const nameInput = screen.getByTestId('profile-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Smith');

    expect(nameInput).toHaveValue('Jane Smith');
  });

  it('should allow editing phone number', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    const editButton = screen.getByTestId('edit-profile-button');
    await user.click(editButton);

    const phoneInput = screen.getByTestId('profile-phone-input');
    await user.clear(phoneInput);
    await user.type(phoneInput, '+9876543210');

    expect(phoneInput).toHaveValue('+9876543210');
  });

  it('should exit edit mode when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByTestId('edit-profile-button');
    await user.click(editButton);

    expect(screen.getByTestId('profile-name-input')).toBeInTheDocument();

    // Cancel editing
    const cancelButton = screen.getByTestId('cancel-profile-button');
    await user.click(cancelButton);

    // Should return to view mode
    expect(screen.queryByTestId('profile-name-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-name-display')).toBeInTheDocument();
    expect(screen.getByTestId('edit-profile-button')).toBeInTheDocument();
  });

  it('should exit edit mode when save is clicked', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByTestId('edit-profile-button');
    await user.click(editButton);

    // Make changes
    const nameInput = screen.getByTestId('profile-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Smith');

    // Save
    const saveButton = screen.getByTestId('save-profile-button');
    await user.click(saveButton);

    // Should exit edit mode
    expect(screen.queryByTestId('profile-name-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('edit-profile-button')).toBeInTheDocument();

    // Should have logged the save action (API call placeholder)
    expect(consoleSpy).toHaveBeenCalledWith('Saving profile:', expect.objectContaining({
      name: 'Jane Smith',
    }));

    consoleSpy.mockRestore();
  });

  it('should display email with note that it cannot be changed', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Contact support to change your email address')).toBeInTheDocument();
  });

  it('should not allow editing email field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    const editButton = screen.getByTestId('edit-profile-button');
    await user.click(editButton);

    // Email should still be displayed as text, not input
    const emailDisplay = screen.getByTestId('profile-email-display');
    expect(emailDisplay).toHaveTextContent('john.doe@example.com');

    // Should not have email input
    expect(screen.queryByTestId('profile-email-input')).not.toBeInTheDocument();
  });
});

describe('ProfilePage - Address Book', () => {
  beforeEach(() => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: true,
      loading: false,
    });
  });

  it('should display address book section', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Address Book')).toBeInTheDocument();
  });

  it('should display add address button', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    expect(screen.getByText('Add Address')).toBeInTheDocument();
  });

  it('should display empty state when no addresses', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('No addresses saved')).toBeInTheDocument();
    expect(screen.getByText('Add a shipping address to make checkout faster')).toBeInTheDocument();
  });

  it('should display empty state icon', () => {
    renderWithRouter(<ProfilePage />);
    const svg = screen.getByText('No addresses saved').parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should log when add address is clicked', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    const addButton = screen.getByTestId('add-address-button');
    await user.click(addButton);

    expect(consoleSpy).toHaveBeenCalledWith('Add address clicked');
    consoleSpy.mockRestore();
  });
});

describe('ProfilePage - Security', () => {
  beforeEach(() => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: true,
      loading: false,
    });
  });

  it('should display security section', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('should display password section', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Last changed 30 days ago')).toBeInTheDocument();
  });

  it('should display change password button', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByTestId('change-password-button')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });
});

describe('ProfilePage - No User', () => {
  it('should handle null user gracefully', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });

    renderWithRouter(<ProfilePage />);

    // Should still render the page structure
    expect(screen.getByText('My Profile')).toBeInTheDocument();

    // Should show empty values
    const nameDisplay = screen.getByTestId('profile-name-display');
    expect(nameDisplay).toHaveTextContent('');
  });
});

describe('ProfilePage - Accessibility', () => {
  beforeEach(() => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: true,
      loading: false,
    });
  });

  it('should have proper heading structure', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Address Book' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Security' })).toBeInTheDocument();
  });

  it('should have accessible buttons', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Address' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
  });

  it('should have proper form labels', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByTestId('edit-profile-button');
    await user.click(editButton);

    // Check that labels exist
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();

    // Check that inputs exist
    expect(screen.getByTestId('profile-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('profile-phone-input')).toBeInTheDocument();
  });
});
