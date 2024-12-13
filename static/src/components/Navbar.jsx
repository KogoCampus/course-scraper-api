import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const EXTERNAL_LINKS = [
    {
      name: "Flower Dashboard",
      url: "https://fnxxpzmiie.us-west-2.awsapprunner.com",
      icon: "bi-flower1"
    },
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

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">Course Scraper Admin</Link>
        
        <div className="d-flex gap-2">
          {EXTERNAL_LINKS.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-light"
              title={link.name}
            >
              <i className={`bi ${link.icon} me-2`}></i>
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 