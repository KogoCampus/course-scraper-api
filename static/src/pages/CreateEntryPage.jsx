import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import S3Browser from '../components/S3Browser';
import { formatPreviewContent, getPreviewType } from '../utils/filePreview';

function CreateEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const updateMode = location.state?.updateMode;
  
  const [schoolName, setSchoolName] = useState(location.state?.schoolName || '');
  const [selectedFile, setSelectedFile] = useState(
    location.state?.coursePath ? {
      path: location.state.coursePath,
      name: location.state.coursePath.split('/').pop(),
      type: 'file'
    } : null
  );
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Load preview for existing file in update mode
  useEffect(() => {
    if (updateMode && selectedFile) {
      handleFileSelect(selectedFile, 'JSON');
    }
  }, []);

  const handleFileSelect = async (file, previewType) => {
    setSelectedFile(file);
    setPreviewData(null);
    setPreviewError(null);
    setValidationError(null);

    if (file && file.type === 'file') {
      if (previewType !== 'JSON') {
        setValidationError('Please select a JSON file for course data');
        return;
      }

      try {
        const response = await fetch(`/api/admin/s3-preview/${encodeURIComponent(file.path)}`);
        const content = await response.text();
        const formattedContent = formatPreviewContent(content, previewType);
        
        if (formattedContent) {
          setPreviewData({
            type: previewType,
            content: formattedContent
          });
        }
      } catch (error) {
        console.error('Error loading preview:', error);
        setPreviewError('Failed to load file preview');
      }
    }
  };

  const isValidSubmission = () => {
    return schoolName && 
           selectedFile && 
           !validationError && 
           selectedFile.path && 
           selectedFile.path.toLowerCase().endsWith('.json');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidSubmission()) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('school_name', schoolName);
      formData.append('course_data_path', selectedFile.path);
      formData.append('update_existing', updateMode ? 'true' : 'false');

      const response = await fetch('/api/admin/school-entries', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || `School entry ${updateMode ? 'updated' : 'created'} successfully!`);
        navigate('/', { replace: true });
      } else {
        throw new Error(data.detail || `Failed to ${updateMode ? 'update' : 'create'} school entry`);
      }
    } catch (error) {
      alert(error.message || 'An unexpected error occurred');
    }
  };

  return (
    <div>
      <Link to="/" className="btn btn-outline-secondary mb-3">
        <i className="bi bi-arrow-left me-2"></i>
        Back to Home
      </Link>
      
      <h1 className="mb-4">{updateMode ? 'Update' : 'Create'} School Entry</h1>
      
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Entry Details</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">School Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                    readOnly={updateMode}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Selected Course Data File</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedFile?.path || ''}
                    readOnly
                  />
                  {validationError && (
                    <div className="text-danger mt-1">
                      {validationError}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!isValidSubmission()}
                >
                  {updateMode ? 'Update' : 'Create'} Entry
                </button>
              </form>

              {previewData && (
                <div className="mt-4">
                  <h4>File Preview</h4>
                  <div className="preview-container">
                    <pre className="bg-light p-3 rounded">
                      {previewData.content}
                    </pre>
                  </div>
                </div>
              )}
              
              {previewError && (
                <div className="alert alert-danger mt-3">
                  {previewError}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <S3Browser onFileSelect={handleFileSelect} />
        </div>
      </div>
    </div>
  );
}

export default CreateEntryPage; 