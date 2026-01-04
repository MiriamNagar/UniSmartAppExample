
import { Faculty, Course, AppNotification } from './types';

export const MOCK_COURSES: Course[] = [
  // --- Engineering: Software Engineering ---
  {
    id: 'c1',
    code: 'CS101',
    name: 'Intro to Programming',
    faculty: Faculty.Engineering,
    major: 'Software Engineering',
    yearLevel: 'Freshman',
    semester: 1,
    credits: 4,
    sessions: [
      { id: 's1-1', day: 0, startTime: '09:00', endTime: '11:00', professor: 'Dr. Smith', room: 'Hall A' },
      { id: 's1-2', day: 2, startTime: '09:00', endTime: '11:00', professor: 'Dr. Smith', room: 'Hall A' }
    ]
  },
  {
    id: 'c2',
    code: 'CS102',
    name: 'Data Structures',
    faculty: Faculty.Engineering,
    major: 'Software Engineering',
    yearLevel: 'Freshman',
    semester: 2,
    credits: 4,
    sessions: [
      { id: 's2-1', day: 1, startTime: '10:00', endTime: '12:00', professor: 'Prof. Miller', room: 'Lab 2' }
    ]
  },
  {
    id: 'c5',
    code: 'ENG205',
    name: 'Software Arch & Design',
    faculty: Faculty.Engineering,
    major: 'Software Engineering',
    yearLevel: 'Sophomore',
    semester: 1,
    credits: 4,
    enrollment: 92,
    capacity: 100,
    sessions: [
      { id: 's5-1', day: 3, startTime: '09:00', endTime: '12:00', professor: 'Prof. Martin', room: 'Hall C' },
      { id: 's5-2', day: 0, startTime: '14:00', endTime: '17:00', professor: 'Prof. Martin', room: 'Hall C' }
    ]
  },
  {
    id: 'c7',
    code: 'ENG206',
    name: 'Database Systems Management',
    faculty: Faculty.Engineering,
    major: 'Software Engineering',
    yearLevel: 'Sophomore',
    semester: 1,
    credits: 3,
    enrollment: 80,
    capacity: 100,
    sessions: [
      { id: 's7-1', day: 1, startTime: '14:00', endTime: '16:00', professor: 'Dr. Data', room: 'Lab 4' },
      { id: 's7-2', day: 4, startTime: '10:00', endTime: '12:00', professor: 'Dr. Data', room: 'Lab 4' }
    ]
  },

  // --- Science: Physics ---
  {
    id: 'p1',
    code: 'PHY101',
    name: 'Classical Mechanics',
    faculty: Faculty.Science,
    major: 'Physics',
    yearLevel: 'Freshman',
    semester: 1,
    credits: 4,
    sessions: [
      { id: 'sp1-1', day: 0, startTime: '08:00', endTime: '10:00', professor: 'Dr. Newton', room: 'Phys Hall' }
    ]
  },

  // --- Business: Finance ---
  {
    id: 'b1',
    code: 'FIN201',
    name: 'Corporate Finance I',
    faculty: Faculty.Business,
    major: 'Finance',
    yearLevel: 'Sophomore',
    semester: 1,
    credits: 3,
    sessions: [
      { id: 'sb1-1', day: 2, startTime: '11:00', endTime: '13:00', professor: 'Dr. Wealth', room: 'Biz 303' }
    ]
  },

  // --- Arts: Fine Arts ---
  {
    id: 'a1',
    code: 'ART110',
    name: 'History of Modern Art & Visual Culture',
    faculty: Faculty.Arts,
    major: 'Fine Arts',
    yearLevel: 'Sophomore',
    semester: 2,
    credits: 2,
    sessions: [
      { id: 'sa1-1', day: 4, startTime: '14:00', endTime: '16:00', professor: 'Ms. Picasso', room: 'Gallery A' }
    ]
  }
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Registration Open',
    message: 'Enrollment for Semester 2 is now officially open for Engineering students.',
    timestamp: Date.now() - 3600000,
    type: 'new_course',
    read: false
  },
  {
    id: 'n2',
    title: 'Schedule Conflict',
    message: 'Your current draft for ENG205 has a professor update. Review your preferences.',
    timestamp: Date.now() - 86400000,
    type: 'schedule_alert',
    read: true
  }
];
