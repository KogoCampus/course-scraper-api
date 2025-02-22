import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { JsonData } from 'json-edit-react';
import axios from 'axios';
import JsonEditor from '../components/JsonEditor';

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

const SubTitle = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 0.875rem;
`;

const EditorContainer = styled.div`
  flex: 1;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  min-height: 0;
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

const EditCourseListing: React.FC = () => {
  const { schoolName } = useParams<{ schoolName: string }>();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [dataPath, setDataPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // First get the school entry to get the data path
        const schoolResponse = await axios.get(`/api/admin/school-entries?search=${schoolName}`);
        const school = schoolResponse.data.schools.find((s: { name: string }) => s.name === schoolName);
        
        if (!school) {
          throw new Error('School not found');
        }

        setDataPath(school.course_data_path);

        // Then fetch the actual course data
        const dataResponse = await axios.get(`/api/admin/s3-preview/${school.course_data_path}`);
        setCourseData(dataResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch course data');
        console.error('Error fetching course data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (schoolName) {
      fetchCourseData();
    }
  }, [schoolName]);

  const handleDataChange = (data: JsonData) => {
    setCourseData(data as CourseData);
  };

  const handleSave = async () => {
    if (!courseData || !schoolName || !dataPath) return;

    try {
      setSaving(true);
      await axios.post('/api/admin/s3-update', {
        file_path: dataPath,
        content: courseData
      });
      navigate('/course-listings');
    } catch (err) {
      setError('Failed to save changes');
      console.error('Error saving changes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/course-listings');
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  if (error) {
    return <Container>{error}</Container>;
  }

  return (
    <Container>
      <Header>
        <Title>Edit Course Listing - {schoolName}</Title>
        <SubTitle>Data Path: {dataPath}</SubTitle>
      </Header>

      {courseData && (
        <EditorContainer>
          <JsonEditor
            data={courseData}
            onChange={handleDataChange}
            rootName="course-listing"
          />
        </EditorContainer>
      )}

      <ButtonContainer>
        <CancelButton onClick={handleCancel}>Cancel</CancelButton>
        <Button 
          onClick={handleSave} 
          disabled={saving || !courseData}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default EditCourseListing; 