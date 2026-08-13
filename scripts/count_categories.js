const fs = require('fs')
const path = require('path')
const file = path.join(__dirname, '..', 'frontend', 'src', 'data', 'localData.ts')
const text = fs.readFileSync(file, 'utf8')

// extract categories
const categoriesMatch = text.match(/export const categories = \[([\s\S]*?)\];?/m)
if (!categoriesMatch) { console.error('Could not find categories array'); process.exit(1) }
const categoriesText = categoriesMatch[1]
const categoryNames = [...categoriesText.matchAll(/name:\s*'([^']+)'/g)].map(m=>m[1])

const allBusinessCategoryNames = [...text.matchAll(/categoryName:\s*'([^']+)'/g)].map(m=>m[1])

const counts = {}
for(const name of categoryNames){ counts[name]=0 }
for(const bn of allBusinessCategoryNames){ if(counts[bn]===undefined) counts[bn]=1; else counts[bn]++ }

console.log(JSON.stringify(counts, null, 2))
