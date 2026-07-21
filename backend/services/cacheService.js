const { getCache, setCache, delCache, delPattern } = require('../config/redis');

class CacheService {
  // Key generators
  getRecentFilesKey(userId) {
    return `cloudvault:user:${String(userId)}:recent_files`;
  }

  getStorageUsageKey(userId) {
    return `cloudvault:user:${String(userId)}:storage_usage`;
  }

  getFolderTreeKey(userId) {
    return `cloudvault:user:${String(userId)}:folder_tree`;
  }

  getProfileKey(userId) {
    return `cloudvault:user:${String(userId)}:profile`;
  }

  parseCached(cached) {
    if (!cached) return null;
    let result = cached;
    if (typeof result === 'string') {
      try { result = JSON.parse(result); } catch (e) {}
    }
    if (typeof result === 'string') {
      try { result = JSON.parse(result); } catch (e) {}
    }
    return result;
  }

  // 1. Recent Files Cache Operations
  async getRecentFiles(userId) {
    const cached = await getCache(this.getRecentFilesKey(userId));
    return this.parseCached(cached);
  }

  async setRecentFiles(userId, files, ttl = 300) { // 5 mins
    await setCache(this.getRecentFilesKey(userId), files, ttl);
  }

  async invalidateRecentFiles(userId) {
    await delCache(this.getRecentFilesKey(userId));
  }

  // 2. Storage Usage Cache Operations
  async getStorageUsage(userId) {
    const cached = await getCache(this.getStorageUsageKey(userId));
    return this.parseCached(cached);
  }

  async setStorageUsage(userId, storageData, ttl = 300) { // 5 mins
    await setCache(this.getStorageUsageKey(userId), storageData, ttl);
  }

  async invalidateStorageUsage(userId) {
    await delCache(this.getStorageUsageKey(userId));
  }

  // 3. Folder Tree Cache Operations
  async getFolderTree(userId) {
    const cached = await getCache(this.getFolderTreeKey(userId));
    return this.parseCached(cached);
  }

  async setFolderTree(userId, folderTree, ttl = 300) { // 5 mins
    await setCache(this.getFolderTreeKey(userId), folderTree, ttl);
  }

  async invalidateFolderTree(userId) {
    await delCache(this.getFolderTreeKey(userId));
  }

  // 4. Profile Cache Operations
  async getProfile(userId) {
    const cached = await getCache(this.getProfileKey(userId));
    return this.parseCached(cached);
  }

  async setProfile(userId, profile, ttl = 600) { // 10 mins
    await setCache(this.getProfileKey(userId), profile, ttl);
  }

  async invalidateProfile(userId) {
    await delCache(this.getProfileKey(userId));
  }

  // Convenience helper to invalidate all cached data for a user on major changes
  async invalidateUserAll(userId) {
    await Promise.all([
      this.invalidateRecentFiles(userId),
      this.invalidateStorageUsage(userId),
      this.invalidateFolderTree(userId),
      this.invalidateProfile(userId),
    ]);
  }
}

module.exports = new CacheService();
