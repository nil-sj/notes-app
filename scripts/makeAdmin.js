require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')

async function makeAdmin(email) {
  await mongoose.connect(process.env.MONGO_URI)

  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  )

  if (!user) {
    console.log('User not found:', email)
  } else {
    console.log(`${user.name} is now an admin`)
  }

  await mongoose.disconnect()
}

makeAdmin('niladri123@gmail.com')  // replace with your user's email