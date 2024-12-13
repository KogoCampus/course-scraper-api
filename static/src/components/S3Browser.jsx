import React, { useState, useEffect } from 'react';
import { getPreviewType } from '../utils/filePreview';

function S3Browser({ onFileSelect }) {
  const [currentPath, setCurrentPath] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    is_truncated: false,
    next_continuation_token: null,
    key_count: 0
  });

  useEffect(() => {
    loadPath();
  }, []);

  const loadPath = async (path = '', continuationToken = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        prefix: path,
        max_keys: 100
      });

      if (continuationToken) {
        params.append('continuation_token', continuationToken);
      }

      const response = await fetch(`/api/admin/s3-list?${params}`);
      const data = await response.json();
      
      if (continuationToken) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      
      setPagination(data.pagination);
      setCurrentPath(path);
      updateBreadcrumbs(path);
    } catch (error) {
      console.error('Error loading path:', error);
    }
    setLoading(false);
  };

  const loadMore = () => {
    if (pagination.is_truncated && pagination.next_continuation_token) {
      loadPath(currentPath, pagination.next_continuation_token);
    }
  };

  const updateBreadcrumbs = (path) => {
    const parts = path ? path.split('/') : [];
    setBreadcrumbs([
      { path: '', label: 'Root' },
      ...parts.map((part, index) => ({
        path: parts.slice(0, index + 1).join('/'),
        label: part
      }))
    ]);
  };

  const handleFileSelect = async (item) => {
    if (item.type === 'directory') {
      loadPath(item.path);
      return;
    }

    setSelectedFile(item);
    const previewType = getPreviewType(item.name);
    onFileSelect(item, previewType);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">S3 Browser</h3>
      </div>
      <div className="card-body">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <li
                key={index}
                className="breadcrumb-item"
                onClick={() => loadPath(crumb.path)}
                style={{ cursor: 'pointer' }}
              >
                {crumb.label}
              </li>
            ))}
          </ol>
        </nav>

        <div className="list-group" style={{ opacity: loading ? 0.5 : 1 }}>
          {items.map((item, index) => (
            <div
              key={`${item.path}-${index}`}
              className={`list-group-item list-group-item-action ${
                selectedFile?.path === item.path ? 'active' : ''
              }`}
              onClick={() => handleFileSelect(item)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className={`bi ${item.type === 'directory' ? 'bi-folder' : 'bi-file-earmark-text'} me-2`}></i>
                  {item.name}
                  {item.type === 'file' && (
                    <small className="text-muted ms-2">
                      ({(item.size / 1024).toFixed(2)} KB)
                    </small>
                  )}
                </div>
                {item.last_modified && (
                  <small className="text-muted">
                    {formatDate(item.last_modified)}
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>

        {pagination.is_truncated && (
          <div className="text-center mt-3">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default S3Browser; 