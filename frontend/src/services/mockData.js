// Storage Keys
const FOLDERS_KEY = 'cloudvault_folders';
const FILES_KEY = 'cloudvault_files';
const ACTIVITIES_KEY = 'cloudvault_activities';
const USER_KEY = 'cloudvault_user';
const SESSIONS_KEY = 'cloudvault_sessions';

// Helper to convert size bytes to readable format
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const defaultUser = {
  id: 'user_1',
  name: 'Alex Rivera',
  email: 'alex.rivera@cloudvault.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
  storageUsed: 68 * 1024 * 1024 * 1024, // 68 GB
  storageLimit: 512 * 1024 * 1024 * 1024, // 512 GB
  role: 'Senior Project Lead'
};

const defaultSessions = [
  { id: 'sess_1', device: 'MacBook Pro 16"', ip: '192.168.1.15', location: 'San Francisco, CA', lastActive: 'Active Now', isCurrent: true },
  { id: 'sess_2', device: 'iPhone 15 Pro Max', ip: '172.56.21.90', location: 'San Francisco, CA', lastActive: '2 hours ago', isCurrent: false },
  { id: 'sess_3', device: 'iPad Pro', ip: '192.168.1.20', location: 'San Francisco, CA', lastActive: '3 days ago', isCurrent: false },
];

const defaultFolders = [
  {
    id: 'fld_work',
    name: 'Work Documents',
    description: 'All work-related assets, reports, and team deliverables.',
    color: '#3B82F6',
    parentFolderId: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false,
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar }
  },
  {
    id: 'fld_design',
    name: 'Design System',
    description: 'Figma templates, asset brandings, assets, and design system guidelines.',
    color: '#8B5CF6',
    parentFolderId: 'fld_work',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false,
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar }
  },
  {
    id: 'fld_marketing',
    name: 'Marketing Campaigns',
    description: 'Social graphics, copies, videos, and analytics reports.',
    color: '#EC4899',
    parentFolderId: 'fld_work',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false,
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar }
  },
  {
    id: 'fld_personal',
    name: 'Personal Assets',
    description: 'Travel pictures, housing contracts, taxes, and general utilities.',
    color: '#10B981',
    parentFolderId: null,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false,
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar }
  },
  {
    id: 'fld_finance',
    name: 'Financial Reports',
    description: 'Taxes, billing receipts, invoice sheets, and budget logs.',
    color: '#F59E0B',
    parentFolderId: null,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false,
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar }
  }
];

const defaultFiles = [
  {
    id: 'file_1',
    name: 'Q3 Product Strategy.pdf',
    size: 4.8 * 1024 * 1024,
    type: 'pdf',
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar },
    isFavorite: true,
    isStarred: true,
    isPinned: true,
    isArchived: false,
    isLocked: false,
    parentFolderId: 'fld_work',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false
  },
  {
    id: 'file_2',
    name: 'Brand Guidelines 2026.pdf',
    size: 24.5 * 1024 * 1024,
    type: 'pdf',
    owner: { name: 'Sarah Connor', email: 'sarah.c@cloudvault.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop' },
    isFavorite: false,
    isStarred: false,
    isPinned: true,
    isArchived: false,
    isLocked: true,
    parentFolderId: 'fld_design',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false
  },
  {
    id: 'file_3',
    name: 'Dashboard UI mockup.png',
    size: 3.2 * 1024 * 1024,
    type: 'image',
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar },
    isFavorite: true,
    isStarred: true,
    isPinned: false,
    isArchived: false,
    isLocked: false,
    parentFolderId: 'fld_design',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false
  },
  {
    id: 'file_4',
    name: 'Quarterly Finances.xlsx',
    size: 1.2 * 1024 * 1024,
    type: 'document',
    owner: { name: 'Marcus Aurelius', email: 'marcus@cloudvault.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop' },
    isFavorite: false,
    isStarred: false,
    isPinned: false,
    isArchived: false,
    isLocked: false,
    parentFolderId: 'fld_finance',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false
  },
  {
    id: 'file_5',
    name: 'Promo Video Draft.mp4',
    size: 184 * 1024 * 1024,
    type: 'video',
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar },
    isFavorite: false,
    isStarred: false,
    isPinned: false,
    isArchived: false,
    isLocked: false,
    parentFolderId: 'fld_marketing',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false
  },
  {
    id: 'file_6',
    name: 'Tax Declaration 2025.pdf',
    size: 1.8 * 1024 * 1024,
    type: 'pdf',
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar },
    isFavorite: false,
    isStarred: false,
    isPinned: false,
    isArchived: true,
    isLocked: false,
    parentFolderId: null,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false
  },
  {
    id: 'file_7',
    name: 'Project Roadmap.docx',
    size: 780 * 1024,
    type: 'document',
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar },
    isFavorite: true,
    isStarred: false,
    isPinned: false,
    isArchived: false,
    isLocked: false,
    parentFolderId: null,
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: false
  },
  {
    id: 'file_8',
    name: 'Old Layout Wireframes.zip',
    size: 45 * 1024 * 1024,
    type: 'zip',
    owner: { name: 'Alex Rivera', email: 'alex.rivera@cloudvault.com', avatar: defaultUser.avatar },
    isFavorite: false,
    isStarred: false,
    isPinned: false,
    isArchived: false,
    isLocked: false,
    parentFolderId: null,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    isDeleted: true,
    deletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const defaultActivities = [
  {
    id: 'act_1',
    type: 'upload',
    targetName: 'Q3 Product Strategy.pdf',
    targetType: 'file',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hr ago
    details: 'Uploaded to Work Documents',
    user: { name: 'Alex Rivera', avatar: defaultUser.avatar }
  },
  {
    id: 'act_2',
    type: 'rename',
    targetName: 'Quarterly Finances.xlsx',
    targetType: 'file',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    details: 'Renamed from "Financial draft.xlsx"',
    user: { name: 'Marcus Aurelius', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop' }
  },
  {
    id: 'act_3',
    type: 'share',
    targetName: 'Brand Guidelines 2026.pdf',
    targetType: 'file',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    details: 'Shared access set to "viewer" for Alex Rivera',
    user: { name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop' }
  },
  {
    id: 'act_4',
    type: 'delete',
    targetName: 'Old Layout Wireframes.zip',
    targetType: 'file',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    details: 'Moved to Recycle Bin',
    user: { name: 'Alex Rivera', avatar: defaultUser.avatar }
  }
];

// Initialize Mock Data
export const initializeMockDB = () => {
  if (!localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, JSON.stringify(defaultUser));
  }
  if (!localStorage.getItem(SESSIONS_KEY)) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(defaultSessions));
  }
  if (!localStorage.getItem(FOLDERS_KEY)) {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(defaultFolders));
  }
  if (!localStorage.getItem(FILES_KEY)) {
    localStorage.setItem(FILES_KEY, JSON.stringify(defaultFiles));
  }
  if (!localStorage.getItem(ACTIVITIES_KEY)) {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(defaultActivities));
  }
};

// Database Accessors
export const getMockUser = () => {
  initializeMockDB();
  return JSON.parse(localStorage.getItem(USER_KEY));
};

export const updateMockUser = (user) => {
  const current = getMockUser();
  const updated = { ...current, ...user };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
};

export const getMockSessions = () => {
  initializeMockDB();
  return JSON.parse(localStorage.getItem(SESSIONS_KEY));
};

export const deleteMockSession = (id) => {
  const sessions = getMockSessions().filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return sessions;
};

export const getMockFolders = () => {
  initializeMockDB();
  return JSON.parse(localStorage.getItem(FOLDERS_KEY));
};

export const getMockFiles = () => {
  initializeMockDB();
  return JSON.parse(localStorage.getItem(FILES_KEY));
};

export const getMockActivities = () => {
  initializeMockDB();
  return JSON.parse(localStorage.getItem(ACTIVITIES_KEY));
};

// Add Action to Log Activities
const logActivity = (type, targetName, targetType, details) => {
  const activities = getMockActivities();
  const user = getMockUser();
  const newActivity = {
    id: `act_${Math.random().toString(36).substring(2, 9)}`,
    type,
    targetName,
    targetType,
    timestamp: new Date().toISOString(),
    details,
    user: { name: user.name, avatar: user.avatar }
  };
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([newActivity, ...activities].slice(0, 50)));
};

// Folder Operations
export const createMockFolder = (name, parentFolderId, description = '') => {
  const folders = getMockFolders();
  const user = getMockUser();
  const newFolder = {
    id: `fld_${Math.random().toString(36).substring(2, 9)}`,
    name,
    description,
    color: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 6)],
    parentFolderId,
    createdAt: new Date().toISOString(),
    isDeleted: false,
    owner: { name: user.name, email: user.email, avatar: user.avatar }
  };
  localStorage.setItem(FOLDERS_KEY, JSON.stringify([...folders, newFolder]));
  logActivity('upload', name, 'folder', `Created folder in ${parentFolderId ? 'nested folder' : 'Root'}`);
  return newFolder;
};

export const renameMockFolder = (id, newName) => {
  const folders = getMockFolders();
  const folderIndex = folders.findIndex(f => f.id === id);
  if (folderIndex === -1) throw new Error('Folder not found');
  const oldName = folders[folderIndex].name;
  folders[folderIndex].name = newName;
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  logActivity('rename', newName, 'folder', `Renamed folder from "${oldName}"`);
  return folders[folderIndex];
};

export const deleteMockFolder = (id, permanent = false) => {
  const folders = getMockFolders();
  const files = getMockFiles();
  const folder = folders.find(f => f.id === id);
  if (!folder) return;

  if (permanent) {
    const recursiveDelete = (folderId) => {
      const subFolders = folders.filter(f => f.parentFolderId === folderId);
      subFolders.forEach(sub => recursiveDelete(sub.id));
      
      const idx = folders.findIndex(f => f.id === folderId);
      if (idx !== -1) folders.splice(idx, 1);
      
      const folderFiles = files.filter(f => f.parentFolderId === folderId);
      folderFiles.forEach(f => {
        const fileIdx = files.findIndex(file => file.id === f.id);
        if (fileIdx !== -1) files.splice(fileIdx, 1);
      });
    };
    recursiveDelete(id);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
    logActivity('delete', folder.name, 'folder', 'Permanently deleted folder and contents');
  } else {
    const softDeleteRecursive = (folderId) => {
      const folderIdx = folders.findIndex(f => f.id === folderId);
      if (folderIdx !== -1) {
        folders[folderIdx].isDeleted = true;
        folders[folderIdx].deletedAt = new Date().toISOString();
      }
      files.forEach(f => {
        if (f.parentFolderId === folderId) {
          f.isDeleted = true;
          f.deletedAt = new Date().toISOString();
        }
      });
      folders.filter(f => f.parentFolderId === folderId).forEach(sub => softDeleteRecursive(sub.id));
    };
    softDeleteRecursive(id);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
    logActivity('delete', folder.name, 'folder', 'Moved folder and contents to Recycle Bin');
  }
};

export const restoreMockFolder = (id) => {
  const folders = getMockFolders();
  const files = getMockFiles();
  const folder = folders.find(f => f.id === id);
  if (!folder) return;

  const restoreRecursive = (folderId) => {
    const idx = folders.findIndex(f => f.id === folderId);
    if (idx !== -1) {
      folders[idx].isDeleted = false;
      folders[idx].deletedAt = null;
    }
    files.forEach(f => {
      if (f.parentFolderId === folderId) {
        f.isDeleted = false;
        f.deletedAt = null;
      }
    });
    folders.filter(f => f.parentFolderId === folderId).forEach(sub => restoreRecursive(sub.id));
  };
  restoreRecursive(id);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
  logActivity('restore', folder.name, 'folder', 'Restored folder and contents');
};

export const moveMockFolder = (id, targetFolderId) => {
  const folders = getMockFolders();
  const idx = folders.findIndex(f => f.id === id);
  if (idx === -1) throw new Error('Folder not found');
  
  if (targetFolderId === id) throw new Error('Cannot move folder into itself');
  let currentParent = targetFolderId;
  while (currentParent) {
    const parent = folders.find(f => f.id === currentParent);
    if (parent?.parentFolderId === id) {
      throw new Error('Cannot move folder into one of its subfolders');
    }
    currentParent = parent ? parent.parentFolderId : null;
  }

  folders[idx].parentFolderId = targetFolderId;
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  logActivity('move', folders[idx].name, 'folder', `Moved to folder id: ${targetFolderId || 'Root'}`);
  return folders[idx];
};

// File Operations
export const createMockFile = (name, size, type, parentFolderId) => {
  const files = getMockFiles();
  const user = getMockUser();
  const newFile = {
    id: `file_${Math.random().toString(36).substring(2, 9)}`,
    name,
    size,
    type,
    owner: { name: user.name, email: user.email, avatar: user.avatar },
    isFavorite: false,
    isStarred: false,
    isPinned: false,
    isArchived: false,
    isLocked: false,
    parentFolderId,
    createdAt: new Date().toISOString(),
    isDeleted: false
  };
  localStorage.setItem(FILES_KEY, JSON.stringify([...files, newFile]));
  
  updateMockUser({ storageUsed: user.storageUsed + size });
  
  logActivity('upload', name, 'file', `Uploaded file to ${parentFolderId ? 'folder' : 'Root'}`);
  return newFile;
};

export const renameMockFile = (id, newName) => {
  const files = getMockFiles();
  const idx = files.findIndex(f => f.id === id);
  if (idx === -1) throw new Error('File not found');
  const oldName = files[idx].name;
  files[idx].name = newName;
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
  logActivity('rename', newName, 'file', `Renamed file from "${oldName}"`);
  return files[idx];
};

export const deleteMockFile = (id, permanent = false) => {
  const files = getMockFiles();
  const idx = files.findIndex(f => f.id === id);
  if (idx === -1) return;
  const file = files[idx];

  if (permanent) {
    const user = getMockUser();
    updateMockUser({ storageUsed: Math.max(0, user.storageUsed - file.size) });
    files.splice(idx, 1);
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
    logActivity('delete', file.name, 'file', 'Permanently deleted file');
  } else {
    file.isDeleted = true;
    file.deletedAt = new Date().toISOString();
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
    logActivity('delete', file.name, 'file', 'Moved file to Recycle Bin');
  }
};

export const restoreMockFile = (id) => {
  const files = getMockFiles();
  const idx = files.findIndex(f => f.id === id);
  if (idx === -1) return;
  files[idx].isDeleted = false;
  files[idx].deletedAt = null;
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
  logActivity('restore', files[idx].name, 'file', 'Restored file');
};

export const toggleFileProperty = (id, property) => {
  const files = getMockFiles();
  const idx = files.findIndex(f => f.id === id);
  if (idx === -1) throw new Error('File not found');
  
  files[idx][property] = !files[idx][property];
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
  
  const propName = property.replace('is', '');
  logActivity('rename', files[idx].name, 'file', `Toggled ${propName} status`);
  return files[idx];
};

export const moveMockFile = (id, targetFolderId) => {
  const files = getMockFiles();
  const idx = files.findIndex(f => f.id === id);
  if (idx === -1) throw new Error('File not found');
  
  files[idx].parentFolderId = targetFolderId;
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
  logActivity('move', files[idx].name, 'file', `Moved to folder id: ${targetFolderId || 'Root'}`);
  return files[idx];
};

export const duplicateMockFile = (id) => {
  const files = getMockFiles();
  const file = files.find(f => f.id === id);
  if (!file) throw new Error('File not found');

  const user = getMockUser();
  const nameParts = file.name.split('.');
  const ext = nameParts.pop();
  const baseName = nameParts.join('.');
  const duplicateName = `${baseName} (Copy).${ext}`;

  const duplicate = {
    ...file,
    id: `file_${Math.random().toString(36).substring(2, 9)}`,
    name: duplicateName,
    createdAt: new Date().toISOString(),
    isFavorite: false,
    isStarred: false,
    isPinned: false
  };

  localStorage.setItem(FILES_KEY, JSON.stringify([...files, duplicate]));
  updateMockUser({ storageUsed: user.storageUsed + file.size });
  logActivity('upload', duplicateName, 'file', `Duplicated file from "${file.name}"`);
  return duplicate;
};

export const copyMockFile = (id, targetFolderId) => {
  const file = duplicateMockFile(id);
  return moveMockFile(file.id, targetFolderId);
};

export const emptyMockRecycleBin = () => {
  const files = getMockFiles();
  const folders = getMockFolders();
  
  const cleanFiles = files.filter(f => !f.isDeleted);
  const cleanFolders = folders.filter(f => !f.isDeleted);
  
  localStorage.setItem(FILES_KEY, JSON.stringify(cleanFiles));
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(cleanFolders));
  
  logActivity('delete', 'Recycle Bin', 'file', 'Emptied recycle bin permanently');
};

// Storage Chart Helpers
export const getStorageStats = () => {
  const files = getMockFiles().filter(f => !f.isDeleted);
  
  let docsSize = 0, docsCount = 0;
  let imgsSize = 0, imgsCount = 0;
  let vidsSize = 0, vidsCount = 0;
  let othersSize = 0, othersCount = 0;

  files.forEach(f => {
    if (f.type === 'pdf' || f.type === 'document') {
      docsSize += f.size;
      docsCount++;
    } else if (f.type === 'image') {
      imgsSize += f.size;
      imgsCount++;
    } else if (f.type === 'video') {
      vidsSize += f.size;
      vidsCount++;
    } else {
      othersSize += f.size;
      othersCount++;
    }
  });

  return [
    { name: 'Documents & PDFs', value: docsSize, count: docsCount, color: '#2563EB' },
    { name: 'Images & Photos', value: imgsSize, count: imgsCount, color: '#10B981' },
    { name: 'Videos & Media', value: vidsSize, count: vidsCount, color: '#7C3AED' },
    { name: 'Others & Archives', value: othersSize, count: othersCount, color: '#F59E0B' }
  ];
};

export const getUploadHistoryData = () => {
  return [
    { name: 'Jan', size: 12 },
    { name: 'Feb', size: 19 },
    { name: 'Mar', size: 28 },
    { name: 'Apr', size: 32 },
    { name: 'May', size: 45 },
    { name: 'Jun', size: 58 },
    { name: 'Jul', size: 68 }
  ];
};
