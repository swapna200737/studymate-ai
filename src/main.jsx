import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen, BrainCircuit, CalendarDays, Check, ChevronRight, Clock3,
  FileText, Flame, GraduationCap, LayoutDashboard, Menu, Plus, Search,
  Sparkles, Target, Trash2, Trophy, X, Zap
} from "lucide-react";
import "./styles.css";

const todayISO = () => new Date().toISOString().slice(0, 10);
const initialTasks = [
  { id: 1, title: "Review Data Structures", subject: "Computer Science", date: todayISO(), time: "10:00", done: true },
  { id: 2, title: "Practice SQL queries", subject: "Database Systems", date: todayISO(), time: "14:30", done: false },
  { id: 3, title: "Read Operating Systems notes", subject: "Operating Systems", date: todayISO(), time: "17:00", done: false }
];
const sampleNotes = "Data structures are ways to organize and store data so it can be accessed and modified efficiently. Arrays store elements in contiguous memory locations and allow fast index-based access. Linked lists contain nodes connected by pointers, making insertion and deletion flexible. Stacks follow the Last In, First Out (LIFO) principle. Queues follow the First In, First Out (FIFO) principle. Trees represent hierarchical relationships, while graphs model connections between entities. Choosing the right data structure improves the performance of an algorithm.";

function App() {
  const [active, setActive] = useState("Overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState("");
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sm-tasks")) || initialTasks; } catch { return initialTasks; }
  });
  const [newTask, setNewTask] = useState({ title: "", subject: "General", date: todayISO(), time: "16:00" });
  const [taskModal, setTaskModal] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => { localStorage.setItem("sm-tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => {
    fetch("/api/health").then(r => r.json()).then(d => setMode(d.aiEnabled ? "AI mode" : "Demo mode")).catch(() => setMode("Demo mode"));
  }, []);

  const completed = tasks.filter(t => t.done).length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const filteredTasks = useMemo(() => tasks.filter(t => `${t.title} ${t.subject}`.toLowerCase().includes(searchText.toLowerCase())), [tasks, searchText]);

  async function apiPost(endpoint, body) {
    const response = await fetch(`/api/${endpoint}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function generateSummary() {
    if (notes.trim().length < 10) { setNotice("Paste at least 10 characters of notes first."); return; }
    setBusy("summary"); setNotice("");
    try {
      const data = await apiPost("summarize", { text: notes });
      setSummary(data.summary); setMode(data.mode === "ai" ? "AI mode" : "Demo mode");
    } catch (e) { setNotice(e.message); }
    finally { setBusy(""); }
  }

  async function generateQuiz() {
    if (notes.trim().length < 10) { setNotice("Paste at least 10 characters of notes first."); return; }
    setBusy("quiz"); setNotice(""); setShowResults(false); setAnswers({});
    try {
      const data = await apiPost("quiz", { text: notes });
      setQuiz(data.quiz); setMode(data.mode === "ai" ? "AI mode" : "Demo mode"); setActive("Quiz");
    } catch (e) { setNotice(e.message); }
    finally { setBusy(""); }
  }

  function addTask(e) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setTasks(prev => [...prev, { ...newTask, title: newTask.title.trim(), id: Date.now(), done: false }]);
    setNewTask({ title: "", subject: "General", date: todayISO(), time: "16:00" });
    setTaskModal(false);
  }
  function toggleTask(id) { setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  function deleteTask(id) { setTasks(prev => prev.filter(t => t.id !== id)); }
  function go(name) { setActive(name); setMobileMenu(false); setNotice(""); }

  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "AI Study Tools", icon: Sparkles },
    { name: "My Schedule", icon: CalendarDays },
    { name: "Quiz Center", icon: BrainCircuit }
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><GraduationCap size={23}/></div><div><strong>StudyMate<span>AI</span></strong><small>YOUR PERSONAL STUDY SPACE</small></div><button className="mobile-close icon-button" onClick={() => setMobileMenu(false)}><X size={19}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{navItems.map(item => <button key={item.name} className={`nav-item ${active === item.name ? "selected" : ""}`} onClick={() => go(item.name)}><item.icon size={18}/><span>{item.name}</span>{item.name === "Quiz Center" && quiz.length > 0 && <span className="nav-count">{quiz.length}</span>}</button>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-tip"><div className="tip-icon"><Zap size={17}/></div><strong>Small steps, big results.</strong><p>Every focused study session brings you closer to your goals.</p><div className="tip-line"><span/></div><small>KEEP GOING!</small></div>
      <div className="profile"><div className="avatar">S</div><div className="profile-info"><strong>Student</strong><small>B.Tech learner</small></div><span className="online-dot"/></div>
    </aside>

    {mobileMenu && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMobileMenu(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileMenu(true)}><Menu size={21}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{active}</strong></div></div><div className="topbar-right"><div className="status-pill"><span className="status-dot"/>{mode || "Connecting…"}</div><div className="top-avatar">S</div></div></header>
      <div className="page-content">
        {active === "Overview" && <Overview tasks={tasks} completed={completed} progress={progress} go={go} openTask={() => setTaskModal(true)} />}
        {active === "AI Study Tools" && <section>
          <PageHeading eyebrow="YOUR AI STUDY ASSISTANT" title="Learn smarter, not harder." subtitle="Turn your study material into clear summaries and quick practice quizzes."/>
          <div className="tools-layout">
            <div className="panel notes-panel"><div className="panel-heading"><div className="heading-icon purple"><FileText size={19}/></div><div><h3>Your study material</h3><p>Paste lecture notes, textbook content, or revision material.</p></div></div><textarea className="notes-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste your study notes here…&#10;&#10;Tip: Try the sample Data Structures notes to explore the tools."/><div className="notes-footer"><span>{notes.length} characters</span><button className="text-button" onClick={() => setNotes(sampleNotes)}>Use sample notes</button><button className="text-button" onClick={() => { setNotes(""); setSummary(""); setQuiz([]); }}>Clear</button></div><div className="tool-actions"><button className="primary-button" disabled={!!busy} onClick={generateSummary}><Sparkles size={17}/>{busy === "summary" ? "Generating…" : "Generate summary"}</button><button className="secondary-button" disabled={!!busy} onClick={generateQuiz}><BrainCircuit size={17}/>{busy === "quiz" ? "Creating quiz…" : "Create a quiz"}</button></div>{notice && <div className="notice">{notice}</div>}</div>
            <div className="panel output-panel"><div className="panel-heading"><div className="heading-icon green"><Sparkles size={19}/></div><div><h3>Smart summary</h3><p>Your key takeaways, in one place.</p></div></div>{summary ? <div className="summary-result"><div className="result-label"><Check size={15}/> SUMMARY READY</div><p>{summary}</p><button className="secondary-button small-button" onClick={() => navigator.clipboard?.writeText(summary)}>Copy summary</button></div> : <div className="empty-output"><div className="empty-art"><FileText size={29}/><Sparkles size={16}/></div><strong>Your summary will appear here</strong><p>Add your notes and click “Generate summary” to get started.</p></div>}<div className="output-note"><Zap size={15}/><span>{mode === "AI mode" ? "AI-powered results are enabled." : "Demo mode works without an API key. Add one for AI-generated results."}</span></div></div>
          </div>
          <div className="feature-strip"><div className="feature"><div className="feature-icon peach"><Target size={19}/></div><div><strong>Focused learning</strong><p>Get straight to the important concepts.</p></div></div><div className="feature"><div className="feature-icon blue"><BrainCircuit size={19}/></div><div><strong>Active recall</strong><p>Test your knowledge with practice quizzes.</p></div></div><div className="feature"><div className="feature-icon mint"><CalendarDays size={19}/></div><div><strong>Stay organized</strong><p>Plan revision sessions in your schedule.</p></div></div></div>
        </section>}
        {active === "My Schedule" && <section><PageHeading eyebrow="MAKE TIME FOR WHAT MATTERS" title="Your study schedule" subtitle="Plan study sessions, track progress, and build a consistent routine."/><div className="schedule-toolbar"><div className="search-box"><Search size={17}/><input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search tasks or subjects…"/></div><button className="primary-button" onClick={() => setTaskModal(true)}><Plus size={17}/> Add study task</button></div><div className="panel task-list-panel"><div className="list-header"><div><h3>All study tasks</h3><p>{completed} of {tasks.length} completed</p></div><span className="progress-tag">{progress}% complete</span></div>{filteredTasks.length ? filteredTasks.map(task => <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask}/>) : <div className="empty-tasks"><CalendarDays size={26}/><strong>No tasks found</strong><p>Add a task or try a different search.</p></div>}</div></section>}
        {active === "Quiz Center" && <section><PageHeading eyebrow="PRACTICE MAKES PROGRESS" title="Quiz center" subtitle="Check your understanding with questions made from your own study notes."/><div className="panel quiz-panel">{quiz.length ? <><div className="quiz-top"><div className="heading-icon purple"><BrainCircuit size={20}/></div><div><h3>Study material quiz</h3><p>{quiz.length} questions · Multiple choice</p></div><div className="quiz-spacer"/><span className="progress-tag">{Object.keys(answers).length}/{quiz.length} answered</span></div>{quiz.map((q,i) => <div className="question-block" key={i}><div className="question-number">QUESTION {String(i+1).padStart(2,"0")}</div><h4>{q.question}</h4><div className="answer-options">{q.options.map((option,j) => <button key={j} disabled={showResults} className={`answer-option ${answers[i] === j ? "answer-selected" : ""} ${showResults && j === q.answer ? "answer-correct" : ""} ${showResults && answers[i] === j && j !== q.answer ? "answer-wrong" : ""}`} onClick={() => setAnswers(prev => ({...prev,[i]:j}))}><span className="option-letter">{String.fromCharCode(65+j)}</span>{option}{showResults && j === q.answer && <Check size={16}/>}</button>)}</div>{showResults && q.explanation && <p className="explanation">{q.explanation}</p>}</div>)}{showResults ? <div className="score-banner"><Trophy size={22}/><div><strong>You scored {quiz.filter((q,i) => answers[i] === q.answer).length} out of {quiz.length}</strong><p>Keep practicing to improve your score.</p></div><button className="secondary-button" onClick={() => {setAnswers({});setShowResults(false);}}>Try again</button></div> : <button className="primary-button" disabled={Object.keys(answers).length !== quiz.length} onClick={() => setShowResults(true)}>Check my answers <ChevronRight size={17}/></button>}</> : <div className="quiz-empty"><div className="empty-art"><BrainCircuit size={30}/><Sparkles size={16}/></div><h3>Ready to test yourself?</h3><p>Go to AI Study Tools, paste your notes, and create a quiz in seconds.</p><button className="primary-button" onClick={() => go("AI Study Tools")}>Create a quiz <ChevronRight size={17}/></button></div>}</div></section>}
        <footer className="footer"><span>© 2026 StudyMate AI</span><span>Built for curious minds <span className="heart">♥</span></span></footer>
      </div>
    </main>
    {taskModal && <div className="modal-backdrop" onClick={() => setTaskModal(false)}><div className="task-modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><h3>Add a study task</h3><p>Make a little progress every day.</p></div><button className="icon-button" onClick={() => setTaskModal(false)}><X size={19}/></button></div><form onSubmit={addTask}><label>Task title<input autoFocus required value={newTask.title} onChange={e => setNewTask({...newTask,title:e.target.value})} placeholder="e.g. Revise Computer Networks"/></label><label>Subject<input value={newTask.subject} onChange={e => setNewTask({...newTask,subject:e.target.value})} placeholder="e.g. Computer Science"/></label><div className="form-row"><label>Date<input type="date" required value={newTask.date} onChange={e => setNewTask({...newTask,date:e.target.value})}/></label><label>Time<input type="time" required value={newTask.time} onChange={e => setNewTask({...newTask,time:e.target.value})}/></label></div><button className="primary-button full-button" type="submit"><Plus size={17}/> Save study task</button></form></div></div>}
  </div>;
}

function PageHeading({eyebrow,title,subtitle}) { return <div className="page-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>; }

function Overview({tasks,completed,progress,go,openTask}) {
  const todayTasks = tasks.filter(t => t.date === todayISO()).sort((a,b) => a.time.localeCompare(b.time));
  const nextTask = todayTasks.find(t => !t.done);
  return <section>
    <div className="welcome-row"><div><div className="eyebrow">TUESDAY, OCTOBER 13, 2026</div><h1>Hey there, <span className="name-highlight">Student!</span> <span className="wave">✦</span></h1><p>Ready to make today count? Let's get learning.</p></div><div className="welcome-decoration"><div className="deco-circle circle-one"/><div className="deco-circle circle-two"/><div className="book-illustration"><BookOpen size={37}/><Sparkles size={18}/></div></div></div>
    <div className="hero-card"><div className="hero-copy"><div className="hero-pill"><Sparkles size={13}/> YOUR DAILY BOOST</div><h2>A little progress<br/>goes a <em>long way.</em></h2><p>Stay curious, stay consistent. Your future self will thank you.</p><button className="hero-button" onClick={() => go("AI Study Tools")}>Start learning <ChevronRight size={17}/></button></div><div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="hero-spark spark-a">✦</div><div className="hero-spark spark-b">✧</div><div className="hero-book"><BookOpen size={67}/></div><div className="floating-chip chip-top"><BrainCircuit size={16}/> Learn</div><div className="floating-chip chip-bottom"><Check size={15}/> You've got this!</div></div></div>
    <div className="stats-grid"><StatCard icon={Target} color="purple" label="Tasks completed" value={`${completed}/${tasks.length}`} note="Across all your tasks"/><StatCard icon={Flame} color="orange" label="Daily consistency" value={`${progress}%`} note="Task completion rate"/><StatCard icon={Clock3} color="blue" label="Next study session" value={nextTask ? nextTask.time : "All clear!"} note={nextTask ? nextTask.title : "No pending tasks today"}/><StatCard icon={Trophy} color="green" label="Your momentum" value={progress === 100 && tasks.length ? "Amazing!" : "Keep going"} note="Every session counts"/></div>
    <div className="dashboard-grid"><div className="panel today-panel"><div className="panel-title-row"><div><h3>Today's study plan</h3><p>A few focused steps at a time.</p></div><button className="link-button" onClick={() => go("My Schedule")}>View all <ChevronRight size={15}/></button></div>{todayTasks.length ? todayTasks.slice(0,4).map(t => <TaskRow key={t.id} task={t} onToggle={() => {}} compact/>) : <div className="mini-empty">No study tasks planned for today.</div>}<button className="add-task-button" onClick={openTask}><Plus size={16}/> Add a study task</button></div>
      <div className="panel progress-panel"><div className="panel-title-row"><div><h3>Your progress</h3><p>You're building good habits.</p></div><div className="progress-icon"><Target size={19}/></div></div><div className="progress-ring-wrap"><svg viewBox="0 0 140 140" className="progress-ring"><circle cx="70" cy="70" r="57" className="ring-bg"/><circle cx="70" cy="70" r="57" className="ring-value" style={{strokeDasharray:`${progress/100*358} 358`}}/></svg><div className="ring-label"><strong>{progress}%</strong><span>completed</span></div></div><div className="progress-message"><span className="message-check"><Check size={14}/></span><span>{progress === 100 && tasks.length ? "Everything checked off. Brilliant!" : "Keep showing up. You're doing great!"}</span></div><button className="secondary-button full-button" onClick={() => go("My Schedule")}>View my schedule <ChevronRight size={16}/></button></div></div>
    <div className="quick-tools-heading"><div><h2>Your study toolkit</h2><p>Everything you need to study with purpose.</p></div></div><div className="quick-tools-grid"><QuickTool icon={Sparkles} tint="purple" title="AI Summarizer" desc="Turn long notes into key takeaways." action="Try summarizer" onClick={() => go("AI Study Tools")}/><QuickTool icon={BrainCircuit} tint="blue" title="Practice Quiz" desc="Test what you've learned." action="Make a quiz" onClick={() => go("AI Study Tools")}/><QuickTool icon={CalendarDays} tint="green" title="Study Planner" desc="Organize your next study session." action="Plan my day" onClick={() => go("My Schedule")}/></div>
  </section>;
}
function StatCard({icon:Icon,color,label,value,note}) { return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function TaskRow({task,onToggle,onDelete,compact=false}) { return <div className={`task-row ${task.done?"task-done":""} ${compact?"compact-task":""}`}><button className={`task-check ${task.done?"checked":""}`} onClick={() => onToggle(task.id)} aria-label={task.done?"Mark incomplete":"Mark complete"}>{task.done && <Check size={14}/>}</button><div className="task-main"><strong>{task.title}</strong><span>{task.subject}</span></div><div className="task-time"><Clock3 size={14}/>{task.time}</div>{!compact && <button className="icon-button delete-button" onClick={() => onDelete(task.id)} aria-label="Delete task"><Trash2 size={16}/></button>}</div>; }
function QuickTool({icon:Icon,tint,title,desc,action,onClick}) { return <div className="quick-tool"><div className={`quick-tool-icon ${tint}`}><Icon size={20}/></div><h3>{title}</h3><p>{desc}</p><button className="link-button" onClick={onClick}>{action} <ChevronRight size={15}/></button></div>; }

createRoot(document.getElementById("root")).render(<App/>);