import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useToast } from '../components/Toast';

export const useUserQuery = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiService.auth.getMe();
      return response.data.user;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useRegisterMutation = () => {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.auth.register,
    onSuccess: () => {
      addToast('Registration successful! You can now log in.', 'success');
    },
    onError: (error) => {
      addToast(error?.response?.data?.message || 'Registration failed. Please try again.', 'error');
    }
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.auth.login,
    onSuccess: (response) => {
      queryClient.setQueryData(['currentUser'], response.data.user);
      addToast('Welcome back to CloudVault!', 'success');
    },
    onError: (error) => {
      addToast(error?.response?.data?.message || 'Login failed. Please try again.', 'error');
    }
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.auth.logout,
    onSuccess: () => {
      queryClient.clear();
      addToast('Logged out successfully', 'success');
    },
    onError: () => {
      addToast('Logout failed', 'error');
    }
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.user.updateProfile,
    onSuccess: (response) => {
      queryClient.setQueryData(['currentUser'], response.data);
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast('Profile updated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to update profile', 'error');
    }
  });
};

export const useChangePasswordMutation = () => {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.user.changePassword,
    onSuccess: () => {
      addToast('Password updated successfully', 'success');
    },
    onError: (error) => {
      addToast(error?.response?.data?.message || 'Failed to update password', 'error');
    }
  });
};

export const useUploadAvatarMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.user.uploadAvatar,
    onSuccess: (response) => {
      queryClient.setQueryData(['currentUser'], response.data);
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast('Avatar picture updated', 'success');
    },
    onError: () => {
      addToast('Failed to upload avatar', 'error');
    }
  });
};

export const useSessionsQuery = () => {
  return useQuery({
    queryKey: ['activeSessions'],
    queryFn: async () => {
      const response = await apiService.user.getSessions();
      return response.data;
    }
  });
};

export const useRevokeSessionMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.user.revokeSession,
    onSuccess: (data) => {
      queryClient.setQueryData(['activeSessions'], data.data);
      addToast('Session revoked successfully', 'success');
    },
    onError: () => {
      addToast('Failed to revoke session', 'error');
    }
  });
};
