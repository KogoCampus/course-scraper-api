import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiTester from '../components/ApiTester';
import SchoolList from '../components/SchoolList';

function HomePage() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>School Entries</h1>
        <div>
          <Link to="/create" className="btn btn-primary me-2">
            Create New Entry
          </Link>
          <Link to="/tasks" className="btn btn-success">
            <i className="bi bi-play-circle me-2"></i>
            Run Scraper Task
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <SchoolList />
        </div>
        <div className="col-md-6">
          <ApiTester />
        </div>
      </div>
    </div>
  );
}

export default HomePage; 