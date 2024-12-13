export const fetchWithAuth = async (url, options = {}) => {
  const credentials = sessionStorage.getItem('adminCredentials');
  
  if (credentials) {
    options.headers = {
      ...options.headers,
      'Authorization': `Basic ${credentials}`
    };
  }

  const response = await fetch(url, options);
  
  if (response.status === 401) {
    sessionStorage.removeItem('adminCredentials');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  return response;
}; 