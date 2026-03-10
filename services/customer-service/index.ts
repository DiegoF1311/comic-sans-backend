import express from 'express'

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'customer-service' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`customer-service running on port ${PORT}`))
