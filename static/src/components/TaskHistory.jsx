import React, { useState, useEffect } from 'react';

function TaskHistory() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0
  });

  useEffect(() => {
    fetchTasks();
  }, [pagination.current_page]);

  const fetchTasks = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`/api/admin/flower-tasks?page=${pagination.current_page}&per_page=${pagination.per_page}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshTaskStatus = async (task) => {
    if (!task.task_id) return;

    try {
      setRefreshing(prev => ({ ...prev, [task.task_id]: true }));
      const response = await fetch(`/api/admin/flower-tasks/${task.task_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to refresh task status');
      }
      
      const data = await response.json();
      
      // Update the task status in the list
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.task_id === task.task_id 
            ? { ...t, status: data.state }
            : t
        )
      );
    } catch (error) {
      console.error('Error refreshing task status:', error);
    } finally {
      setRefreshing(prev => ({ ...prev, [task.task_id]: false }));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-success';
      case 'FAILURE':
        return 'bg-danger';
      case 'PENDING':
        return 'bg-warning';
      case 'STARTED':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Task History</h3>
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={fetchTasks}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh All
        </button>
      </div>
      <div className="card-body">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="text-muted">No tasks found</div>
        ) : (
          <div className="list-group">
            {tasks.map((task, index) => (
              <div key={index} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{task.task_name}</h5>
                    <small className="text-muted d-block">
                      Created: {formatDate(task.timestamp)}
                    </small>
                    <small className="text-muted">
                      Task ID: {task.task_id}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                      {task.status}
                    </span>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => refreshTaskStatus(task)}
                      disabled={refreshing[task.task_id]}
                    >
                      <i className={`bi ${refreshing[task.task_id] ? 'bi-hourglass-split' : 'bi-arrow-clockwise'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <nav className="mt-3">
            <ul className="pagination justify-content-center">
              {[...Array(pagination.total_pages)].map((_, i) => (
                <li 
                  key={i} 
                  className={`page-item ${pagination.current_page === i + 1 ? 'active' : ''}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPagination(prev => ({ ...prev, current_page: i + 1 }))}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

export default TaskHistory; 