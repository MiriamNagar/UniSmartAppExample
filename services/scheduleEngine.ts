
import { Course, CourseSession, Constraint, Schedule } from '../types';

/**
 * Checks if two time sessions clash.
 */
const hasClash = (s1: CourseSession, s2: CourseSession): boolean => {
  if (s1.day !== s2.day) return false;
  
  const start1 = timeToMinutes(s1.startTime);
  const end1 = timeToMinutes(s1.endTime);
  const start2 = timeToMinutes(s2.startTime);
  const end2 = timeToMinutes(s2.endTime);

  return (start1 < end2 && start2 < end1);
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Simple brute-force / recursive generator to find valid combinations.
 */
export const generateSchedules = (
  selectedCourses: Course[], 
  constraints: Constraint[]
): Schedule[] => {
  const results: { sessions: CourseSession[], courseIds: string[] }[] = [];

  const findCombinations = (index: number, current: CourseSession[]) => {
    if (index === selectedCourses.length) {
      results.push({ sessions: [...current], courseIds: selectedCourses.map(c => c.id) });
      return;
    }

    const course = selectedCourses[index];
    for (const session of course.sessions) {
      let clashFound = false;
      for (const existing of current) {
        if (hasClash(session, existing)) {
          clashFound = true;
          break;
        }
      }
      if (!clashFound) {
        current.push(session);
        findCombinations(index + 1, current);
        current.pop();
      }
    }
  };

  findCombinations(0, []);

  // Map and score
  const finalSchedules: Schedule[] = results.map((item, idx) => {
    const { sessions } = item;
    let score = 100;
    const breakdown: string[] = ["Base score: 100"];

    constraints.forEach(c => {
      const penalty = c.priority === 'high' ? 30 : c.priority === 'medium' ? 15 : 5;
      
      if (c.type === 'dayOff') {
        const hasClassesOnDay = sessions.some(s => s.day === Number(c.value));
        if (hasClassesOnDay) {
          score -= penalty;
          breakdown.push(`Preference unmet: Class on requested day off (${penalty} pts)`);
        } else {
          score += 10;
          breakdown.push(`Preference met: Free day! (+10 pts)`);
        }
      }

      if (c.type === 'startHour') {
        const earliestStart = Math.min(...sessions.map(s => timeToMinutes(s.startTime)));
        const targetStart = timeToMinutes(c.value);
        if (earliestStart < targetStart) {
          score -= penalty;
          breakdown.push(`Preference unmet: Starts earlier than ${c.value} (${penalty} pts)`);
        } else {
          score += 5;
          breakdown.push(`Preference met: Morning sleep preserved! (+5 pts)`);
        }
      }

      if (c.type === 'endHour') {
        const latestEnd = Math.max(...sessions.map(s => timeToMinutes(s.endTime)));
        const targetEnd = timeToMinutes(c.value);
        if (latestEnd > targetEnd) {
          score -= penalty;
          breakdown.push(`Preference unmet: Ends later than ${c.value} (${penalty} pts)`);
        } else {
          score += 5;
          breakdown.push(`Preference met: Evening schedule protected! (+5 pts)`);
        }
      }

      if (c.type === 'preferredProf') {
        const { courseId, professor } = c.value;
        const targetCourse = selectedCourses.find(sc => sc.id === courseId);
        const sessionForCourse = sessions.find(s => targetCourse?.sessions.some(ts => ts.id === s.id));
        
        if (sessionForCourse && sessionForCourse.professor === professor) {
          score += 25;
          breakdown.push(`Preference met: ${targetCourse?.code} with ${professor} (+25 pts)`);
        } else if (sessionForCourse) {
          score -= penalty;
          breakdown.push(`Preference unmet: ${targetCourse?.code} not with ${professor} (${penalty} pts)`);
        }
      }
    });

    return {
      id: `sched-${idx}`,
      selectedSessions: sessions,
      score,
      breakdown
    };
  });

  return finalSchedules.sort((a, b) => b.score - a.score).slice(0, 3);
};
