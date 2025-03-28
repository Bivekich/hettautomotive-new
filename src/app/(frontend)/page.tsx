import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`
  const adminRoute = process.env.PAYLOAD_PUBLIC_SERVER_URL
    ? `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin`
    : '/admin'

  return (
    <div className="home">
      <div className="content">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
          <Image
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>
        <h1>Добро пожаловать на новый сайт.</h1>
        <div className="links">
          <a className="admin" href={adminRoute} rel="noopener noreferrer" target="_blank">
            Панель администратора
          </a>
          <a
            className="docs"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Документация
          </a>
        </div>
      </div>
      <div className="footer">
        <p>Update this page by editing</p>
        <a className="codeLink" href={fileURL}>
          <code>app/(frontend)/page.tsx</code>
        </a>
      </div>
    </div>
  )
}
