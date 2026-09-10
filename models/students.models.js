const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: String,
    phone: String,
    address: String,
    course: String,
    institution: String
  });
  
  const Student = mongoose.model("Student", studentSchema);

  module.exports = Student;