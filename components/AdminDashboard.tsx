
import React, { useMemo } from 'react';
import { MOCK_COURSES } from '../mockData';

export const AdminDashboard: React.FC = () => {
  const stats = useMemo(() => {
    const totalEnrollment = MOCK_COURSES.reduce((acc, curr) => acc + (curr.enrollment || 0), 0);
    const totalCapacity = MOCK_COURSES.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    const avgFillRate = (totalEnrollment / totalCapacity) * 100;

    // Peak hours analysis
    const hourCounts: { [key: number]: number } = {};
    MOCK_COURSES.forEach(course => {
      course.sessions.forEach(session => {
        const start = parseInt(session.startTime.split(':')[0]);
        const end = parseInt(session.endTime.split(':')[0]);
        for (let h = start; h < end; h++) {
          hourCounts[h] = (hourCounts[h] || 0) + (course.enrollment || 0);
        }
      });
    });

    const sortedHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1]);
    
    const peakHour = sortedHours[0] ? `${sortedHours[0][0]}:00` : "N/A";

    // Pre-calculate max value to avoid TypeScript spreading issues in the render loop
    const maxHourCount = sortedHours[0] ? Number(sortedHours[0][1]) : 0;

    return { totalEnrollment, totalCapacity, avgFillRate, peakHour, hourCounts, maxHourCount };
  }, []);

  const sortedDemand = useMemo(() => [...MOCK_COURSES].sort((a, b) => 
    ((b.enrollment || 0) / (b.capacity || 1)) - ((a.enrollment || 0) / (a.capacity || 1))
  ), []);

  const handleExportCSV = () => {
    const headers = ["Course Code", "Course Name", "Faculty", "Enrollment", "Capacity", "Fill Rate (%)"];
    const rows = sortedDemand.map(course => [
      course.code,
      `"${course.name}"`, // Wrap name in quotes to handle potential commas
      course.faculty,
      course.enrollment || 0,
      course.capacity || 0,
      Math.round(((course.enrollment || 0) / (course.capacity || 1)) * 100)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Demand_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Enrollment</p>
          <h3 className="text-2xl font-black text-indigo-600">{stats.totalEnrollment}</h3>
          <div className="mt-2 flex items-center gap-1">
             <span className="text-[9px] font-bold text-green-500">+12%</span>
             <span className="text-[9px] text-slate-300 font-medium">vs last term</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peak Utilization</p>
          <h3 className="text-2xl font-black text-orange-500">{stats.peakHour}</h3>
          <div className="mt-2 flex items-center gap-1">
             <span className="text-[9px] text-slate-300 font-medium">Busiest scheduling block</span>
          </div>
        </div>
      </div>

      {/* Registration Stats Visualization */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Course Registration Trends</h3>
        <div className="space-y-6">
          {MOCK_COURSES.map(course => {
            const percentage = ((course.enrollment || 0) / (course.capacity || 100)) * 100;
            return (
              <div key={course.id} className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase">{course.code}</span>
                    <p className="text-[11px] font-bold text-slate-700 truncate">{course.name}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{course.enrollment}/{course.capacity}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${percentage > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Demand Analysis Report */}
      <section className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Demand Analysis Report</h3>
          <button 
            onClick={handleExportCSV}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-95 text-indigo-400 group"
            title="Download CSV"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">High Demand Electives</h4>
            <div className="space-y-2">
              {sortedDemand.slice(0, 3).map(course => (
                <div key={course.id} className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-200">{course.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-black text-[9px] uppercase tracking-tighter">
                    {Math.round((course.enrollment || 0) / (course.capacity || 1) * 100)}% Cap
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Scheduling Bottlenecks</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Student preferences show heavy density around 10:00 AM. Recommend moving 2-3 elective sections to 03:00 PM to optimize classroom allocation.
            </p>
            <div className="flex gap-1 h-12 items-end">
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => {
                const count = stats.hourCounts[h] || 0;
                const max = stats.maxHourCount || 1;
                const height = (count / max) * 100;
                return (
                  <div key={h} className="flex-1 bg-indigo-500/30 rounded-t-sm relative group">
                    <div 
                      className="absolute bottom-0 inset-x-0 bg-indigo-500 rounded-t-sm transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-white bg-slate-700 px-1 rounded-sm pointer-events-none">
                      {h}h
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-6">
          <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95">
            Export Planning PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Data CSV
          </button>
        </div>
      </section>
    </div>
  );
};
