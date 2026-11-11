import type { ReactNode } from 'react'
import config from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'
import '@payloadcms/next/css'

type Args = { children: ReactNode }
const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={async (args) => {
      'use server'
      return handleServerFunctions({ ...args, config, importMap })
    }}
  >
    {children}
  </RootLayout>
)
export default Layout
