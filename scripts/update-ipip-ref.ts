import fs from 'fs'
import path from 'path'
import { items120 } from '../lib/items120'

const refPath = path.join(process.cwd(), 'IPIP_REFERENCE.md')
let content = fs.readFileSync(refPath, 'utf8')

// Add Thai Text column to header
content = content.replace(/\| ID \| Keying \| English Text \|\n\|----\|--------\|--------------\|/g, '| ID | Keying | English Text | Thai Text |\n|----|--------|--------------|-----------|')

// Replace rows
for (const item of items120) {
  // Find the exact row for this item ID
  const rowRegex = new RegExp(`\\| (\\s*${item.id}\\s*) \\| (\\s*[+-]\\s*) \\| (\\s*${item.en.replace(/[.*+?^$\\{}()[\]\\]/g, '\\$&')}\\s*) \\|`)
  
  if (rowRegex.test(content)) {
    content = content.replace(rowRegex, `| $1 | $2 | $3 | ${item.th} |`)
  } else {
    console.log(`Failed to find row for item ${item.id}: ${item.en}`)
  }
}

fs.writeFileSync(refPath, content, 'utf8')
console.log('Successfully updated IPIP_REFERENCE.md with Thai translations!')
