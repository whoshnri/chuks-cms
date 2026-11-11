import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'
type Args = { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[]>> }
const normalizedParams = (params: Args['params']) => params.then(({ segments }) => ({ segments: segments ?? [] }))
export const generateMetadata = ({ params, searchParams }: Args) => generatePageMetadata({ config, params: normalizedParams(params), searchParams })
const Page = ({ params, searchParams }: Args) => RootPage({ config, importMap, params: normalizedParams(params), searchParams })
export default Page
