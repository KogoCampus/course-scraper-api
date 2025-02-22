import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import Shell from './layouts/Shell';
import ApiEndpoints from './pages/ApiEndpoints';
import CourseListings from './pages/CourseListings';
import EditCourseListing from './pages/EditCourseListing';
import UploadCourseListing from './pages/UploadCourseListing';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.body};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.colors.background};
  }

  #root {
    height: 100vh;
  }
`;

const App: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<ApiEndpoints />} />
          <Route path="/course-listings" element={<CourseListings />} />
          <Route path="/edit-course-listing/:schoolName" element={<EditCourseListing />} />
          <Route path="/upload-course-listing/:schoolName" element={<UploadCourseListing />} />
        </Route>
      </Routes>
    </>
  );
};

export default App; 