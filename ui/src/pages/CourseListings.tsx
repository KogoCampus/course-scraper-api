import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface School {
  name: string;
  course_data_path: string;
}

interface PaginationInfo {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
`;

const SchoolList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SchoolCard = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const SchoolName = styled.h2`
  font-size: 1.25rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.primary};
`;

const DataPath = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 0.875rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ActionButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border: 1px solid ${({ theme }) => theme.colors.action};
  border-radius: 4px;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.action};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background-color: ${({ theme }) => theme.colors.action};
    color: ${({ theme }) => theme.colors.white};
  }
`;

const DeleteButton = styled(ActionButton)`
  border-color: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.danger};

  &:hover {
    background-color: ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.white};
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const PageButton = styled.button<{ active?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background-color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.white};
  color: ${({ active, theme }) => active ? theme.colors.white : theme.colors.primary};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background-color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.background};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const CreateButton = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.action};
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  font-weight: 500;

  &:hover {
    opacity: 0.9;
  }
`;

const CourseListings: React.FC = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSchools = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/school-entries?page=${page}&per_page=${pagination.per_page}`);
      setSchools(response.data.schools);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch school entries. Please try again later.');
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page]);

  useEffect(() => {
    fetchSchools(1);
  }, [fetchSchools]);

  const handlePageChange = (page: number) => {
    fetchSchools(page);
  };

  const handleReplace = (schoolName: string) => {
    navigate(`/upload-course-listing/${schoolName}`);
  };

  const handleDelete = async (schoolName: string) => {
    if (!window.confirm(`Are you sure you want to delete the course listing for ${schoolName}?`)) {
      return;
    }

    try {
      setDeleting(schoolName);
      await axios.delete(`/api/admin/school-entries/${schoolName}`);
      
      // Update the schools list by removing the deleted school
      setSchools(prevSchools => prevSchools.filter(school => school.name !== schoolName));
      
      // Update pagination if necessary
      const newTotalItems = pagination.total_items - 1;
      const newTotalPages = Math.ceil(newTotalItems / pagination.per_page);
      
      setPagination(prev => ({
        ...prev,
        total_items: newTotalItems,
        total_pages: newTotalPages,
        current_page: prev.current_page > newTotalPages ? newTotalPages : prev.current_page
      }));

      setError(null);
    } catch (err) {
      setError('Failed to delete school entry');
      console.error('Error deleting school:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = () => {
    navigate('/upload-course-listing/new');
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
        <Title>Course Listings</Title>
        <CreateButton onClick={handleCreate}>
          New Course Listing
        </CreateButton>
      </Header>
      <SchoolList>
        {schools.map((school) => (
          <SchoolCard key={school.name}>
            <SchoolName>{school.name}</SchoolName>
            <DataPath>Data path: {school.course_data_path}</DataPath>
            <ActionButtons>
              <ActionButton onClick={() => handleReplace(school.name)}>Replace</ActionButton>
              <DeleteButton 
                onClick={() => handleDelete(school.name)}
                disabled={deleting === school.name}
              >
                {deleting === school.name ? 'Deleting...' : 'Delete'}
              </DeleteButton>
            </ActionButtons>
          </SchoolCard>
        ))}
      </SchoolList>
      
      <PaginationContainer>
        <PageButton
          disabled={pagination.current_page === 1}
          onClick={() => handlePageChange(pagination.current_page - 1)}
        >
          Previous
        </PageButton>
        {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
          <PageButton
            key={page}
            active={page === pagination.current_page}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </PageButton>
        ))}
        <PageButton
          disabled={pagination.current_page === pagination.total_pages}
          onClick={() => handlePageChange(pagination.current_page + 1)}
        >
          Next
        </PageButton>
      </PaginationContainer>
    </Container>
  );
};

export default CourseListings;
