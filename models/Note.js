const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,   // adds createdAt and updatedAt automatically
  }
)

module.exports = mongoose.model('Note', noteSchema)