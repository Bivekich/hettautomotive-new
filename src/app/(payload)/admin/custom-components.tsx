'use client';

import React, { useState } from 'react';

// Simple CSV Import component for the Payload CMS admin
export const CSVImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }

    setUploading(true);
    setMessage('Uploading file and starting import...');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file); // This matches the field name in the API

      const response = await fetch('/api/import-products', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message || 'Import successful!');
        setFile(null);
        // Reset the file input
        const fileInput = document.getElementById('csv-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setError(result.message || 'Import failed.');
      }
    } catch (err) {
      setError('Error uploading file: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Use a direct link to download the file
      window.location.href = '/api/download-catalog';
      
      // Set a timeout to reset the downloading state after a short delay
      setTimeout(() => {
        setDownloading(false);
      }, 2000);
    } catch (err) {
      setError('Error downloading catalog: ' + (err instanceof Error ? err.message : String(err)));
      setDownloading(false);
    }
  };

  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Product Catalog Tools</h2>
      
      {/* Download section */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1.5rem',
      }}>
        <h3>Download Current Catalog</h3>
        <p>Export all products from the current catalog as a CSV file.</p>
        
        <button 
          onClick={handleDownload}
          disabled={downloading}
          style={{
            padding: '0.5rem 1rem',
            cursor: downloading ? 'not-allowed' : 'pointer'
          }}
        >
          {downloading ? 'Downloading...' : 'Download Catalog as CSV'}
        </button>
      </div>
      
      {/* Upload section */}
      <div style={{ 
        padding: '1.5rem', 
      }}>
        <h3>Import Products from CSV</h3>
        <p>Upload a CSV file to import products into the catalog.</p>
        <p>
          Required columns: name, category
          {' '}
          <a 
            href="/api/download-sample-csv" 
            style={{ color: '#2196F3', textDecoration: 'underline' }}
            target="_blank" 
            rel="noopener noreferrer"
          >
            Download Sample CSV
          </a>
        </p>
        <p>Basic optional columns: slug, description, shortDescription, oem, featured, inStock, subcategory, brand, model, modification</p>
        
        {/* Advanced fields description - togglable */}
        <div>
          <button 
            onClick={toggleAdvanced}
            style={{
              padding: '0.3rem 0.7rem',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            {showAdvanced ? 'Hide Advanced Fields' : 'Show Advanced Fields'}
          </button>
          
          {showAdvanced && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Advanced Fields</h4>
              
              <p style={{ margin: '0 0 0.3rem 0', fontWeight: 'bold' }}>Meta Information:</p>
              <ul style={{ margin: '0 0 0.8rem 0' }}>
                <li><strong>metaTitle</strong>: SEO title for the product page</li>
                <li><strong>metaDescription</strong>: SEO description for the product page</li>
              </ul>
              
              <p style={{ margin: '0 0 0.3rem 0', fontWeight: 'bold' }}>Specifications (JSON array):</p>
              <ul style={{ margin: '0 0 0.8rem 0' }}>
                <li><strong>specifications</strong>: Array of name/value pairs for product specifications</li>
                <li>Format: <code>[{'{'}name:'Spec Name',value:'Spec Value'{'}'}]</code></li>
              </ul>
              
              <p style={{ margin: '0 0 0.3rem 0', fontWeight: 'bold' }}>Marketplace Links:</p>
              <ul style={{ margin: '0 0 0.8rem 0' }}>
                <li><strong>marketplaceLinks_ozon</strong>: Link to Ozon listing</li>
                <li><strong>marketplaceLinks_wildberries</strong>: Link to Wildberries listing</li>
                <li><strong>marketplaceLinks_others</strong>: Array of other marketplace links</li>
                <li>Format: <code>[{'{'}name:'Marketplace Name',url:'https://url.com',logo:'logo.png'{'}'}]</code></li>
              </ul>
              
              <p style={{ margin: '0 0 0.3rem 0', fontWeight: 'bold' }}>Distributors:</p>
              <ul style={{ margin: '0 0 0.5rem 0' }}>
                <li><strong>distributors</strong>: Array of distributor information</li>
                <li>Format: <code>[{'{'}name:'Distributor Name',url:'https://url.com',location:'Location'{'}'}]</code></li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Image fields description */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Image Support</h4>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            Include image file names in your CSV to associate uploaded media with products:
          </p>
          <ul style={{ margin: '0 0 0.5rem 0' }}>
            <li><strong>image</strong>: Main product image (single file name, e.g., "product.jpg")</li>
            <li><strong>images</strong>: Additional product images (comma-separated list, e.g., "image1.jpg, image2.jpg")</li>
          </ul>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            Note: Images must be uploaded to the Media collection first with matching filenames.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ padding: '0.5rem 0' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={!file || uploading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: !file || uploading ? '#ccc' : '#38bdf8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !file || uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Processing...' : 'Upload and Import'}
          </button>
          
          {message && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#e6f7e6', 
              borderRadius: '4px',
              color: '#2e7d32'
            }}>
              {message}
            </div>
          )}
          
          {error && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#ffebee', 
              borderRadius: '4px',
              color: '#c62828'
            }}>
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// Simple CustomNavLinks component that can be used in the Payload CMS admin
export const CustomNavLinks: React.FC = () => {
  return (
    <div className="custom-nav-links">
      {/* Add your custom navigation links here */}
    </div>
  );
};

// Export components individually for Payload to use
// Don't use a default export with an object
export { CSVImport as default }; 