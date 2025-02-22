import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
`;

const LinksContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.primary};
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }

  i {
    font-size: 1.1rem;
  }
`;

const EXTERNAL_LINKS = [
  {
    name: "Scraper API Repository",
    url: "https://github.com/KogoCampus/course-scraper-api",
    icon: "bi-github"
  },
  {
    name: "Scraper Job Repository",
    url: "https://github.com/KogoCampus/course-scraper-job",
    icon: "bi-github"
  }
];

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <Logo>Course Scraper Admin</Logo>
      <LinksContainer>
        {EXTERNAL_LINKS.map((link, index) => (
          <ExternalLink
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.name}
          >
            <i className={`bi ${link.icon}`} />
            {link.name}
          </ExternalLink>
        ))}
      </LinksContainer>
    </HeaderContainer>
  );
};

export default Header;
