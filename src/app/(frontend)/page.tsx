import { headers as _getHeaders } from 'next/headers.js'
import Image from 'next/image'
import React from 'react'
import { fileURLToPath } from 'url'

import _config from '@/payload.config'
import './styles.css'
import logo from '../../../public/HettLogo.svg'

export default async function HomePage() {
  const _fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`
  const adminRoute = process.env.PAYLOAD_PUBLIC_SERVER_URL
    ? `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin`
    : '/admin'

  return (
    <div className="home">
      <div className="content animate-fadeIn">
        <picture>
          <source srcSet={logo.src} />
          <Image alt="HETT Logo" height={80} src={logo} width={200} priority />
        </picture>
        <h1 className="roboto-condensed-bold">Добро пожаловать в панель управления</h1>
        <div className="links">
          <a
            className="admin roboto-condensed-medium"
            href={adminRoute}
            rel="noopener noreferrer"
            target="_blank"
          >
            Панель администратора
          </a>
          <a
            className="docs roboto-condensed-medium"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Документация
          </a>
        </div>
      </div>
    </div>
  )
}
