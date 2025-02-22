import React, { useState } from 'react';
import styled from 'styled-components';

interface PathVariable {
  name: string;
  placeholder: string;
}

interface ApiEndpointProps {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  pathVariables?: PathVariable[];
  adminPath?: string;  // Optional admin test path
}

interface RequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
}

interface ApiResponse {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
  error?: string;
}

const TesterContainer = styled.div`
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  flex: 1;
  font-size: 1rem;
`;

const Button = styled.button<{ $loading?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $loading }) => $loading ? theme.colors.secondary : theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 4px;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: ${({ theme }) => theme.transitions.default};
  min-width: 100px;
  justify-content: center;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Section = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const ResponseSection = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: 4px;
  margin-top: ${({ theme }) => theme.spacing.md};
  max-height: 400px;
  overflow-y: auto;
`;

const Pre = styled.pre`
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid ${({ theme }) => theme.colors.white};
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ApiTester: React.FC<ApiEndpointProps> = ({ method, path, pathVariables = [], adminPath }) => {
  const [variables, setVariables] = useState<Record<string, string>>(
    Object.fromEntries(pathVariables.map(v => [v.name, '']))
  );
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);

  const getFullUrl = (path: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${path}`;
  };

  const replacePath = (path: string, variables: Record<string, string>) => {
    let result = path;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(`{${key}}`, encodeURIComponent(value));
    });
    return result;
  };

  const testApi = async () => {
    // Check if all required variables are filled
    if (pathVariables.some(v => !variables[v.name])) return;

    const testPath = replacePath(adminPath || path, variables);
    const actualPath = replacePath(path, variables);
    
    setLoading(true);
    setRequestInfo({
      method,
      url: getFullUrl(actualPath),
      headers: {
        'Accept': 'application/json',
        ...(adminPath && {
          'Authorization': 'Basic ' + btoa('admin:password')
        })
      }
    });
    setResponse(null);

    try {
      const response = await fetch(testPath, {
        headers: {
          'Accept': 'application/json',
          ...(adminPath && {
            'Authorization': 'Basic ' + btoa('admin:password')
          })
        }
      });

      // Get response text first
      const text = await response.text();
      
      // Try to parse as JSON if not empty
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text}`);
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: data
      });
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TesterContainer>
      {pathVariables.length > 0 && (
        <InputGroup>
          {pathVariables.map(({ name, placeholder }) => (
            <Input
              key={name}
              placeholder={placeholder}
              value={variables[name]}
              onChange={(e) => setVariables(prev => ({ ...prev, [name]: e.target.value }))}
            />
          ))}
          <Button onClick={testApi} disabled={loading} $loading={loading}>
            {loading ? (
              <>
                <Spinner />
                Testing...
              </>
            ) : (
              'Test API'
            )}
          </Button>
        </InputGroup>
      )}

      {pathVariables.length === 0 && (
        <Button onClick={testApi} disabled={loading} $loading={loading}>
          {loading ? (
            <>
              <Spinner />
              Testing...
            </>
          ) : (
            'Test API'
          )}
        </Button>
      )}

      {requestInfo && (
        <Section>
          <h4>Request</h4>
          <ResponseSection>
            <p><strong>Method:</strong> {requestInfo.method}</p>
            <p><strong>URL:</strong> <code>{requestInfo.url}</code></p>
            <h5>Headers:</h5>
            <Pre>{JSON.stringify(requestInfo.headers, null, 2)}</Pre>
          </ResponseSection>
        </Section>
      )}

      {response && (
        <Section>
          <h4>Response</h4>
          <ResponseSection>
            {response.error ? (
              <p><strong>Error:</strong> {response.error}</p>
            ) : (
              <>
                <p><strong>Status:</strong> {response.status} {response.statusText}</p>
                <h5>Headers:</h5>
                <Pre>{JSON.stringify(response.headers, null, 2)}</Pre>
                <h5>Body:</h5>
                <Pre>{JSON.stringify(response.body, null, 2)}</Pre>
              </>
            )}
          </ResponseSection>
        </Section>
      )}
    </TesterContainer>
  );
};

export default ApiTester; 