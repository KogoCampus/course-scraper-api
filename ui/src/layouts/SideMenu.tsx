import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

const SideMenuContainer = styled.nav`
  width: 250px;
  background-color: ${({ theme }) => theme.colors.white};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const MenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.secondary};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
  }

  &.active {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 500;
  }
`;

const MenuIcon = styled.span`
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

const SideMenu: React.FC = () => {
  const menuItems = [
    { path: '/', label: 'API Endpoints', icon: '🔌' },
    { path: '/course-listings', label: 'Course Listings', icon: '📚' },
  ];

  return (
    <SideMenuContainer>
      {menuItems.map((item) => (
        <MenuItem key={item.path} to={item.path}>
          <MenuIcon>{item.icon}</MenuIcon>
          {item.label}
        </MenuItem>
      ))}
    </SideMenuContainer>
  );
};

export default SideMenu;
