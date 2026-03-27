require('dotenv').config()
const mongoose = require('mongoose')
const Note = require('../models/Note')

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI)

  const result = await Note.updateMany(
    { tags: { $exists: false } },  // only notes that don't have tags yet
    { $set: { tags: [] } }         // give them an empty array
  )

  console.log(`Updated ${result.modifiedCount} notes`)
  await mongoose.disconnect()
}

migrate()