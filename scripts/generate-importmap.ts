import config from '../payload.config'
import { generateImportMap } from '../node_modules/payload/dist/bin/generateImportMap/index.js'

await generateImportMap(await config)
