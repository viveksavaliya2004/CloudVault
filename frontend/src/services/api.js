import axios from 'axios';
import * as mockDB from './mockData';

// API Base URL (Vite proxy redirects relative calls from /api to http://localhost:5000/api)
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Flag to use mock database in frontend instead of making real network requests
const USE_MOCK = false;

// Helper to simulate network latency
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Normalization Helpers to align Mongoose schemas with UI variable expectations
const mapFolder = (f) => {
  if (!f) return f;
  return {
    ...f,
    id: f._id,
    parentFolderId: f.parentFolder,
  };
};

const getFileType = (ext, mime) => {
  const extension = (ext || '').replace(/^\./, '').toLowerCase();
  const mimeType = (mime || '').toLowerCase();

  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'].includes(extension)) return 'image';
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv'].includes(extension)) return 'video';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension) || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document';
  if (['zip', 'rar', 'tar', 'gz'].includes(extension) || mimeType.includes('zip') || mimeType.includes('compressed')) return 'zip';
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
  return 'other';
};

const cleanUrl = (url) => {
  if (!url) return '';
  return String(url).replace(/\\/g, '/');
};

const mapFile = (f) => {
  if (!f) return f;
  const storageUrl = cleanUrl(f.storagePath || f.url || '');
  const thumbUrl = cleanUrl(f.thumbnailUrl || f.thumbnailPath || f.thumbnail || storageUrl);
  return {
    ...f,
    id: f._id || f.id,
    name: f.fileName || f.name || f.originalName || 'Untitled File',
    type: f.type || getFileType(f.extension, f.mimeType),
    parentFolderId: f.folderId || f.parentFolderId,
    isFavorite: f.isFavourite || f.isFavorite || false,
    isPinned: f.isStarred || f.isPinned || false,
    owner: f.owner && typeof f.owner === 'object' ? f.owner : { name: 'Owner', email: 'owner@cloudvault.com' },
    url: cleanUrl(f.url || storageUrl),
    thumbnail: thumbUrl,
    thumbnailUrl: thumbUrl,
    thumbnailPath: cleanUrl(f.thumbnailPath),
    storagePath: cleanUrl(f.storagePath),
  };
};

// Attach authorization headers with JWT access tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Catch 401 errors, attempt to request refresh tokens, and retry original calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the request URL is one of the authentication endpoints
    const isAuthRequest = originalRequest.url && (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/logout')
    );

    const isPublicShareRequest = originalRequest.url && originalRequest.url.includes('/files/shared/public/');

    const hasToken = !!localStorage.getItem('accessToken');
    const isOnLoginPage = window.location.pathname.includes('/login');

    if (error.response && error.response.status === 401 && hasToken && !isOnLoginPage && !originalRequest._retry && !isAuthRequest && !isPublicShareRequest) {
      originalRequest._retry = true;
      try {
        const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        const isSuspended = refreshError.response && refreshError.response.status === 403 &&
          (refreshError.response.data?.message || '').includes('suspended');

        if (!window.location.pathname.includes('/login')) {
          window.location.href = isSuspended ? '/login?suspended=true' : '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // If account has been suspended/blocked (403), immediately clear token and log out the user
    if (error.response && error.response.status === 403) {
      const msg = error.response.data?.message || '';
      if (msg.includes('suspended') || msg.includes('suspended.')) {
        localStorage.removeItem('accessToken');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?suspended=true';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Mock Interceptor / Client methods
export const apiService = {
  // Auth Operations
  auth: {
    register: async (data) => {
      if (USE_MOCK) {
        await delay(500);
        return { data: { status: 'success', message: 'Registration successful' } };
      }
      return api.post('/auth/register', data);
    },
    login: async (credentials) => {
      if (USE_MOCK) {
        await delay(500);
        const user = mockDB.getMockUser();
        return { data: { user, token: 'mock_jwt_token' } };
      }
      const response = await api.post('/auth/login', credentials);
      if (response.data && response.data.data) {
        const { accessToken, user } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        response.data.user = user;
        response.data.token = accessToken;
      }
      return response;
    },
    logout: async () => {
      if (USE_MOCK) {
        await delay(300);
        return { data: { success: true } };
      }
      const response = await api.post('/auth/logout');
      localStorage.removeItem('accessToken');
      return response;
    },
    getMe: async () => {
      if (USE_MOCK) {
        await delay(300);
        const user = mockDB.getMockUser();
        return { data: { user } };
      }
      const response = await api.get('/auth/me');
      if (response.data && response.data.data) {
        response.data.user = response.data.data.user;
      }
      return response;
    }
  },

  // User Profile Operations
  user: {
    getProfile: async () => {
      if (USE_MOCK) {
        await delay(200);
        return { data: mockDB.getMockUser() };
      }
      const response = await api.get('/users/profile');
      if (response.data && response.data.data) {
        response.data = response.data.data.profile || response.data.data.user || response.data.data;
      }
      return response;
    },
    updateProfile: async (data) => {
      if (USE_MOCK) {
        await delay(400);
        const updated = mockDB.updateMockUser(data);
        return { data: updated };
      }
      const response = await api.patch('/users/profile', data);
      if (response.data && response.data.data) {
        response.data = response.data.data.user;
      }
      return response;
    },
    changePassword: async (data) => {
      if (USE_MOCK) {
        await delay(500);
        return { data: { success: true, message: 'Password updated successfully' } };
      }
      const payload = {
        currentPassword: data.oldPassword,
        newPassword: data.newPassword,
      };
      return api.patch('/users/profile/password', payload);
    },
    uploadAvatar: async (file) => {
      if (USE_MOCK) {
        await delay(800);
        const avatarUrl = URL.createObjectURL(file);
        const updated = mockDB.updateMockUser({ avatar: avatarUrl });
        return { data: updated };
      }
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.post('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data && response.data.data) {
        response.data = response.data.data.user;
      }
      return response;
    },
    getSessions: async () => {
      if (USE_MOCK) {
        await delay(200);
        return { data: mockDB.getMockSessions() };
      }
      await delay(200);
      return { data: mockDB.getMockSessions() };
    },
    revokeSession: async (id) => {
      if (USE_MOCK) {
        await delay(300);
        return { data: mockDB.deleteMockSession(id) };
      }
      await delay(300);
      return { data: mockDB.deleteMockSession(id) };
    }
  },

  // Folder Operations
  folders: {
    getAll: async () => {
      if (USE_MOCK) {
        await delay(300);
        return { data: { folders: mockDB.getMockFolders().filter(f => !f.isDeleted) } };
      }
      const response = await api.get('/folders');
      if (response.data && response.data.data) {
        response.data.folders = (response.data.data.folders || []).map(mapFolder);
      }
      return response;
    },
    create: async (name, parentFolderId, description) => {
      if (USE_MOCK) {
        await delay(400);
        const newFolder = mockDB.createMockFolder(name, parentFolderId, description);
        return { data: newFolder };
      }
      const response = await api.post('/folders', { name, parentFolder: parentFolderId, description });
      if (response.data && response.data.data) {
        response.data = mapFolder(response.data.data.folder);
      }
      return response;
    },
    rename: async (id, name) => {
      if (USE_MOCK) {
        await delay(300);
        const updated = mockDB.renameMockFolder(id, name);
        return { data: updated };
      }
      const response = await api.patch(`/folders/${id}/rename`, { name });
      if (response.data && response.data.data) {
        response.data = mapFolder(response.data.data.folder);
      }
      return response;
    },
    move: async (id, targetFolderId) => {
      if (USE_MOCK) {
        await delay(400);
        const updated = mockDB.moveMockFolder(id, targetFolderId);
        return { data: updated };
      }
      const response = await api.patch(`/folders/${id}/move`, { targetParentId: targetFolderId });
      if (response.data && response.data.data) {
        response.data = mapFolder(response.data.data.folder);
      }
      return response;
    },
    delete: async (id, permanent = false) => {
      if (USE_MOCK) {
        await delay(300);
        mockDB.deleteMockFolder(id, permanent);
        return { data: { success: true } };
      }
      return api.delete(`/folders/${id}${permanent ? '?permanent=true' : ''}`);
    },
    restore: async (id) => {
      if (USE_MOCK) {
        await delay(300);
        mockDB.restoreMockFolder(id);
        return { data: { success: true } };
      }
      return api.patch(`/folders/${id}/restore`);
    },
    getContents: async (folderId) => {
      if (USE_MOCK) {
        await delay(400);
        const folders = mockDB.getMockFolders().filter(f => f.parentFolderId === folderId && !f.isDeleted);
        const files = mockDB.getMockFiles().filter(f => f.parentFolderId === folderId && !f.isDeleted);
        return { data: { folders, files } };
      }
      const response = await api.get(`/folders/${folderId || 'root'}/contents`);
      if (response.data && response.data.data) {
        const mappedFolders = (response.data.data.subfolders || []).map(mapFolder);
        const mappedFiles = (response.data.data.files || []).map(mapFile);
        response.data = {
          folder: mapFolder(response.data.data.folder),
          folders: mappedFolders,
          files: mappedFiles,
        };
      }
      return response;
    }
  },

  // File Operations
  files: {
    getAll: async () => {
      if (USE_MOCK) {
        await delay(300);
        return { data: { files: mockDB.getMockFiles().filter(f => !f.isDeleted) } };
      }
      const response = await api.get('/files/list/all');
      if (response.data && response.data.data) {
        response.data.files = (response.data.data.files || []).map(mapFile);
      }
      return response;
    },
    upload: async (file, parentFolderId, onProgress, signal) => {
      if (USE_MOCK) {
        const totalSteps = 10;
        for (let i = 1; i <= totalSteps; i++) {
          await delay(150);
          if (onProgress) onProgress((i / totalSteps) * 100);
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType = 'other';
        if (['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'].includes(ext)) fileType = 'image';
        else if (['pdf'].includes(ext)) fileType = 'pdf';
        else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) fileType = 'video';
        else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) fileType = 'document';
        else if (['zip', 'rar', 'tar', 'gz'].includes(ext)) fileType = 'zip';
        else if (['mp3', 'wav', 'ogg'].includes(ext)) fileType = 'audio';

        const newFile = mockDB.createMockFile(file.name, file.size, fileType, parentFolderId);
        return { data: newFile };
      }

      const CHUNK_THRESHOLD = 5 * 1024 * 1024; // 5MB
      if (file.size > CHUNK_THRESHOLD) {
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        // 1. Initialize Chunk Upload Session
        let uploadId;
        let uploadedChunks = [];
        try {
          const initRes = await api.post('/files/upload/chunk/init', {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            folderId: parentFolderId,
            totalChunks,
          }, { signal });
          uploadId = initRes.data.data.uploadId;
          uploadedChunks = initRes.data.data.uploadedChunks || [];
        } catch (err) {
          console.error('Failed to initialize chunk upload', err);
          throw err;
        }

        // 2. Upload chunks sequentially
        const delayMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          if (uploadedChunks.includes(chunkIndex)) {
            const currentProgress = Math.round(((chunkIndex + 1) * 100) / totalChunks);
            if (onProgress) {
              onProgress(currentProgress, { statusText: `Chunk ${chunkIndex + 1}/${totalChunks}` });
            }
            continue;
          }

          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);

          let chunkUploaded = false;
          let attempt = 0;

          while (!chunkUploaded) {
            try {
              const formData = new FormData();
              formData.append('uploadId', uploadId);
              formData.append('chunkIndex', chunkIndex.toString());
              formData.append('file', chunkBlob, file.name);

              if (onProgress) {
                const baseProgress = Math.round((chunkIndex * 100) / totalChunks);
                onProgress(baseProgress, { statusText: `Uploading chunk ${chunkIndex + 1}/${totalChunks}...` });
              }

              const res = await api.post('/files/upload/chunk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal,
                onUploadProgress: (progressEvent) => {
                  if (progressEvent.total && onProgress) {
                    const chunkPercent = (progressEvent.loaded / progressEvent.total) * 100;
                    const overallPercent = Math.round(
                      (chunkIndex * 100) / totalChunks + chunkPercent / totalChunks
                    );
                    onProgress(overallPercent, { statusText: `Uploading chunk ${chunkIndex + 1}/${totalChunks}...` });
                  }
                }
              });

              uploadedChunks = res.data.data.uploadedChunks || [];
              chunkUploaded = true;
            } catch (error) {
              if (signal?.aborted || error?.name === 'CanceledError' || error?.message === 'canceled') {
                throw error;
              }

              attempt++;
              console.warn(`Chunk upload failed (index: ${chunkIndex}, attempt: ${attempt}). Retrying...`, error);

              // Update state in UI to reconnecting
              const currentProgress = Math.round((chunkIndex * 100) / totalChunks);
              if (onProgress) {
                onProgress(currentProgress, { statusText: 'Reconnecting... Auto-resuming' });
              }

              const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
              await delayMs(backoffTime);

              try {
                const statusRes = await api.get(`/files/upload/chunk/status/${uploadId}`, { signal });
                uploadedChunks = statusRes.data.data.uploadedChunks || [];

                if (uploadedChunks.includes(chunkIndex)) {
                  chunkUploaded = true;
                }
              } catch (statusError) {
                if (signal?.aborted || statusError?.name === 'CanceledError' || statusError?.message === 'canceled') {
                  throw statusError;
                }
                console.warn('Failed to fetch status from server, still retrying...', statusError);
              }
            }
          }
        }

        // 3. Complete chunk upload & trigger assembly
        if (onProgress) {
          onProgress(99, { statusText: 'Assembling file...' });
        }

        const completeRes = await api.post('/files/upload/chunk/complete', { uploadId }, { signal });

        if (onProgress) {
          onProgress(100, { statusText: 'Complete' });
        }

        if (completeRes.data && completeRes.data.data) {
          completeRes.data = mapFile(completeRes.data.data.file);
        }
        return completeRes;
      }

      // Default fallback for small files (<= 5MB)
      const formData = new FormData();
      formData.append('file', file);
      if (parentFolderId) formData.append('folderId', parentFolderId);

      const response = await api.post('/files/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      if (response.data && response.data.data) {
        response.data = mapFile(response.data.data.file);
      }
      return response;
    },
    rename: async (id, name) => {
      if (USE_MOCK) {
        await delay(300);
        const updated = mockDB.renameMockFile(id, name);
        return { data: updated };
      }
      const response = await api.patch(`/files/${id}/rename`, { name });
      if (response.data && response.data.data) {
        response.data = mapFile(response.data.data.file);
      }
      return response;
    },
    delete: async (id, permanent = false) => {
      if (USE_MOCK) {
        await delay(300);
        mockDB.deleteMockFile(id, permanent);
        return { data: { success: true } };
      }
      return api.delete(`/files/${id}${permanent ? '?permanent=true' : ''}`);
    },
    restore: async (id) => {
      if (USE_MOCK) {
        await delay(300);
        mockDB.restoreMockFile(id);
        return { data: { success: true } };
      }
      return api.patch(`/files/${id}/restore`);
    },
    toggleFavorite: async (id) => {
      if (USE_MOCK) {
        await delay(200);
        const updated = mockDB.toggleFileProperty(id, 'isFavorite');
        mockDB.toggleFileProperty(id, 'isStarred');
        return { data: updated };
      }
      const response = await api.patch(`/files/${id}/favourite`);
      if (response.data && response.data.data) {
        response.data = mapFile(response.data.data.file);
      }
      return response;
    },
    togglePin: async (id) => {
      if (USE_MOCK) {
        await delay(200);
        const updated = mockDB.toggleFileProperty(id, 'isPinned');
        return { data: updated };
      }
      const response = await api.patch(`/files/${id}/star`);
      if (response.data && response.data.data) {
        response.data = mapFile(response.data.data.file);
      }
      return response;
    },
    toggleLock: async (id) => {
      if (USE_MOCK) {
        await delay(200);
        const updated = mockDB.toggleFileProperty(id, 'isLocked');
        return { data: updated };
      }
      const response = await api.patch(`/files/${id}/lock`);
      if (response.data && response.data.data) {
        response.data = mapFile(response.data.data.file);
      }
      return response;
    },
    toggleArchive: async (id) => {
      if (USE_MOCK) {
        await delay(200);
        const updated = mockDB.toggleFileProperty(id, 'isArchived');
        return { data: updated };
      }
      const response = await api.patch(`/files/${id}/archive`);
      if (response.data && response.data.data) {
        response.data = mapFile(response.data.data.file);
      }
      return response;
    },
    move: async (id, targetFolderId) => {
      if (USE_MOCK) {
        await delay(400);
        const updated = mockDB.moveMockFile(id, targetFolderId);
        return { data: updated };
      }
      const response = await api.patch(`/files/${id}/move`, { targetFolderId });
      if (response.data && response.data.data) {
        response.data = mapFile(response.data.data.file);
      }
      return response;
    },
    duplicate: async (id) => {
      if (USE_MOCK) {
        await delay(400);
        const copied = mockDB.duplicateMockFile(id);
        return { data: copied };
      }
      const response = await api.post(`/files/${id}/duplicate`);
      if (response.data && response.data.data) {
        response.data = mapFile(response.data.data.file);
      }
      return response;
    },
    download: async (id, name) => {
      if (USE_MOCK) {
        await delay(600);
        const blob = new Blob(['CloudVault Mock File Data'], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return { data: { success: true } };
      }

      const response = await api.get(`/files/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return { data: { success: true } };
    }
  },

  // Dashboard Statistics
  dashboard: {
    getStats: async () => {
      if (USE_MOCK) {
        await delay(300);
        const user = mockDB.getMockUser();
        const activities = mockDB.getMockActivities();
        const stats = mockDB.getStorageStats();
        const uploadHistory = mockDB.getUploadHistoryData();

        const allFiles = mockDB.getMockFiles().filter(f => !f.isDeleted);
        const pinned = allFiles.filter(f => f.isPinned || f.isStarred);
        const recent = [...allFiles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
        const favourites = allFiles.filter(f => f.isFavorite || f.isFavourite);
        const trashFiles = mockDB.getMockFiles().filter(f => f.isDeleted);
        const trashFolders = mockDB.getMockFolders().filter(f => f.isDeleted);
        const recycleBin = {
          filesCount: trashFiles.length,
          foldersCount: trashFolders.length,
          totalSize: trashFiles.reduce((acc, f) => acc + f.size, 0)
        };
        const counts = {
          files: allFiles.length,
          folders: mockDB.getMockFolders().filter(f => !f.isDeleted).length
        };

        return {
          data: {
            user,
            stats,
            uploadHistory,
            pinnedFiles: pinned,
            recentFiles: recent,
            recentUploads: recent,
            activities,
            storageUsed: user.storageUsed,
            storageRemaining: Math.max(0, user.storageLimit - user.storageUsed),
            favouriteFiles: favourites,
            recycleBin,
            counts
          }
        };
      }

      const response = await api.get('/files/list/dashboard-stats');
      if (response.data && response.data.data) {
        response.data = {
          user: response.data.data.user,
          stats: response.data.data.stats,
          uploadHistory: response.data.data.uploadHistory,
          pinnedFiles: (response.data.data.pinnedFiles || []).map(mapFile),
          recentFiles: (response.data.data.recentFiles || []).map(mapFile),
          recentUploads: (response.data.data.recentUploads || []).map(mapFile),
          activities: response.data.data.activities,
          storageUsed: response.data.data.storageUsed,
          storageRemaining: response.data.data.storageRemaining,
          favouriteFiles: (response.data.data.favouriteFiles || []).map(mapFile),
          recycleBin: response.data.data.recycleBin,
          counts: response.data.data.counts
        };
      }
      return response;
    }
  },

  // Recycle Bin operations
  recycleBin: {
    getItems: async () => {
      if (USE_MOCK) {
        await delay(300);
        const deletedFolders = mockDB.getMockFolders().filter(f => f.isDeleted);
        const deletedFiles = mockDB.getMockFiles().filter(f => f.isDeleted);
        return { data: { folders: deletedFolders, files: deletedFiles } };
      }
      const response = await api.get('/files/list/trash');
      if (response.data && response.data.data) {
        response.data = {
          folders: (response.data.data.folders || []).map(mapFolder),
          files: (response.data.data.files || []).map(mapFile),
        };
      }
      return response;
    },
    empty: async () => {
      if (USE_MOCK) {
        await delay(400);
        mockDB.emptyMockRecycleBin();
        return { data: { success: true } };
      }
      return api.delete('/files/trash/empty');
    }
  },

  // Favorites list
  favorites: {
    getItems: async () => {
      if (USE_MOCK) {
        await delay(300);
        const files = mockDB.getMockFiles().filter(f => !f.isDeleted && f.isFavorite);
        return { data: { folders: [], files } };
      }
      const response = await api.get('/files/list/favorites');
      if (response.data && response.data.data) {
        response.data = {
          folders: [],
          files: (response.data.data.files || []).map(mapFile),
        };
      }
      return response;
    }
  },

  shared: {
    getItems: async () => {
      if (USE_MOCK) {
        await delay(350);
        const allFiles = mockDB.getMockFiles().filter(f => !f.isDeleted);

        const sharedWithMe = allFiles.filter(f => f.owner.email !== 'alex.rivera@cloudvault.com').map(f => ({
          ...f,
          sharedBy: f.owner,
          permission: 'viewer',
          expiration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        }));

        const sharedByMe = allFiles.filter(f => f.owner.email === 'alex.rivera@cloudvault.com' && f.isLocked).map(f => ({
          ...f,
          sharedWith: [
            { name: 'Sarah Connor', email: 'sarah.c@cloudvault.com', avatar: '', permission: 'viewer' }
          ]
        }));

        return { data: { sharedWithMe, sharedByMe } };
      }
      const response = await api.get('/files/list/shared');
      if (response.data && response.data.data) {
        response.data = {
          sharedWithMe: (response.data.data.sharedWithMe || []).map(mapFile),
          sharedByMe: (response.data.data.sharedByMe || []).map(mapFile),
        };
      }
      return response;
    },
    share: async (id, data) => {
      if (USE_MOCK) {
        await delay(300);
        return {
          status: 200,
          data: {
            status: 'success',
            data: {
              share: {
                _id: 'mock_share_' + Math.random().toString(36).substring(2, 9),
                fileId: id,
                permission: data.permission || 'read',
                expiresAt: data.expiresAt || null,
                sharedWith: data.email ? { name: data.email.split('@')[0], email: data.email } : null
              }
            }
          }
        };
      }
      return api.post(`/files/${id}/share`, data);
    },
    getShares: async (id) => {
      if (USE_MOCK) {
        await delay(200);
        return {
          status: 200,
          data: {
            shares: [
              {
                _id: 'mock_share_1',
                fileId: id,
                permission: 'read',
                expiresAt: null,
                sharedWith: { name: 'Sarah Connor', email: 'sarah.c@cloudvault.com' }
              }
            ]
          }
        };
      }
      return api.get(`/files/${id}/shares`);
    },
    revoke: async (shareId) => {
      if (USE_MOCK) {
        await delay(200);
        return { status: 200, data: { success: true } };
      }
      return api.delete(`/files/shares/${shareId}`);
    },
    getPublicInfo: async (shareId) => {
      if (USE_MOCK) {
        await delay(300);
        return {
          status: 200,
          data: {
            status: 'success',
            data: {
              file: {
                name: 'Mock Shared File.pdf',
                size: 14.5 * 1024 * 1024,
                mimeType: 'application/pdf',
                extension: '.pdf'
              },
              ownerName: 'Alex Rivera',
              isPasswordProtected: true
            }
          }
        };
      }
      return api.get(`/files/shared/public/${shareId}`);
    },
    verifyPublicPassword: async (shareId, password) => {
      if (USE_MOCK) {
        await delay(300);
        if (password === 'wrong') {
          throw { response: { status: 401, data: { message: 'Invalid password' } } };
        }
        return { status: 200, data: { status: 'success' } };
      }
      return api.post(`/files/shared/public/${shareId}/verify`, { password });
    }
  },

  admin: {
    getStats: async () => {
      if (USE_MOCK) {
        await delay(300);
        return {
          data: {
            stats: {
              usersCount: 8,
              filesCount: 142,
              blockedUsersCount: 1,
              totalStorageUsed: 42.5 * 1024 * 1024 * 1024,
              totalStorageLimit: 80 * 1024 * 1024 * 1024,
              uploadsCount: 142,
              downloadsCount: 589
            },
            topUsers: [
              { id: '1', name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', storageUsed: 15.4 * 1024 * 1024 * 1024, role: 'admin', isBlocked: false },
              { id: '2', name: 'Sarah Connor', email: 'sarah.c@cloudvault.com', storageUsed: 12.1 * 1024 * 1024 * 1024, role: 'user', isBlocked: false },
              { id: '3', name: 'John Doe', email: 'john.doe@cloudvault.com', storageUsed: 8.5 * 1024 * 1024 * 1024, role: 'user', isBlocked: false }
            ],
            blockedUsers: [
              { id: '4', name: 'Malicious Actor', email: 'mal@actor.com', storageUsed: 0, role: 'user', isBlocked: true }
            ],
            logs: [
              { id: 'log-1', action: 'file_upload', message: 'Alex Rivera uploaded "Quarterly_Report.pdf"', timestamp: new Date().toISOString() },
              { id: 'log-2', action: 'user_register', message: 'New user registration: John Doe (john.doe@cloudvault.com)', timestamp: new Date(Date.now() - 3600000).toISOString() },
              { id: 'log-3', action: 'user_block', message: 'Administrator blocked user "Malicious Actor"', timestamp: new Date(Date.now() - 7200000).toISOString() }
            ]
          }
        };
      }
      const response = await api.get('/admin/stats');
      // Normalize: backend returns { status, data: { stats, topUsers, ... } }
      // Axios wraps it in response.data, so actual data is at response.data.data
      if (response.data && response.data.data) {
        response.data = response.data.data;
      }
      return response;
    },
    getUsers: async () => {
      if (USE_MOCK) {
        await delay(300);
        return {
          data: {
            users: [
              { _id: '1', name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', storageUsed: 15.4 * 1024 * 1024 * 1024, role: 'admin', isBlocked: false, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
              { _id: '2', name: 'Sarah Connor', email: 'sarah.c@cloudvault.com', storageUsed: 12.1 * 1024 * 1024 * 1024, role: 'user', isBlocked: false, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
              { _id: '3', name: 'John Doe', email: 'john.doe@cloudvault.com', storageUsed: 8.5 * 1024 * 1024 * 1024, role: 'user', isBlocked: false, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
              { _id: '4', name: 'Malicious Actor', email: 'mal@actor.com', storageUsed: 0, role: 'user', isBlocked: true, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
            ]
          }
        };
      }
      const response = await api.get('/admin/users');
      // Normalize: unwrap nested data envelope
      if (response.data && response.data.data) {
        response.data = response.data.data;
      }
      return response;
    },
    toggleBlockUser: async (id) => {
      if (USE_MOCK) {
        await delay(200);
        return { data: { success: true } };
      }
      return api.patch(`/admin/users/${id}/toggle-block`);
    },
    deleteFile: async (id) => {
      if (USE_MOCK) {
        await delay(200);
        return { data: { success: true } };
      }
      return api.delete(`/admin/files/${id}`);
    }
  }
};

export default api;
export { USE_MOCK };
