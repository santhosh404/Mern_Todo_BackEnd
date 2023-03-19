const mongoose = require('mongoose')
const moment = require('moment-timezone');


const dateIndia = moment.tz(Date.now(), "Asia/Calcutta");
console.log(dateIndia)
const TodoSchema = new mongoose.Schema({ 
    userId: {
        type:String,
        required:true
    },
    name: {
        type: String,
        required:true
    },
    description: {
        type: String,
    },
    isCompleted: {
        type: Boolean,
        required:true
    },
    scheduledAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        required: true,
        default: dateIndia
    }
})

module.exports = mongoose.model("TodoSchema", TodoSchema)