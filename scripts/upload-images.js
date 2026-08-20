import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mime from 'mime-types'
import { getContainerClient } from '../src/blobStorage.js'

const sourceDirectory = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../images')

const container = getContainerClient()
await container.createIfNotExists()

const files = (await readdir(sourceDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(entry.name))
  .map((entry) => entry.name)

for (const fileName of files) {
  const body = await readFile(path.join(sourceDirectory, fileName))
  await container.getBlockBlobClient(fileName).uploadData(body, {
    blobHTTPHeaders: {
      blobContentType: mime.lookup(fileName) || 'application/octet-stream',
      blobCacheControl: 'public, max-age=31536000, immutable',
    },
  })
  console.log(`Uploaded ${fileName}`)
}

console.log(`Uploaded ${files.length} images to ${container.url}`)
