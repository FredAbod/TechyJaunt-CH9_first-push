const express = require('express');
const router = express.Router();
const { createStudent, getStudents, getStudentById, updateStudent, getStudentByName, deleteStudent, getStudentByEmail } = require('../controllers/students.controller');


router.post('/create-student', createStudent);
router.get('/get-students', getStudents);
router.get('/get-student/:id', getStudentById);
router.get('/get-student-by-email', getStudentByEmail);
router.put('/update-student/:id', updateStudent);
router.get('/get-student-by-name', getStudentByName);
router.delete('/delete-student/:id', deleteStudent);


module.exports = router;