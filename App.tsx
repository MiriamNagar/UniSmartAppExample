
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Faculty, Course, Constraint, Schedule, NoteFolder, Photo, AppNotification, User } from './types';
import { MOCK_COURSES, MOCK_NOTIFICATIONS } from './mockData';
import { generateSchedules } from './services/scheduleEngine';
import { TimetableGrid } from './components/TimetableGrid';
import { AdminDashboard } from './components/AdminDashboard';

type Tab = 'planner' | 'saved' | 'notes' | 'admin' | 'notifications' | 'account';
type AuthStatus = 'initial' | 'auth_choice' | 'email_auth' | 'onboarding' | 'authenticated';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#f43f5e'];

const MAJORS_BY_FACULTY: Record<Faculty, string[]> = {
  [Faculty.Engineering]: ['Software Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
  [Faculty.Business]: ['Marketing', 'Finance', 'Accounting', 'Management'],
  [Faculty.Science]: ['Physics', 'Mathematics', 'Biology', 'Chemistry'],
  [Faculty.Arts]: ['History', 'Fine Arts', 'Philosophy', 'Literature'],
  [Faculty.Medicine]: ['General Medicine', 'Nursing', 'Pharmacy']
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('initial');
  const [isSignUp, setIsSignUp] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const [step, setStep] = useState<number>(0); // Planner steps
  
  // Auth & Profile State
  const [user, setUser] = useState<User>({
    email: '',
    name: 'Student User', // Default for fast login
    age: '',
    major: 'Software Engineering', // Default for fast login
    faculty: Faculty.Engineering, // Default for fast login
    year: 'Sophomore', // Default for fast login
    role: 'student'
  });

  // Planner States
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [generatedSchedules, setGeneratedSchedules] = useState<Schedule[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Professor Preference State
  const [prefCourseId, setPrefCourseId] = useState<string>("");
  const [prefProfessor, setPrefProfessor] = useState<string>("");

  // Persistence State
  const [savedSchedules, setSavedSchedules] = useState<Schedule[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  
  // Note Keeping State
  const [photoData, setPhotoData] = useState<{ [folderId: string]: Photo[] }>({ 'general': [] });
  const [customFolders, setCustomFolders] = useState<{ id: string, name: string, color: string }[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = useMemo(() => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return notifications.filter(n => n.timestamp >= threeDaysAgo).sort((a, b) => b.timestamp - a.timestamp);
  }, [notifications]);

  const markAllAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));
  const markAsRead = (id: string) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));

  const filteredCourses = useMemo(() => {
    return MOCK_COURSES.filter(c => 
      c.faculty === user.faculty && 
      c.major === user.major && 
      c.yearLevel === user.year &&
      c.semester === selectedSemester
    );
  }, [user.faculty, user.major, user.year, selectedSemester]);

  const selectedCourses = useMemo(() => MOCK_COURSES.filter(c => selectedCourseIds.includes(c.id)), [selectedCourseIds]);

  const availableProfessorsForSelectedCourse = useMemo(() => {
    const course = MOCK_COURSES.find(c => c.id === prefCourseId);
    return course ? Array.from(new Set(course.sessions.map(s => s.professor))) : [];
  }, [prefCourseId]);

  const activeCourseFolders = useMemo(() => {
    const ids = new Set<string>(selectedCourseIds);
    savedSchedules.forEach(s => s.selectedSessions.forEach(sess => {
      const course = MOCK_COURSES.find(c => c.sessions.some(cs => cs.id === sess.id));
      if (course) ids.add(course.id);
    }));

    return Array.from(ids).map(id => {
      const course = MOCK_COURSES.find(c => c.id === id);
      return {
        id: course?.id || id,
        name: course ? `${course.code}: ${course.name}` : id,
        color: COLORS[Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % COLORS.length],
        isCourse: true
      };
    });
  }, [selectedCourseIds, savedSchedules]);

  const allVisibleFolders = useMemo(() => [
    { id: 'general', name: 'General Notes', color: '#64748b', isCourse: false },
    ...activeCourseFolders,
    ...customFolders.map(f => ({ ...f, isCourse: false }))
  ], [activeCourseFolders, customFolders]);

  const handleToggleCourse = (id: string) => {
    setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

  const addConstraint = (type: Constraint['type'], value: any) => {
    if (type === 'startHour' || type === 'endHour') {
      setConstraints(prev => [...prev.filter(c => c.type !== type), { id: Math.random().toString(36).substr(2, 9), type, value, priority: 'medium' }]);
      return;
    }
    if (type === 'preferredProf') {
      setConstraints(prev => [...prev.filter(c => !(c.type === 'preferredProf' && c.value.courseId === value.courseId)), { id: Math.random().toString(36).substr(2, 9), type, value, priority: 'medium' }]);
      return;
    }
    if (type === 'dayOff' && constraints.find(c => c.type === 'dayOff' && c.value === value)) return;
    setConstraints([...constraints, { id: Math.random().toString(36).substr(2, 9), type, value, priority: 'medium' }]);
  };

  const removeConstraint = (id: string) => setConstraints(constraints.filter(c => c.id !== id));

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedSchedules(generateSchedules(selectedCourses, constraints));
      setIsGenerating(false);
      setStep(3);
    }, 1200);
  };

  const handleSaveSchedule = (schedule: Schedule) => {
    setSavedSchedules([{ ...schedule, savedAt: Date.now(), id: 'saved-' + Date.now() }, ...savedSchedules]);
    setActiveTab('saved');
    setStep(0);
  };

  const handleDeleteSaved = (id: string) => {
    if (confirm("Remove this schedule?")) setSavedSchedules(savedSchedules.filter(s => s.id !== id));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && activeFolderId) {
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto: Photo = { id: Math.random().toString(36).substr(2, 9), uri: event.target?.result as string, timestamp: Date.now() };
          setPhotoData(prev => ({ ...prev, [activeFolderId]: [newPhoto, ...(prev[activeFolderId] || [])] }));
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  };

  const createFolder = () => {
    if (newFolderName.trim()) {
      setCustomFolders([...customFolders, { id: Math.random().toString(36).substr(2, 9), name: newFolderName, color: COLORS[customFolders.length % COLORS.length] }]);
      setNewFolderName("");
      setIsModalOpen(false);
    }
  };

  const handleFinishAuth = () => {
    if (isSignUp) {
      setAuthStatus('onboarding');
    } else {
      setAuthStatus('authenticated');
      setActiveTab(user.role === 'admin' ? 'admin' : 'planner');
    }
  };

  const handleFinishOnboarding = () => {
    setAuthStatus('authenticated');
    setActiveTab(user.role === 'admin' ? 'admin' : 'planner');
  };

  // --- Views ---

  const renderInitialChoice = () => (
    <div className="flex-1 flex flex-col p-8 bg-white animate-in slide-in-from-bottom-12 duration-700">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100">
          <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Academic Portal</h2>
        <p className="text-slate-400 text-sm font-medium mb-12">Who's accessing the system today?</p>
        
        <div className="w-full space-y-4">
          <button 
            onClick={() => { setUser({...user, role: 'student'}); setAuthStatus('auth_choice'); }}
            className="w-full bg-slate-900 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
            Student Entrance
          </button>
          
          <button 
            onClick={() => { setUser({...user, role: 'admin'}); setAuthStatus('auth_choice'); }}
            className="w-full bg-white border-2 border-slate-100 text-slate-700 font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Admin Credentials
          </button>
        </div>
      </div>
    </div>
  );

  const renderAuthChoice = () => (
    <div className="flex-1 flex flex-col p-8 bg-white animate-in slide-in-from-right-8 duration-500">
      <button onClick={() => setAuthStatus('initial')} className="mb-12 p-2 text-slate-400 w-fit">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-3xl font-black text-slate-800 mb-2">{user.role === 'admin' ? 'Admin' : 'Student'} Session</h2>
        <p className="text-slate-400 text-sm font-medium mb-12">How would you like to continue?</p>
        
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => { setIsSignUp(false); setAuthStatus('email_auth'); }}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-indigo-100 active:scale-95 transition-all"
          >
            SIGN IN
          </button>
          
          <button 
            onClick={() => { setIsSignUp(true); setAuthStatus('email_auth'); }}
            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-black py-5 rounded-[2rem] active:scale-95 transition-all"
          >
            CREATE ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmailAuth = () => (
    <div className="flex-1 p-8 bg-white animate-in slide-in-from-right-8 duration-500">
      <button onClick={() => setAuthStatus('auth_choice')} className="mb-12 p-2 text-slate-400 w-fit">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h2 className="text-3xl font-black text-slate-800 mb-2">{isSignUp ? 'New Member' : 'Welcome Back'}</h2>
      <p className="text-slate-400 text-sm font-medium mb-8">Enter your credentials.</p>
      
      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">University Email</label>
          <input 
            type="email" 
            placeholder="student@university.edu"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            value={user.email}
            onChange={e => setUser({...user, email: e.target.value})}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Password</label>
          <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={handleFinishAuth} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-indigo-100 mt-8 active:scale-95 transition-all">
          {isSignUp ? 'CREATE PROFILE' : 'AUTHENTICATE'}
        </button>
      </div>
    </div>
  );

  const renderOnboarding = () => {
    const totalSteps = user.role === 'student' ? 4 : 2;

    return (
      <div className="flex-1 flex flex-col p-8 bg-white animate-in fade-in duration-500">
        <div className="w-full h-1 bg-slate-100 rounded-full mb-12 flex">
          <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${(onboardingStep / totalSteps) * 100}%` }} />
        </div>

        {onboardingStep === 1 && (
          <div className="animate-in slide-in-from-right-4">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Identity Hub</h2>
            <p className="text-slate-400 text-sm font-medium mb-12">Who is setting up this workspace?</p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name</label>
                <input autoFocus type="text" placeholder="Alex Thompson" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Age</label>
                <input type="number" placeholder="20" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" value={user.age} onChange={e => setUser({...user, age: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {onboardingStep === 2 && user.role === 'student' && (
          <div className="animate-in slide-in-from-right-4">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Department</h2>
            <p className="text-slate-400 text-sm font-medium mb-12">Select your Faculty and Major.</p>
            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Faculty</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(Faculty).map(f => (
                    <button key={f} onClick={() => setUser({...user, faculty: f, major: ''})} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-tighter transition-all ${user.faculty === f ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>{f}</button>
                  ))}
                </div>
              </div>
              {user.faculty && (
                <div className="animate-in fade-in slide-in-from-top-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Major</label>
                  <div className="grid grid-cols-1 gap-2">
                    {MAJORS_BY_FACULTY[user.faculty].map(m => (
                      <button key={m} onClick={() => setUser({...user, major: m})} className={`p-4 rounded-2xl border-2 text-left text-[11px] font-bold transition-all ${user.major === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>{m}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {onboardingStep === 2 && user.role === 'admin' && (
          <div className="animate-in slide-in-from-right-4">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Admin Profile</h2>
            <p className="text-slate-400 text-sm font-medium mb-12">Access rights verified.</p>
            <div className="p-8 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
          </div>
        )}

        {onboardingStep === 3 && user.role === 'student' && (
          <div className="animate-in slide-in-from-right-4">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Academic Level</h2>
            <p className="text-slate-400 text-sm font-medium mb-12">What's your current year?</p>
            <div className="grid grid-cols-2 gap-3">
              {['Freshman', 'Sophomore', 'Junior', 'Senior', 'Master', 'PhD'].map(y => (
                <button key={y} onClick={() => setUser({...user, year: y})} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all ${user.year === y ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}><span className="text-xs font-black uppercase tracking-widest">{y}</span></button>
              ))}
            </div>
          </div>
        )}

        {onboardingStep === 4 && user.role === 'student' && (
          <div className="animate-in slide-in-from-right-4 text-center">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Setup Complete</h2>
            <p className="text-slate-400 text-sm font-medium mb-12">Tailoring courses for your profile.</p>
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
          </div>
        )}

        <div className="mt-auto flex gap-4">
          {onboardingStep > 1 && <button onClick={() => setOnboardingStep(onboardingStep - 1)} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl active:scale-95 transition-all">BACK</button>}
          <button disabled={(onboardingStep === 1 && (!user.name || !user.age)) || (onboardingStep === 2 && user.role === 'student' && (!user.faculty || !user.major)) || (onboardingStep === 3 && user.role === 'student' && !user.year)} onClick={() => { if (onboardingStep < totalSteps) setOnboardingStep(onboardingStep + 1); else handleFinishOnboarding(); }} className="flex-[2] py-4 bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">{onboardingStep === totalSteps ? 'ENTER APP' : 'CONTINUE'}</button>
        </div>
      </div>
    );
  };

  const renderPlanner = () => (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-64">
      {step === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-700">
          <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Smart Planner</h2>
          <p className="text-slate-400 mb-8 max-w-xs font-medium">Courses filtered for <span className="text-indigo-600 font-bold">{user.major}</span>, Year <span className="text-indigo-600 font-bold">{user.year}</span>.</p>
          
          <div className="w-full space-y-4 mb-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left mb-2">Select Semester</label>
            <div className="flex gap-3">
              {[1, 2].map(sem => (
                <button key={sem} onClick={() => setSelectedSemester(sem)} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${selectedSemester === sem ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-white bg-white text-slate-400'}`}>Sem {sem}</button>
              ))}
            </div>
          </div>

          <button onClick={() => setStep(1)} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">Begin Course Selection</button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Curriculum Filter</p>
            <h3 className="text-lg font-black leading-tight mt-1">{user.major} - {user.year}</h3>
            <p className="text-[10px] mt-1 font-bold opacity-80">Active Semester: {selectedSemester}</p>
          </div>

          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Course List</label>
            <div className="space-y-3">
              {filteredCourses.length > 0 ? filteredCourses.map(course => (
                <div key={course.id} onClick={() => handleToggleCourse(course.id)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedCourseIds.includes(course.id) ? 'border-indigo-600 bg-white shadow-sm' : 'border-white bg-white hover:border-slate-100'}`}>
                  <div>
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md mb-1 inline-block uppercase tracking-wider">{course.code}</span>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{course.name}</h3>
                    <p className="text-[10px] text-slate-400">{course.credits} Credits</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedCourseIds.includes(course.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>{selectedCourseIds.includes(course.id) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}</div>
                </div>
              )) : (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No curriculum items found</p>
                   <button onClick={() => setStep(0)} className="text-[10px] text-indigo-500 font-bold mt-2 uppercase border-b border-indigo-500">Back to Selection</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <h3 className="text-xl font-black text-slate-800">Custom Rules</h3>
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Time Slots</h4>
              <div className="space-y-4">
                 <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-2">Avoid these days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                      const isActive = constraints.some(c => c.type === 'dayOff' && c.value === idx);
                      return (<button key={idx} onClick={() => isActive ? removeConstraint(constraints.find(c => c.type === 'dayOff' && c.value === idx)!.id) : addConstraint('dayOff', idx)} className={`px-4 py-2 rounded-xl font-black transition-all text-[10px] uppercase ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>{day}</button>)
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-400 block mb-1">Start Hour</label><select value={constraints.find(c => c.type === 'startHour')?.value || ""} onChange={e => addConstraint('startHour', e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 border-none"><option value="">Any</option><option value="08:00">08:00 AM</option><option value="10:00">10:00 AM</option></select></div>
                  <div><label className="text-[10px] font-bold text-slate-400 block mb-1">End Hour</label><select value={constraints.find(c => c.type === 'endHour')?.value || ""} onChange={e => addConstraint('endHour', e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 border-none"><option value="">Any</option><option value="16:00">04:00 PM</option><option value="18:00">06:00 PM</option></select></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 pb-64">
          <div className="text-center"><h3 className="text-xl font-black text-slate-800">Generated Options</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Based on {constraints.length} constraints</p></div>
          {generatedSchedules.map((schedule, idx) => (
            <div key={schedule.id} className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <div><span className="text-[9px] font-black text-indigo-500 uppercase">Proposal {idx + 1}</span><div className="text-lg font-black text-slate-700">Fit Score: {schedule.score}%</div></div>
                <button onClick={() => handleSaveSchedule(schedule)} className="bg-indigo-600 text-white text-[10px] font-black px-6 py-3 rounded-2xl shadow-xl active:scale-95 transition-all">SAVE PLAN</button>
              </div>
              <TimetableGrid sessions={schedule.selectedSessions} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSaved = () => (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-64">
      <div className="mb-8"><h2 className="text-2xl font-black text-slate-800">My Workspace</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Finalized Plans</p></div>
      {savedSchedules.length === 0 ? (<div className="py-24 text-center opacity-20 font-black">No saved plans.</div>) : (
        <div className="space-y-16">{savedSchedules.map(s => (<div key={s.id} className="relative bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100"><div className="flex justify-between items-center mb-4 px-2"><span className="text-[10px] font-black text-slate-400 uppercase">Compiled {new Date(s.savedAt!).toLocaleDateString()}</span><button onClick={() => handleDeleteSaved(s.id)} className="p-2 text-red-400 active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div><TimetableGrid sessions={s.selectedSessions} /></div>))}</div>
      )}
    </div>
  );

  const renderAccount = () => (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-64">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-100">{user.name.split(' ').map(n => n[0]).join('')}</div>
        <div><h2 className="text-2xl font-black text-slate-800 leading-tight">{user.name}</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Role: <span className="text-indigo-600">{user.role.toUpperCase()}</span></p></div>
      </div>
      <div className="space-y-6">
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Academic Passport</h3>
          <div className="space-y-4">
            <div><p className="text-[9px] font-bold text-slate-400 uppercase">Department</p><p className="text-xs font-black text-slate-700">{user.faculty} - {user.major || 'N/A'}</p></div>
            <div><p className="text-[9px] font-bold text-slate-400 uppercase">Current Year</p><p className="text-xs font-black text-slate-700">{user.year}</p></div>
          </div>
        </section>
        <button onClick={() => {setAuthStatus('initial'); setOnboardingStep(1);}} className="w-full py-4 bg-white border border-red-100 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl active:scale-[0.98] transition-all shadow-sm">LOGOUT</button>
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-64">
      {activeFolderId ? (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setActiveFolderId(null)} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
            <h3 className="text-sm font-black text-slate-800 truncate px-4 text-center leading-tight">{allVisibleFolders.find(f => f.id === activeFolderId)?.name}</h3>
            <button onClick={() => cameraInputRef.current?.click()} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
            <input ref={cameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(photoData[activeFolderId] || []).map(p => (<div key={p.id} className="relative aspect-square rounded-3xl overflow-hidden bg-slate-200 shadow-sm border border-slate-100"><img src={p.uri} className="w-full h-full object-cover" alt="Note" /></div>))}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-8"><div><h2 className="text-2xl font-black text-slate-800">Note Archive</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lecture Materials</p></div><button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 p-4 rounded-2xl shadow-lg text-white active:scale-95"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button></div>
          <div className="grid grid-cols-2 gap-4">
            {allVisibleFolders.map(folder => (
              <div key={folder.id} onClick={() => setActiveFolderId(folder.id)} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 min-h-[140px] overflow-hidden">
                <div className="w-14 h-14 rounded-3xl flex items-center justify-center mb-3 shrink-0" style={{ backgroundColor: `${folder.color}15`, color: folder.color }}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </div>
                <h4 className="font-bold text-slate-800 text-[11px] leading-tight px-2 w-full text-center line-clamp-2 break-words overflow-hidden">
                  {folder.name}
                </h4>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-64">
      <div className="flex justify-between items-end mb-8"><div><h2 className="text-2xl font-black text-slate-800">Alert Center</h2></div><button onClick={markAllAsRead} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 pb-0.5 active:opacity-50">Mark all read</button></div>
      <div className="space-y-4">
        {filteredNotifications.map(notification => (
          <div key={notification.id} onClick={() => markAsRead(notification.id)} className={`p-5 rounded-[2rem] border transition-all cursor-pointer ${notification.read ? 'bg-white border-slate-100' : 'bg-indigo-50/30 border-indigo-100 shadow-sm'}`}>
            <h4 className={`text-[11px] font-black uppercase tracking-tight ${notification.read ? 'text-slate-700' : 'text-indigo-900'}`}>{notification.title}</h4>
            <p className={`text-xs leading-relaxed ${notification.read ? 'text-slate-400' : 'text-slate-600'}`}>{notification.message}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdmin = () => (<div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-64"><div className="mb-8"><h2 className="text-2xl font-black text-slate-800">Admin Dashboard</h2></div><AdminDashboard /></div>);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center z-[1000] animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center animate-pulse"><svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
        <div className="mt-8 text-center text-white"><h1 className="text-4xl font-black tracking-tighter">UniSmart</h1><p className="text-indigo-200 text-xs font-black uppercase tracking-[0.3em] mt-2">Optimal Academic Flow</p></div>
      </div>
    );
  }

  const isStudent = user.role === 'student';
  const isAdmin = user.role === 'admin';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative overflow-hidden flex flex-col shadow-2xl ring-1 ring-slate-200">
      {authStatus === 'initial' ? renderInitialChoice() : 
       authStatus === 'auth_choice' ? renderAuthChoice() :
       authStatus === 'email_auth' ? renderEmailAuth() :
       authStatus === 'onboarding' ? renderOnboarding() : (
        <>
          <header className="p-6 bg-white border-b border-slate-200 shrink-0 z-50">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Uni<span className="text-indigo-600">Smart</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {activeTab === 'planner' ? 'Intelligence Planner' : activeTab === 'saved' ? 'My Workspace' : activeTab === 'notes' ? 'Notes Hub' : activeTab === 'notifications' ? 'Alert Center' : activeTab === 'admin' ? 'Analytics Suite' : 'Account Hub'}
            </p>
          </header>

          <main className="flex-1 relative overflow-hidden flex flex-col">
            {activeTab === 'planner' && renderPlanner()}
            {activeTab === 'saved' && renderSaved()}
            {activeTab === 'notes' && renderNotes()}
            {activeTab === 'admin' && renderAdmin()}
            {activeTab === 'notifications' && renderNotifications()}
            {activeTab === 'account' && renderAccount()}
          </main>

          <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-slate-100 z-[60] px-2 py-5">
            <div className="flex justify-around items-center gap-1">
              {isStudent && (
                <>
                  <button onClick={() => {setActiveTab('planner'); if(step === 3) setStep(0)}} className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeTab === 'planner' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg><span className="text-[7px] font-black uppercase tracking-widest">Planner</span></button>
                  <button onClick={() => setActiveTab('saved')} className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeTab === 'saved' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg><span className="text-[7px] font-black uppercase tracking-widest">Saved</span></button>
                </>
              )}
              <button onClick={() => setActiveTab('notes')} className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeTab === 'notes' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg><span className="text-[7px] font-black uppercase tracking-widest">Notes</span></button>
              {isStudent && (
                <button onClick={() => setActiveTab('notifications')} className={`flex-1 flex flex-col items-center gap-1 transition-all relative ${activeTab === 'notifications' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg><span className="text-[7px] font-black uppercase tracking-widest">Alerts</span>{unreadCount > 0 && <div className="absolute top-0 right-1/4 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}</button>
              )}
              {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg><span className="text-[7px] font-black uppercase tracking-widest">Admin</span></button>
              )}
              <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeTab === 'account' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span className="text-[7px] font-black uppercase tracking-widest">Account</span></button>
            </div>
          </footer>

          {activeTab === 'planner' && step > 0 && (
            <div className="fixed bottom-28 left-0 right-0 max-w-md mx-auto px-6 z-40">
              <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 flex gap-3 shadow-2xl items-center border border-slate-700">
                <button onClick={() => setStep(step - 1)} className="p-4 rounded-2xl bg-slate-800 text-slate-300 active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                <div className="flex-1">
                  {step === 1 && <button disabled={selectedCourseIds.length === 0} onClick={() => setStep(2)} className="w-full bg-indigo-600 text-white font-black text-[10px] uppercase py-4 rounded-2xl disabled:bg-slate-700">Solver Setup</button>}
                  {step === 2 && <button onClick={handleGenerate} className="w-full bg-indigo-600 text-white font-black text-[10px] uppercase py-4 rounded-2xl">Run Optimizer</button>}
                  {step === 3 && <button onClick={() => setStep(1)} className="w-full bg-slate-700 text-white font-black text-[10px] uppercase py-4 rounded-2xl">Adjust Selection</button>}
                </div>
              </div>
            </div>
          )}

          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-xs rounded-[2rem] p-6 shadow-2xl">
                <h3 className="text-xl font-black text-slate-800 mb-2">New Folder</h3>
                <input autoFocus type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="e.g. Lab Snapshots" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-700 mb-6" />
                <div className="flex gap-3"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-xs active:scale-95 transition-all">Cancel</button><button onClick={createFolder} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs active:scale-95 transition-all shadow-lg">Create</button></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
