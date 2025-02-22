import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const DropzoneContainer = styled.div<{ isDragActive: boolean }>`
  border: 2px dashed ${({ theme, isDragActive }) => 
    isDragActive ? theme.colors.action : theme.colors.border};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  background-color: ${({ theme, isDragActive }) => 
    isDragActive ? `${theme.colors.action}10` : theme.colors.white};
  transition: ${({ theme }) => theme.transitions.default};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover {
    border-color: ${({ theme }) => theme.colors.action};
    background-color: ${({ theme }) => `${theme.colors.action}10`};
  }
`;

const DropzoneText = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 1rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const JsonContainer = styled.div`
  flex: 1;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  min-height: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.white};
`;

const JsonContent = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  overflow: auto;
  max-height: 70vh;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.primary};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Button = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background-color: ${({ theme }) => theme.colors.action};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.secondary};
`;

interface CourseData {
  [key: string]: unknown;
}

const generateUniquePath = (schoolName: string): string => {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .split('.')[0];
  
  // Generate a UUID v4
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  return `course-data/${schoolName.toLowerCase()}/${timestamp}-${uuid}/course-listing.json`;
};

const UploadCourseListing: React.FC = () => {
  const { schoolName } = useParams<{ schoolName: string }>();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSchoolName, setNewSchoolName] = useState('');
  const isNewSchool = schoolName === 'new';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const jsonData = JSON.parse(reader.result as string);
          setCourseData(jsonData);
          setError(null);
        } catch (err) {
          setError('Invalid JSON file');
          console.error('Error parsing JSON:', err);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false
  });

  const handleSave = async () => {
    if (!courseData || (!schoolName && !newSchoolName)) return;

    try {
      setLoading(true);
      
      if (isNewSchool) {
        if (!newSchoolName) return;
        const s3Path = generateUniquePath(newSchoolName);

        // First upload the file to S3
        await axios.post('/api/admin/s3-update', {
          file_path: s3Path,
          content: courseData
        });
        
        // Then create the school entry
        const formData = new FormData();
        formData.append('school_name', newSchoolName);
        formData.append('course_data_path', s3Path);
        formData.append('update_existing', 'false');
        
        await axios.post('/api/admin/school-entries', formData);
      } else {
        if (!schoolName) return;
        // Get the school entry to get the data path
        const schoolResponse = await axios.get(`/api/admin/school-entries?search=${schoolName}`);
        const school = schoolResponse.data.schools.find((s: { name: string }) => s.name === schoolName);
        
        if (!school) {
          throw new Error('School not found');
        }

        // Generate new path for the updated version
        const s3Path = generateUniquePath(schoolName);

        // Upload the file to S3 with the new path
        await axios.post('/api/admin/s3-update', {
          file_path: s3Path,
          content: courseData
        });

        // Update the school entry with the new path
        const formData = new FormData();
        formData.append('school_name', schoolName);
        formData.append('course_data_path', s3Path);
        formData.append('update_existing', 'true');
        
        await axios.post('/api/admin/school-entries', formData);
      }

      navigate('/course-listings');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(`Failed to save course listing: ${err.response.data.detail || err.message}`);
      } else {
        setError('Failed to save course listing');
      }
      console.error('Error saving course listing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/course-listings');
  };

  return (
    <Container>
      <Header>
        <Title>
          {isNewSchool ? 'Create New Course Listing' : `Upload Course Listing - ${schoolName}`}
        </Title>
      </Header>

      {isNewSchool && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Enter school name"
            value={newSchoolName}
            onChange={(e) => setNewSchoolName(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              width: '100%',
              marginBottom: '1rem'
            }}
          />
        </div>
      )}

      {!courseData && (
        <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
          <input {...getInputProps()} />
          <DropzoneText>
            {isDragActive
              ? 'Drop the JSON file here'
              : 'Drag and drop a JSON file here, or click to select one'}
          </DropzoneText>
        </DropzoneContainer>
      )}

      {courseData && (
        <JsonContainer>
          <JsonContent>
            {JSON.stringify(courseData, null, 2)}
          </JsonContent>
        </JsonContainer>
      )}

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <ButtonContainer>
        <CancelButton onClick={handleCancel}>Cancel</CancelButton>
        <Button 
          onClick={handleSave} 
          disabled={loading || !courseData || (isNewSchool && !newSchoolName)}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default UploadCourseListing; 