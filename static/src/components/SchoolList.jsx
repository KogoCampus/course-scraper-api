import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SchoolList() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 5,
    total_items: 0,
    total_pages: 0
  });

  const PER_PAGE_OPTIONS = [5, 10, 30];
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, [pagination.current_page, pagination.per_page]);

  const fetchSchools = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.current_page,
        per_page: pagination.per_page
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/school-entries?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch schools');
      }
      
      const data = await response.json();
      setSchools(data.schools);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setError(error.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePerPageChange = (e) => {
    setPagination(prev => ({
      ...prev,
      per_page: parseInt(e.target.value),
      current_page: 1
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const handleUpdate = (school) => {
    navigate('/create', { 
      state: { 
        updateMode: true,
        schoolName: school.name,
        coursePath: school.course_data_path
      }
    });
  };

  const handleDelete = async (schoolName) => {
    if (!window.confirm(`Are you sure you want to delete the entry for "${schoolName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/school-entries/${encodeURIComponent(schoolName)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'School entry deleted successfully');
        fetchSchools();  // Refresh the list
      } else {
        throw new Error(data.detail || 'Failed to delete school entry');
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      alert(error.message || 'An unexpected error occurred while deleting the school entry');
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.current_page - 2);
    let endPage = Math.min(pagination.total_pages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`btn btn-sm ${pagination.current_page === i ? 'btn-primary' : 'btn-outline-primary'} mx-1`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          <select
            className="form-select form-select-sm"
            value={pagination.per_page}
            onChange={handlePerPageChange}
          >
            {PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            className="btn btn-sm btn-outline-primary mx-1"
            onClick={() => handlePageChange(1)}
            disabled={pagination.current_page === 1}
          >
            First
          </button>
          {pages}
          <button
            className="btn btn-sm btn-outline-primary mx-1"
            onClick={() => handlePageChange(pagination.total_pages)}
            disabled={pagination.current_page === pagination.total_pages}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">School Entries</h3>
        <input
          type="text"
          className="form-control mt-2"
          placeholder="Search schools..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="card-body">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : schools.length === 0 ? (
          <div className="text-muted">No school entries found</div>
        ) : (
          <>
            <div className="list-group">
              {schools.map(school => (
                <div key={school.name} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5>{school.name}</h5>
                      <small className="text-muted">Course Data: {school.course_data_path}</small>
                    </div>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleUpdate(school)}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Update
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(school.name)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
}

export default SchoolList; 