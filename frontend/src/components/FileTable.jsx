import React, { useState } from 'react';
import {
  Folder, FileText, Image as ImageIcon, Video, FileArchive, File,
  MoreVertical, Star, ArrowUp, ArrowDown
} from 'lucide-react';
import { formatBytes } from '../services/mockData';
import { UserAvatar } from './UI';

export const FileTable = ({
  files, folders, onNavigateFolder, onContextMenu
}) => {
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedItems = () => {
    const combined = [
      ...folders.map(f => ({ item: f, type: 'folder' })),
      ...files.map(f => ({ item: f, type: 'file' }))
    ];

    return combined.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        const nameA = a.item.name.toLowerCase();
        const nameB = b.item.name.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'size') {
        const sizeA = a.type === 'folder' ? 0 : a.item.size;
        const sizeB = b.type === 'folder' ? 0 : b.item.size;
        comparison = sizeA - sizeB;
      } else if (sortField === 'date') {
        const dateA = new Date(a.item.createdAt).getTime();
        const dateB = new Date(b.item.createdAt).getTime();
        comparison = dateA - dateB;
      }

      if (a.type !== b.type && sortField === 'name') {
        return a.type === 'folder' ? -1 : 1;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const getFileIcon = (item, type) => {
    if (type === 'folder') {
      return <Folder className="w-4 h-4" style={{ color: item.color || '#3B82F6' }} />;
    }
    
    switch (item.type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-violet-500" />;
      case 'zip':
        return <FileArchive className="w-4 h-4 text-amber-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  const sortedItems = getSortedItems();

  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-premium text-left">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/20 select-none">
            <th
              onClick={() => handleSort('name')}
              className="py-3.5 px-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>Name</span>
                {renderSortArrow('name')}
              </div>
            </th>
            <th
              onClick={() => handleSort('size')}
              className="py-3.5 px-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>Size</span>
                {renderSortArrow('size')}
              </div>
            </th>
            <th className="py-3.5 px-5">Owner</th>
            <th
              onClick={() => handleSort('date')}
              className="py-3.5 px-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>Last Modified</span>
                {renderSortArrow('date')}
              </div>
            </th>
            <th className="py-3.5 px-5 text-right w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {sortedItems.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                No items found in this directory.
              </td>
            </tr>
          ) : (
            sortedItems.map(({ item, type }) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <tr
                  key={item.id}
                  onContextMenu={(e) => onContextMenu(e, item, type)}
                  onDoubleClick={() => {
                    if (type === 'folder') onNavigateFolder(item.id);
                  }}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors text-sm text-slate-700 dark:text-slate-350 cursor-pointer select-none"
                >
                  <td className="py-3 px-5 font-medium text-slate-800 dark:text-slate-100 max-w-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {getFileIcon(item, type)}
                      </div>
                      <span className="truncate group-hover:text-primary dark:group-hover:text-white transition-colors" title={item.name}>
                        {item.name}
                      </span>
                      {type === 'file' && item.isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                      )}
                      {type === 'file' && item.isLocked && (
                        <Lock className="w-3.5 h-3.5 text-slate-450 dark:text-slate-500 flex-shrink-0" />
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-5 text-slate-500 dark:text-slate-400 font-medium">
                    {type === 'folder' ? '—' : formatBytes(item.size)}
                  </td>

                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        name={item.owner.name}
                        avatar={item.owner.avatar}
                        size="xs"
                        className="rounded-full"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[100px]">
                        {item.owner.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-5 text-slate-500 dark:text-slate-400">
                    {formattedDate}
                  </td>

                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, item, type);
                      }}
                      className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100 inline-block"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
export default FileTable;
