import React, { useState } from 'react';
import styled from 'styled-components';
import { JsonEditor as BaseJsonEditor, JsonData } from 'json-edit-react';

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  height: 100%;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  flex: 1;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.action};
  }
`;

const SearchSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.white};
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.action};
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
  max-height: 70vh;
  display: flex;
  
  > div {
    flex: 1;
    overflow: auto;
    min-height: 0;
    max-height: 100%;
  }
`;

interface JsonEditorProps {
  data: JsonData;
  onChange: (data: JsonData) => void;
  showSearch?: boolean;
  rootName?: string;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  data,
  onChange,
  showSearch = true,
  rootName = "json-data"
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchFilter, setSearchFilter] = useState<'value' | 'key' | 'all'>('value');

  return (
    <EditorWrapper>
      {showSearch && (
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search in JSON..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <SearchSelect
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value as 'value' | 'key' | 'all')}
          >
            <option value="value">Search in Values</option>
            <option value="key">Search in Keys</option>
            <option value="all">Search in Both</option>
          </SearchSelect>
        </SearchContainer>
      )}

      <EditorContainer>
        <BaseJsonEditor
          data={data}
          setData={onChange}
          rootName={rootName}
          indent={2}
          showCollectionCount={true}
          showStringQuotes={true}
          collapseAnimationTime={300}
          searchText={searchText}
          searchFilter={searchFilter}
          searchDebounceTime={300}
        />
      </EditorContainer>
    </EditorWrapper>
  );
};

export default JsonEditor; 