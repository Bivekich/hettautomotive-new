// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Banners } from './collections/Banners'
import { About } from './collections/About'
import { Geography } from './collections/Geography'
import { News } from './collections/News'
import { Contact } from './collections/Contact'
import { CustomPages } from './collections/CustomPages'
import { Settings } from './collections/Settings'
import { PageDescriptions } from './collections/PageDescriptions'
import Catalog from './collections/Catalog'
import Categories from './collections/Categories'
import Subcategories from './collections/Subcategories'
import ThirdSubcategories from './collections/ThirdSubcategories'
import Brands from './collections/Brands'
import Models from './collections/Models'
import Modifications from './collections/Modifications'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: [
        './app/(payload)/admin/custom-components.tsx'
      ],
    },
  },
  collections: [
    Users, 
    Media, 
    Banners, 
    About, 
    Geography, 
    News, 
    Contact, 
    CustomPages, 
    Settings, 
    PageDescriptions,
    Categories,
    Subcategories,
    ThirdSubcategories,
    Brands,
    Models,
    Modifications,
    Catalog
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  cors: '*',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
