'use client'

import React, { useState } from 'react'

// Simple CSV Import component for the Payload CMS admin
export const CSVImport = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [_downloading, setDownloading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setMessage(null)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a CSV file to upload')
      return
    }

    setUploading(true)
    setMessage('Uploading file and starting import...')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file) // This matches the field name in the API

      const response = await fetch('/api/import-products', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setMessage(result.message || 'Import successful!')
        setFile(null)
        // Reset the file input
        const fileInput = document.getElementById('csv-file') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
      } else {
        setError(result.message || 'Import failed.')
      }
    } catch (err) {
      setError('Error uploading file: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setUploading(false)
    }
  }

  const _handleDownload = async () => {
    setDownloading(true)
    try {
      // Use a direct link to download the file
      window.location.href = '/api/download-catalog'

      // Set a timeout to reset the downloading state after a short delay
      setTimeout(() => {
        setDownloading(false)
      }, 2000)
    } catch (err) {
      setError('Error downloading catalog: ' + (err instanceof Error ? err.message : String(err)))
      setDownloading(false)
    }
  }

  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced)
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Инструменты каталога товаров</h2>

      {/* Upload section */}
      <div
        style={{
          padding: '1.5rem',
        }}
      >
        <h3>Импорт товаров из CSV</h3>
        <p>Загрузите CSV файл для импорта товаров в каталог.</p>
        <p>
          Обязательные поля: <strong>name</strong>, <strong>category</strong>, <strong>article</strong>
          <a
            href="/api/download-sample-csv"
            style={{ color: '#2196F3', textDecoration: 'underline', marginRight: '1rem' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Экспорт каталога
          </a>
          <a
            href="/api/download-template-csv"
            style={{ color: '#2196F3', textDecoration: 'underline' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Скачать шаблон
          </a>
        </p>

        {/* Advanced fields description - togglable */}
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={toggleAdvanced}
            style={{
              background: 'none',
              border: 'none',
              color: '#2196F3',
              cursor: 'pointer',
              padding: '0',
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {showAdvanced ? 'Скрыть инструкцию' : 'Показать инструкцию по заполнению полей'}
            <span style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }}>▼</span>
          </button>

          {showAdvanced && (
            <div style={{ marginTop: '1rem', padding: '1rem' }}>
              <p>Заголовок CSV должен содержать следующие поля (порядок важен):</p>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', listStyleType: 'disc' }}>
                <li><strong>name</strong> - Название товара (Обязательно)</li>
                <li><strong>category</strong> - Название категории (Обязательно)</li>
                <li><strong>slug</strong> - URL-слаг (если пусто, генерируется из названия)</li>
                <li><strong>description</strong> - Полное описание товара (простой текст)</li>
                <li><strong>shortDescription</strong> - Краткое описание</li>
                <li><strong>oem</strong> - OEM номер</li>
                <li><strong>article</strong> - Уникальный артикул товара (Обязательно)</li>
                <li><strong>featured</strong> - Рекомендуемый товар (true/false)</li>
                <li><strong>inStock</strong> - В наличии (true/false, по умолчанию true)</li>
                <li><strong>subcategory</strong> - Название подкатегории</li>
                <li><strong>thirdsubcategory</strong> - Название подкатегории 3-го уровня</li>
                <li><strong>brand</strong> - Название бренда (несколько через &apos;|&apos;, например &quot;Бренд1|Бренд2&quot;)</li>
                <li><strong>model</strong> - Название модели</li>
                <li><strong>modification</strong> - Название модификации</li>
                <li><strong>image</strong> - Основное изображение (имя файла из Media)</li>
                <li><strong>images</strong> - Доп. изображения (имена файлов через запятую: &quot;img1.jpg,img2.jpg&quot;)</li>
                <li><strong>metaTitle</strong> - Мета-заголовок (SEO)</li>
                <li><strong>metaDescription</strong> - Мета-описание (SEO)</li>
                <li>
                  <strong>specifications</strong> - Характеристики (формат: &quot;Название1:Значение1,Название2:Значение2&quot;)
                </li>
                <li><strong>marketplaceLinks_ozon</strong> - Ссылка Ozon (без https://)</li>
                <li><strong>marketplaceLinks_wildberries</strong> - Ссылка Wildberries (без https://)</li>
                <li>
                  <strong>marketplaceLinks_others</strong> - Другие маркетплейсы (формат: &quot;Название:Ссылка:Логотип.jpg,...&quot;)
                </li>
                <li>
                  <strong>distributors</strong> - Дистрибьюторы (формат: &quot;Название:Ссылка:Место,...&quot;)
                </li>
              </ul>
              <p style={{ marginTop: '1rem', color: 'red' }}>
                Примечание: URL в полях marketplaceLinks_* и distributors НЕ ДОЛЖНЫ начинаться с https://.
                Оно будет добавлено автоматически.
              </p>
            </div>
          )}
        </div>

        {/* Image fields description */}
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Поддержка изображений</h4>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            Укажите имена файлов изображений в CSV для связывания загруженных медиафайлов с
            товарами:
          </p>
          <ul style={{ margin: '0 0 0.5rem 0' }}>
            <li>
              <strong>image</strong>: Основное изображение товара (один файл, например, &quot;product.jpg&quot;)
            </li>
            <li>
              <strong>images</strong>: Дополнительные изображения товара (список через запятую, например, &quot;image1.jpg, image2.jpg&quot;)
            </li>
          </ul>
          <p style={{ margin: '0', fontSize: '1rem', color: 'red' }}>
            Примечание: Изображения должны быть предварительно загружены в коллекцию Media с
            соответствующими именами файлов.
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
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Processing...' : 'Upload and Import'}
          </button>

          {message && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#e6f7e6',
                borderRadius: '4px',
                color: '#2e7d32',
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#ffebee',
                borderRadius: '4px',
                color: '#c62828',
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// Simple CustomNavLinks component that can be used in the Payload CMS admin
export const CustomNavLinks: React.FC = () => {
  return <div className="custom-nav-links">{/* Add your custom navigation links here */}</div>
}

// Export components individually for Payload to use
// Don't use a default export with an object
export { CSVImport as default }
