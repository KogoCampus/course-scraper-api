import React, { useState } from 'react';

function ApiTester() {
  const [schoolName, setSchoolName] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestInfo, setRequestInfo] = useState(null);

  const getFullUrl = (path) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${path}`;
  };

  const testApi = async () => {
    if (!schoolName) return;

    const adminApiPath = `/api/admin/test-course-listing/${encodeURIComponent(schoolName)}`;
    const courseApiPath = `/api/course-listing/${encodeURIComponent(schoolName)}`;
    
    setLoading(true);
    setRequestInfo({
      method: 'GET',
      url: getFullUrl(courseApiPath),
      headers: {
        'Accept': 'application/json'
      }
    });
    setResponse(null);

    try {
      const response = await fetch(adminApiPath);
      const data = await response.json();

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: data
      });
    } catch (error) {
      setResponse({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">API Tester</h3>
      </div>
      <div className="card-body">
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter school name"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
          <button 
            className="btn btn-primary" 
            onClick={testApi}
            disabled={loading}
          >
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Testing...
              </span>
            ) : (
              'Test API'
            )}
          </button>
        </div>

        {requestInfo && (
          <div className="mt-3">
            <h4>Request</h4>
            <div className="request-details bg-light p-3 rounded">
              <p><strong>Method:</strong> {requestInfo.method}</p>
              <p><strong>URL:</strong> <code>{requestInfo.url}</code></p>
              <h5>Headers:</h5>
              <pre>{JSON.stringify(requestInfo.headers, null, 2)}</pre>
            </div>
          </div>
        )}

        {response && (
          <div className="mt-3">
            <h4>Response</h4>
            <div className="response-details bg-light p-3 rounded">
              <p><strong>Status:</strong> {response.status} {response.statusText}</p>
              <h5>Headers:</h5>
              <pre>{JSON.stringify(response.headers, null, 2)}</pre>
              <h5>Body:</h5>
              <pre>{JSON.stringify(response.body, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiTester; 