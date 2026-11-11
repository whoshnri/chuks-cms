import type { ReactNode } from 'react'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './(payload)/admin/importMap'
import '@payloadcms/next/css'

type Args = { children: ReactNode }

export default function Layout({ children }: Args) {
  return (
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
}
