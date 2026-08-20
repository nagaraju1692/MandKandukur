import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureSchema, query } from './database.js'

const app = express()
const port = Number(process.env.PORT || 4000)
const backendDirectory = path.dirname(fileURLToPath(import.meta.url))
const imageDirectory = path.resolve(backendDirectory, '../images')

app.use(cors())
app.use(express.json())
app.use('/images', express.static(imageDirectory))

function publicImageUrl(request, image) {
  if (!image || image.startsWith('http')) return image
  return `${request.protocol}://${request.get('host')}${image}`
}

function formatBusiness(request, business) {
  return {
    ...business,
    latitude: business.latitude ?? null,
    longitude: business.longitude ?? null,
    image: publicImageUrl(request, business.image),
    gallery: (business.gallery ?? []).map((image) => publicImageUrl(request, image)),
  }
}

app.get('/health', (_request, response) => response.json({ status: 'ok' }))

app.post('/api/auth/login', async (request, response, next) => {
  try {
    await ensureSchema()
    const phone = typeof request.body.phone === 'string' ? request.body.phone.replace(/\D/g, '') : ''
    const name = typeof request.body.name === 'string' ? request.body.name.trim() : ''
    if (!/^[6-9]\d{9}$/.test(phone)) return response.status(400).json({ error: 'A valid 10-digit mobile number is required' })

    const existing = await query('SELECT name, phone FROM users WHERE phone = $1', [phone])
    if (existing.rows[0]) return response.json({ data: existing.rows[0], isNewUser: false })
    if (!/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(name)) return response.status(400).json({ error: 'A valid name is required for a new user' })

    const { rows } = await query(
      'INSERT INTO users (phone, name, created_by, updated_by) VALUES ($1, $2, $1, $1) ON CONFLICT (phone) DO UPDATE SET updated_at = NOW(), updated_by = users.phone RETURNING name, phone',
      [phone, name],
    )
    return response.status(201).json({ data: rows[0], isNewUser: true })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/users/:phone/favorites', async (request, response, next) => {
  try {
    await ensureSchema()
    const phone = request.params.phone.replace(/\D/g, '')
    const { rows } = await query('SELECT business_id FROM favorites WHERE user_phone = $1 ORDER BY created_at', [phone])
    response.json({ data: rows.map((row) => row.business_id) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/users/:phone/favorites/:businessId', async (request, response, next) => {
  try {
    await ensureSchema()
    const phone = request.params.phone.replace(/\D/g, '')
    const { businessId } = request.params
    const existing = await query('SELECT 1 FROM favorites WHERE user_phone = $1 AND business_id = $2', [phone, businessId])
    if (existing.rows[0]) {
      await query('DELETE FROM favorites WHERE user_phone = $1 AND business_id = $2', [phone, businessId])
    } else {
      await query('INSERT INTO favorites (user_phone, business_id, created_by, updated_by) VALUES ($1, $2, $1, $1)', [phone, businessId])
    }
    const { rows } = await query('SELECT business_id FROM favorites WHERE user_phone = $1 ORDER BY created_at', [phone])
    response.json({ data: rows.map((row) => row.business_id) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/reviews', async (_request, response, next) => {
  try {
    await ensureSchema()
    const { rows } = await query('SELECT id, business_id AS "businessId", user_phone AS "userPhone", rating, comment, created_at AS "createdAt" FROM reviews ORDER BY created_at')
    response.json({ data: rows })
  } catch (error) {
    next(error)
  }
})

app.post('/api/businesses/:businessId/reviews', async (request, response, next) => {
  try {
    await ensureSchema()
    const { businessId } = request.params
    const userPhone = typeof request.body.userPhone === 'string' ? request.body.userPhone.replace(/\D/g, '') : ''
    const rating = Number(request.body.rating)
    const comment = typeof request.body.comment === 'string' ? request.body.comment.trim().slice(0, 1000) : ''
    if (!/^[6-9]\d{9}$/.test(userPhone)) return response.status(401).json({ error: 'Sign in before submitting a review' })
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return response.status(400).json({ error: 'Rating must be between 1 and 5' })

    const { rows } = await query(
      'INSERT INTO reviews (id, business_id, user_phone, rating, comment, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $3, $3) RETURNING id, business_id AS "businessId", user_phone AS "userPhone", rating, comment, created_at AS "createdAt"',
      [randomUUID(), businessId, userPhone, rating, comment],
    )
    response.status(201).json({ data: rows[0] })
  } catch (error) {
    next(error)
  }
})

app.post('/api/feedback', async (request, response, next) => {
  try {
    await ensureSchema()
    const userPhone = typeof request.body.userPhone === 'string' ? request.body.userPhone.replace(/\D/g, '') : ''
    const type = request.body.type === 'Complaint' ? 'Complaint' : request.body.type === 'Feedback' ? 'Feedback' : ''
    const subject = typeof request.body.subject === 'string' ? request.body.subject.trim().slice(0, 200) : ''
    const contact = typeof request.body.contact === 'string' ? request.body.contact.replace(/\D/g, '').slice(0, 10) : ''
    const message = typeof request.body.message === 'string' ? request.body.message.trim().slice(0, 5000) : ''
    if (!/^[6-9]\d{9}$/.test(userPhone)) return response.status(401).json({ error: 'Sign in before sending feedback' })
    if (!type || subject.length < 3 || message.length < 10) return response.status(400).json({ error: 'Provide a type, subject, and message of at least 10 characters' })

    const { rows } = await query(
      'INSERT INTO feedback_submissions (id, user_phone, type, subject, contact, message, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $2, $2) RETURNING id, type, subject, contact, message, created_at AS "createdAt"',
      [randomUUID(), userPhone, type, subject, contact || null, message],
    )
    response.status(201).json({ data: rows[0] })
  } catch (error) {
    next(error)
  }
})

app.get('/api/categories', async (_request, response, next) => {
  try {
    await ensureSchema()
    const { rows } = await query('SELECT id, name, parent_id AS "parentId" FROM categories ORDER BY name')
    response.json({ data: rows })
  } catch (error) {
    next(error)
  }
})

app.get('/api/businesses', async (request, response, next) => {
  try {
    await ensureSchema()
    const categoryId = typeof request.query.categoryId === 'string' ? request.query.categoryId : null
    const statement = `SELECT id, name, category_id AS "categoryId", category_name AS "categoryName", address, latitude, longitude, phone, website, description, image, gallery, status, submitted_by AS "submittedBy" FROM businesses${categoryId ? ' WHERE category_id = $1' : ''}`
    const { rows } = await query(statement, categoryId ? [categoryId] : [])
    response.json({ data: rows.map((business) => formatBusiness(request, business)) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/businesses/:id', async (request, response, next) => {
  try {
    await ensureSchema()
    const { rows } = await query('SELECT id, name, category_id AS "categoryId", category_name AS "categoryName", address, latitude, longitude, phone, website, description, image, gallery, status, submitted_by AS "submittedBy" FROM businesses WHERE id = $1', [request.params.id])
    if (!rows[0]) return response.status(404).json({ error: 'Business not found' })
    return response.json({ data: formatBusiness(request, rows[0]) })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/businesses', async (request, response, next) => {
  try {
    await ensureSchema()
    const business = request.body
    const { rows } = await query(
      'INSERT INTO businesses (id, name, category_id, category_name, address, latitude, longitude, phone, website, description, image, gallery, status, submitted_by, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $16) RETURNING id, name, category_id AS "categoryId", category_name AS "categoryName", address, latitude, longitude, phone, website, description, image, gallery, status, submitted_by AS "submittedBy"',
      [business.id, business.name, business.categoryId, business.categoryName, business.address, business.latitude ?? null, business.longitude ?? null, business.phone ?? null, business.website ?? null, business.description ?? null, business.image ?? null, JSON.stringify(business.gallery ?? []), business.status ?? null, business.submittedBy ?? null, business.createdBy ?? null],
    )
    response.status(201).json({ data: formatBusiness(request, rows[0]) })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/businesses/:id', async (request, response, next) => {
  try {
    await ensureSchema()
    const { rows } = await query('UPDATE businesses SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, category_id AS "categoryId", category_name AS "categoryName", address, latitude, longitude, phone, website, description, image, gallery, status, submitted_by AS "submittedBy"', [request.body.status, request.body.updatedBy ?? null, request.params.id])
    if (!rows[0]) return response.status(404).json({ error: 'Business not found' })
    return response.json({ data: formatBusiness(request, rows[0]) })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/announcements', async (_request, response, next) => {
  try {
    await ensureSchema()
    const { rows } = await query('SELECT id, title, detail, description, type, image FROM announcements')
    response.json({ data: rows })
  } catch (error) {
    next(error)
  }
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'Unable to load data from PostgreSQL' })
})

app.listen(port, () => console.log(`Mana Kandukur API listening on port ${port}`))