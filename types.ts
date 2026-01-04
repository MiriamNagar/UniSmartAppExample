
export enum Faculty {
  Engineering = 'Engineering',
  Business = 'Business',
  Science = 'Science',
  Arts = 'Arts',
  Medicine = 'Medicine'
}

export interface User {
  email: string;
  name: string;
  age: string;
  major: string;
  faculty: Faculty | null;
  year: string;
  role: 'admin' | 'student';
}

export interface CourseSession {
  id: string;
  day: number; // 0=Mon, 1=Tue... 5=Sat
  startTime: string; // "HH:mm"
  endTime: string;
  professor: string;
  room: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  faculty: Faculty;
  major: string; // Target major
  yearLevel: string; // Freshman, Sophomore, etc.
  semester: number; // 1 or 2
  credits: number;
  sessions: CourseSession[];
  enrollment?: number;
  capacity?: number;
}

export interface Constraint {
  id: string;
  type: 'dayOff' | 'startHour' | 'endHour' | 'preferredProf' | 'maxCredits';
  value: any;
  priority: 'low' | 'medium' | 'high';
}

export interface Schedule {
  id: string;
  selectedSessions: CourseSession[];
  score: number;
  breakdown: string[];
  savedAt?: number;
}

export interface Photo {
  id: string;
  uri: string;
  timestamp: number;
}

export interface NoteFolder {
  id: string;
  name: string;
  photos: Photo[];
  color: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'spot_opened' | 'new_course' | 'schedule_alert' | 'general';
  read: boolean;
}
