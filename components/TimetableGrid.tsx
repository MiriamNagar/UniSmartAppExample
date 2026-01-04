
import React from 'react';
import { CourseSession, Course } from '../types';
import { MOCK_COURSES } from '../mockData';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00

interface Props {
  sessions: CourseSession[];
}

export const TimetableGrid: React.FC<Props> = ({ sessions }) => {
  const getCourseBySessionId = (id: string): Course | undefined => {
    return MOCK_COURSES.find(c => c.sessions.some(s => s.id === id));
  };

  const timeToPosition = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const startHour = 8;
    return (h - startHour) * 60 + m;
  };

  // 1 (Time col) + number of days
  const colCount = DAYS.length + 1;

  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="min-w-[700px] relative">
        {/* Header Days */}
        <div 
          className="grid border-b border-slate-100 pb-2"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</div>
          {DAYS.map(day => (
            <div key={day} className="text-[10px] font-black text-center text-slate-500 uppercase tracking-widest">{day}</div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="relative h-[600px]">
          {/* Hour Lines */}
          {HOURS.map(hour => (
            <div 
              key={hour} 
              className="absolute w-full border-t border-slate-50 flex items-start"
              style={{ top: `${(hour - 8) * 40}px` }}
            >
              <span className="text-[10px] text-slate-300 -mt-2 pr-2 font-mono">{hour}:00</span>
            </div>
          ))}

          {/* Sessions */}
          {sessions.map(session => {
            const course = getCourseBySessionId(session.id);
            const startPos = timeToPosition(session.startTime) * (40 / 60);
            const duration = (timeToPosition(session.endTime) - timeToPosition(session.startTime)) * (40 / 60);
            
            return (
              <div
                key={session.id}
                className="absolute rounded-xl p-2 border border-indigo-200 bg-indigo-50/90 shadow-sm overflow-hidden flex flex-col justify-center transition-all hover:scale-[1.02] z-10"
                style={{
                  top: `${startPos}px`,
                  height: `${duration}px`,
                  left: `${(session.day + 1) * (100 / colCount)}%`,
                  width: `${(100 / colCount) - 1}%`
                }}
              >
                <div className="text-[10px] font-extrabold text-indigo-700 truncate leading-tight uppercase">
                  {course?.code}
                </div>
                <div className="text-[8px] text-indigo-500 truncate font-medium leading-tight">
                  {course?.name}
                </div>
                <div className="text-[7px] text-indigo-600 truncate font-bold mt-0.5 flex items-center gap-1">
                   <svg className="w-2.5 h-2.5 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                   {session.professor}
                </div>
                <div className="text-[7px] text-indigo-800 font-black mt-0.5 flex items-center gap-1 uppercase tracking-tighter">
                   <svg className="w-2.5 h-2.5 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   {session.room}
                </div>
                <div className="text-[8px] text-indigo-400 font-mono mt-1 bg-white/50 rounded-md px-1 py-0.5 inline-block w-fit">
                  {session.startTime}-{session.endTime}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
