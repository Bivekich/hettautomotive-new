'use client' // Mark this as a Client Component

import React, { useState, useCallback } from 'react'
import { useAuth } from '@payloadcms/ui/providers/Auth'
import { Button } from '@payloadcms/ui/elements/Button'
import type { ListViewSlotSharedClientProps } from 'payload' // Change prop type based on linter suggestion
import './CatalogCsvImport.css' // We'll create this for basic styling

// Use ListViewSlotSharedClientProps
const CatalogCsvImport: React.FC<ListViewSlotSharedClientProps> = (_props) => {
  // Props like 'collection', 'data', 'totalDocs' might be available in `props`
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user: _user } = useAuth() // Get user for potential auth checks if needed

  // Define headers for the template and endpoint
  const csvHeaders = [
    'name',
    'slug',
    'category', // Required
    'shortDescription',
    'brand',
    'model',
    'modification',
    'subcategory',
    'featured',
    'inStock',
    'oem',
    'metaTitle',
    'metaDescription', // Optional
  ]

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setMessage(null) // Clear previous messages
      setError(null)
    } else {
      setFile(null)
    }
  }

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError('Please select a CSV file first.')
      return
    }

    setIsLoading(true)
    setMessage(null)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use a relative path for the endpoint
      const endpoint = '/api/catalogs/import/csv' // Use relative path

      // We need to handle authentication. Payload's fetch doesn't automatically include
      // the auth cookie needed for API requests from the admin panel.
      // A common approach is to fetch a CSRF token first.
      // For simplicity here, we assume the browser handles the cookie or
      // authentication is managed differently. If auth fails, this fetch will likely be rejected.

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        // Headers might be needed depending on CSRF setup, but FormData usually sets Content-Type
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`)
      }

      setMessage(result.message || 'Upload successful!')
      setFile(null) // Clear file input after successful upload
      // Optionally, trigger a refresh of the collection list here
    } catch (err) {
      console.error('Upload failed:', err)
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }, [file])

  const handleDownloadTemplate = () => {
    const csvContent = csvHeaders.join(',') + '\n' // Just the header row
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'catalog_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="catalog-csv-import">
      <h4>Import Catalog from CSV</h4>
      <div className="form-field">
        <label htmlFor="csv-upload">Select CSV File:</label>
        <input
          type="file"
          id="csv-upload"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>
      <div className="button-group">
        <Button onClick={handleUpload} disabled={!file || isLoading} buttonStyle="primary">
          {isLoading ? 'Uploading...' : 'Upload CSV'}
        </Button>
        <Button onClick={handleDownloadTemplate} buttonStyle="secondary">
          Download Template
        </Button>
      </div>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default CatalogCsvImport
