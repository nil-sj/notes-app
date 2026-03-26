const express = require('express')
const app = express()
const PORT = 5000

// Middleware: lets Express read JSON request bodies
app.use(express.json())

// GET route — returns a simple message
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' })
})

// POST route — reads data from the request body and echoes it back
app.post('/api/echo', (req, res) => {
  const data = req.body
  res.json({ received: data })
})

// Start listening
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})