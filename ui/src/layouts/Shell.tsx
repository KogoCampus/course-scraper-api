import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import SideMenu from './SideMenu';
import { Outlet } from 'react-router-dom';

const ShellContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ContentArea = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Shell: React.FC = () => {
  return (
    <ShellContainer>
      <Header />
      <MainContent>
        <SideMenu />
        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContent>
    </ShellContainer>
  );
};

export default Shell;
