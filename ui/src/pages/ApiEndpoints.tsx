import React from 'react';
import styled from 'styled-components';
import ApiTester from '../components/ApiTester';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EndpointCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  h3 {
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }

  pre {
    background: ${({ theme }) => theme.colors.background};
    padding: ${({ theme }) => theme.spacing.sm};
    border-radius: 4px;
    overflow-x: auto;
  }
`;

const Method = styled.span<{ method: string }>`
  background: ${({ method }) => 
    method === 'GET' ? '#4CAF50' : 
    method === 'POST' ? '#2196F3' : 
    method === 'DELETE' ? '#f44336' : '#9C27B0'};
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  margin-right: 8px;
`;

const ApiEndpoints: React.FC = () => {
  const endpoints = [
    {
      method: 'GET' as const,
      path: '/api/course-listing',
      description: 'List all available schools with course listings',
      response: {
        schools: [
          {
            name: "school_name",
            endpoint: "/api/course-listing/school_name"
          }
        ],
        total: 1
      }
    },
    {
      method: 'GET' as const,
      path: '/api/course-listing/{school_name}',
      adminPath: '/api/admin/test-course-listing/{school_name}',
      pathVariables: [
        { name: 'school_name', placeholder: 'Enter school name (e.g., sfu)' }
      ],
      description: 'Get course listing for a specific school',
      response: {
        courses: [
          {
            code: "CMPT 120",
            title: "Introduction to Computing Science and Programming I",
            units: 3,
            description: "An elementary introduction to computing science and programming...",
            prerequisites: ["Grade 12 Computer Science or equivalent"],
            sections: [
              {
                type: "LEC",
                section: "D100",
                instructor: "John Doe",
                schedule: ["Mon 10:30-12:20", "Wed 10:30-11:20"],
                location: "AQ 3150",
                enrollment: { current: 120, total: 150 }
              }
            ]
          }
        ],
        metadata: {
          school: "SFU",
          term: "Spring 2024",
          last_updated: "2024-01-10T12:00:00Z"
        }
      }
    }
  ];

  return (
    <Container>
      <Title>API Endpoints</Title>
      
      <Section>
        <h2>Available Endpoints</h2>
        {endpoints.map((endpoint, index) => (
          <EndpointCard key={index}>
            <h3>
              <Method method={endpoint.method}>{endpoint.method}</Method>
              {endpoint.path}
            </h3>
            <p>{endpoint.description}</p>
            <h4>Example Response:</h4>
            <pre>{JSON.stringify(endpoint.response, null, 2)}</pre>
            <h4>Test Endpoint:</h4>
            <ApiTester {...endpoint} />
          </EndpointCard>
        ))}
      </Section>
    </Container>
  );
};

export default ApiEndpoints; 