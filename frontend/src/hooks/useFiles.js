import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useToast } from '../components/Toast';

export const useDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await apiService.dashboard.getStats();
      return response.data;
    }
  });
};

export const useAllFilesQuery = () => {
  return useQuery({
    queryKey: ['allFilesList'],
    queryFn: async () => {
      const response = await apiService.files.getAll();
      return response.data.files || [];
    }
  });
};

export const useUploadFileMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ file, parentFolderId, onProgress }) => {
      return apiService.files.upload(file, parentFolderId, onProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast('File uploaded successfully', 'success');
    },
    onError: () => {
      addToast('Failed to upload file', 'error');
    }
  });
};

export const useRenameFileMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, newName }) => {
      return apiService.files.rename(id, newName);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteItems'] });
      queryClient.invalidateQueries({ queryKey: ['sharedItems'] });
      addToast(`File renamed to "${data.data.name}"`, 'success');
    },
    onError: () => {
      addToast('Failed to rename file', 'error');
    }
  });
};

export const useDeleteFileMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, permanent }) => {
      return apiService.files.delete(id, permanent);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinItems'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteItems'] });
      addToast(variables.permanent ? 'File deleted permanently' : 'File moved to Recycle Bin', 'success');
    },
    onError: () => {
      addToast('Failed to delete file', 'error');
    }
  });
};

export const useRestoreFileMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.files.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recycleBinItems'] });
      addToast('File restored successfully', 'success');
    },
    onError: () => {
      addToast('Failed to restore file', 'error');
    }
  });
};

export const useToggleFavoriteMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.files.toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteItems'] });
    }
  });
};

export const useTogglePinMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.files.togglePin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });
};

export const useToggleLockMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.files.toggleLock,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast(data.data.isLocked ? 'File locked' : 'File unlocked', 'success');
    }
  });
};

export const useToggleArchiveMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.files.toggleArchive,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast(data.data.isArchived ? 'File archived' : 'File unarchived', 'success');
    }
  });
};

export const useMoveFileMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, targetFolderId }) => {
      return apiService.files.move(id, targetFolderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast('File moved successfully', 'success');
    },
    onError: () => {
      addToast('Failed to move file', 'error');
    }
  });
};

export const useDuplicateFileMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.files.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast('File duplicated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to duplicate file', 'error');
    }
  });
};

export const useDownloadFileMutation = () => {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, name }) => {
      return apiService.files.download(id, name);
    },
    onSuccess: () => {
      addToast('Download started', 'success');
    },
    onError: () => {
      addToast('Failed to download file', 'error');
    }
  });
};

export const useRecycleBinQuery = () => {
  return useQuery({
    queryKey: ['recycleBinItems'],
    queryFn: async () => {
      const response = await apiService.recycleBin.getItems();
      return response.data;
    }
  });
};

export const useEmptyRecycleBinMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: apiService.recycleBin.empty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycleBinItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      addToast('Recycle bin emptied permanently', 'success');
    },
    onError: () => {
      addToast('Failed to empty recycle bin', 'error');
    }
  });
};

export const useFavoritesQuery = () => {
  return useQuery({
    queryKey: ['favoriteItems'],
    queryFn: async () => {
      const response = await apiService.favorites.getItems();
      return response.data;
    }
  });
};

export const useSharedQuery = () => {
  return useQuery({
    queryKey: ['sharedItems'],
    queryFn: async () => {
      const response = await apiService.shared.getItems();
      return response.data;
    }
  });
};
