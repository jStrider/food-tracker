import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the useAuth hook
const mockRegister = vi.fn();
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      register: mockRegister,
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
    }),
  };
});

describe('RegisterPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders registration form with all fields', () => {
    renderRegisterPage();

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByText('Start tracking your nutrition today')).toBeInTheDocument();
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('allows user to type in all form fields', async () => {
    renderRegisterPage();

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('successfully registers user with valid data', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    renderRegisterPage();

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'john@example.com',
        'John Doe',
        'password123'
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error when passwords do not match', async () => {
    renderRegisterPage();

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different456');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('disables form fields and shows loading state during submission', async () => {
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderRegisterPage();

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Check that inputs are disabled during submission
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByLabelText('Confirm Password')).toBeDisabled();
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();

    // Check for loading spinner
    expect(screen.getByRole('button')).toHaveTextContent('Create Account');
    const button = screen.getByRole('button', { name: /create account/i });
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles registration error gracefully', async () => {
    const error = new Error('Email already exists');
    mockRegister.mockRejectedValueOnce(error);
    
    renderRegisterPage();

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'existing@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    // Form should not navigate on error
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // Form should be re-enabled after error
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).not.toBeDisabled();
      expect(screen.getByLabelText('Email')).not.toBeDisabled();
      expect(screen.getByLabelText('Password')).not.toBeDisabled();
      expect(screen.getByLabelText('Confirm Password')).not.toBeDisabled();
    });
  });

  it('has correct form field attributes', () => {
    renderRegisterPage();

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    // Check input types
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Check required attributes
    expect(nameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(confirmPasswordInput).toBeRequired();

    // Check minLength for passwords
    expect(passwordInput).toHaveAttribute('minLength', '6');
    expect(confirmPasswordInput).toHaveAttribute('minLength', '6');
  });

  it('navigates to login page when clicking sign in link', async () => {
    renderRegisterPage();

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('shows password strength indicator', async () => {
    renderRegisterPage();

    const passwordInput = screen.getByLabelText('Password');

    // Test weak password
    await user.type(passwordInput, 'weak');
    await waitFor(() => {
      expect(screen.getByText('Password strength:')).toBeInTheDocument();
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    // Test medium password (8+ chars with lowercase and numbers but no uppercase)
    await user.clear(passwordInput);
    await user.type(passwordInput, 'medium123');
    await waitFor(() => {
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
    });

    // Test strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Strong123!');
    await waitFor(() => {
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });
  });

});