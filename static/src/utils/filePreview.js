const PREVIEW_TYPES = {
  JSON: {
    extensions: ['.json'],
    contentType: 'application/json',
    formatter: (content) => JSON.stringify(JSON.parse(content), null, 2)
  },
  TEXT: {
    extensions: ['.txt', '.log'],
    contentType: 'text/plain',
    formatter: (content) => content
  }
};

export const getPreviewType = (filename) => {
  const extension = filename.toLowerCase().match(/\.[^.]*$/)?.[0];
  if (!extension) return null;

  return Object.entries(PREVIEW_TYPES).find(([_, config]) => 
    config.extensions.includes(extension)
  )?.[0] || null;
};

export const formatPreviewContent = (content, previewType) => {
  if (!previewType || !PREVIEW_TYPES[previewType]) return null;
  
  try {
    return PREVIEW_TYPES[previewType].formatter(content);
  } catch (error) {
    console.error('Error formatting preview:', error);
    return null;
  }
}; 