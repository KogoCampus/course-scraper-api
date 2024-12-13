import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TaskHistory from '../components/TaskHistory';

function CreateTaskPage() {
  const [taskName, setTaskName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [flowerStatus, setFlowerStatus] = useState({
    checking: true,
    healthy: false,
    url: ''
  });

  useEffect(() => {
    checkFlowerHealth();
  }, []);

  const checkFlowerHealth = async () => {
    try {
      const response = await fetch('/api/admin/flower-health');
      const data = await response.json();
      setFlowerStatus({
        checking: false,
        healthy: data.healthy,
        url: data.flower_url
      });
    } catch (error) {
      setFlowerStatus({
        checking: false,
        healthy: false,
        url: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('task_name', taskName);

      const response = await fetch('/api/admin/flower-tasks', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setTaskName('');
      } else {
        throw new Error(data.detail || 'Failed to create task');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFlowerStatus = () => {
    if (flowerStatus.checking) {
      return (
        <div className="alert alert-info">
          <i className="bi bi-hourglass-split me-2"></i>
          Checking Flower service availability...
        </div>
      );
    }

    if (!flowerStatus.healthy) {
      return (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Flower service is not available at:
          <br />
          <code className="ms-2">{flowerStatus.url}</code>
          <div className="mt-2 small">
            Task creation and status updates will not work until the service is available.
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container mt-4">
      <Link to="/" className="btn btn-outline-secondary mb-3">
        <i className="bi bi-arrow-left me-2"></i>
        Back to Home
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create Scraper Task</h1>
        <a
          href="https://fnxxpzmiie.us-west-2.awsapprunner.com/tasks"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline-primary"
        >
          <i className="bi bi-flower1 me-2"></i>
          View All Tasks in Flower
        </a>
      </div>

      {renderFlowerStatus()}

      {!flowerStatus.checking && flowerStatus.healthy && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Create New Task</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Task Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || !taskName}
                  >
                    {loading ? 'Creating...' : 'Create Task'}
                  </button>
                </form>

                {error && (
                  <div className="alert alert-danger mt-3">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success mt-3">
                    {success}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <TaskHistory />
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateTaskPage; 