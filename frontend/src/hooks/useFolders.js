import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useToast } from '../components/Toast';

export const useFolderContentsQuery = (folderId) => {
  return useQuery({
    queryKey: ['folderContents', folderId],
    queryFn: async () => {
      const response = await apiService.folders.getContents(folderId);
      return response.data;
    }
  });
};

export const useCreateFolderMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ name, parentFolderId, description }) => {
      return apiService.folders.create(name, parentFolderId, description);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast(`Folder "${data.data.name}" created successfully`, 'success');
    },
    onError: () => {
      addToast('Failed to create folder', 'error');
    }
  });
};

export const useRenameFolderMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, newName }) => {
      return apiService.folders.rename(id, newName);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast(`Folder renamed to "${data.data.name}"`, 'success');
    },
    onError: () => {
      addToast('Failed to rename folder', 'error');
    }
  });
};

export const useDeleteFolderMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, permanent }) => {
      return apiService.folders.delete(id, permanent);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinItems'] });
      addToast(variables.permanent ? 'Folder permanently deleted' : 'Folder moved to Recycle Bin', 'success');
    },
    onError: () => {
      addToast('Failed to delete folder', 'error');
    }
  });
};

export const useRestoreFolderMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.folders.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinItems'] });
      addToast('Folder and its contents restored successfully', 'success');
    },
    onError: () => {
      addToast('Failed to restore folder', 'error');
    }
  });
};

export const useMoveFolderMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, targetFolderId }) => {
      return apiService.folders.move(id, targetFolderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast('Folder moved successfully', 'success');
    },
    onError: (error) => {
      addToast(error?.message || 'Failed to move folder', 'error');
    }
  });
};

export const useAllFoldersQuery = () => {
  return useQuery({
    queryKey: ['allFoldersList'],
    queryFn: async () => {
      const response = await apiService.folders.getAll();
      return response.data.folders || [];
    }
  });
};
