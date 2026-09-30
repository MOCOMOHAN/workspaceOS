import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, MessageSquare, Trash2, Check, X, Edit3, AlignLeft, Bot, Send } from 'lucide-react';
import './index.css';

const DAYS_IN_CYCLE = 30;
const DAYS_ARRAY = Array.from({ length: DAYS_IN_CYCLE }, (_, i) => i + 1);

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('bauhaus-30day-tracker');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      tasks: [
        { id: uuidv4(), title: 'Example Task (e.g. Read 10 pages)' },
      ],
      records: {}, 
      analysis: {} 
    };
  });

  const [activeCell, setActiveCell] = useState(null); 
  const [activeDay, setActiveDay] = useState(null); 
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => {
    const savedChat = localStorage.getItem('bauhaus-chat-history');
    if (savedChat) {
      return JSON.parse(savedChat);
    }
    return [
      { role: 'assistant', content: 'Hello! I am your AI assistant. I can analyze your 30-day habits and answer questions.' }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatMessagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('bauhaus-30day-tracker', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('bauhaus-chat-history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (isChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = { id: uuidv4(), title: newTaskTitle };
    setData({
      ...data,
      tasks: [...data.tasks, newTask]
    });
    setNewTaskTitle('');
  };

  const updateTaskTitle = (taskId, newTitle) => {
    setData({
      ...data,
      tasks: data.tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t)
    });
  };

  const deleteTask = (taskId) => {
    const updatedTasks = data.tasks.filter(t => t.id !== taskId);
    const updatedRecords = { ...data.records };
    delete updatedRecords[taskId];
    setData({
      ...data,
      tasks: updatedTasks,
      records: updatedRecords
    });
  };

  const toggleCheck = (taskId, day) => {
    const taskRecords = data.records[taskId] || {};
    const cellRecord = taskRecords[day] || { completed: false, comment: '' };
    
    setData({
      ...data,
      records: {
        ...data.records,
        [taskId]: {
          ...taskRecords,
          [day]: { ...cellRecord, completed: !cellRecord.completed }
        }
      }
    });
  };

  const updateComment = (taskId, day, comment) => {
    const taskRecords = data.records[taskId] || {};
    const cellRecord = taskRecords[day] || { completed: false, comment: '' };
    
    setData({
      ...data,
      records: {
        ...data.records,
        [taskId]: {
          ...taskRecords,
          [day]: { ...cellRecord, comment }
        }
      }
    });
  };

  const updateAnalysis = (day, text) => {
    setData({
      ...data,
      analysis: {
        ...data.analysis,
        [day]: text
      }
    });
  };

  // Chat API Handler
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    const systemPrompt = {
      role: 'system',
      content: `You are an analytical productivity assistant integrated into a Bauhaus-style 30-day task tracker. 
Here is the user's current 30-day cycle data:
Tasks: ${JSON.stringify(data.tasks)}
Records (Format: {taskId: {dayNumber: {completed, comment}}}): ${JSON.stringify(data.records)}
Daily Analysis (Format: {dayNumber: analysisText}): ${JSON.stringify(data.analysis)}

Provide short, encouraging, and highly analytical insights based on this data. Keep responses concise.`
    };

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b',
          messages: [systemPrompt, ...newMessages],
          stream: false
        })
      });
      const result = await response.json();
      if (result.message) {
        setChatMessages([...newMessages, result.message]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages([...newMessages, { role: 'assistant', content: 'Error connecting to local Ollama. Make sure llama3.1:8b is running at http://localhost:11434/' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- STATS CALCULATIONS ---
  const totalTasks = data.tasks.length;
  const totalChecksPossible = totalTasks * DAYS_IN_CYCLE;
  let totalCompletedChecks = 0;
  let longestPerfectStreak = 0;
  let currentPerfectStreak = 0;

  if (totalTasks > 0) {
    for (let day = 1; day <= DAYS_IN_CYCLE; day++) {
      let dayCompletedCount = 0;
      data.tasks.forEach(task => {
        if (data.records[task.id] && data.records[task.id][day]?.completed) {
          totalCompletedChecks++;
          dayCompletedCount++;
        }
      });
      
      // A perfect streak is when ALL tasks are completed on that day
      if (dayCompletedCount === totalTasks && totalTasks > 0) {
        currentPerfectStreak++;
        if (currentPerfectStreak > longestPerfectStreak) {
          longestPerfectStreak = currentPerfectStreak;
        }
      } else {
        currentPerfectStreak = 0;
      }
    }
  }

  const overallProgressPercentage = totalChecksPossible === 0 
    ? 0 
    : Math.round((totalCompletedChecks / totalChecksPossible) * 100);

  return (
    <div className="app-container">
      <div className="header-bar stacked-box stacked-box-yellow" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h1 className="header-title">30-Day Cycle Tracker</h1>
        <div style={{ fontWeight: 600 }}>Bauhaus Edition</div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card stacked-box stacked-box-yellow">
          <div className="stat-label">Cycle Progress</div>
          <div className="stat-value">{overallProgressPercentage}%</div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${overallProgressPercentage}%` }}></div>
          </div>
        </div>
        <div className="stat-card stacked-box stacked-box-blue">
          <div className="stat-label">Total Habits Completed</div>
          <div className="stat-value">{totalCompletedChecks}</div>
          <div style={{ fontWeight: '600' }}>Out of {totalChecksPossible}</div>
        </div>
        <div className="stat-card stacked-box stacked-box-red">
          <div className="stat-label">Longest Perfect Streak</div>
          <div className="stat-value">{longestPerfectStreak} <span style={{ fontSize: '1rem' }}>days</span></div>
          <div style={{ fontWeight: '600' }}>Consecutive days all tasks checked</div>
        </div>
      </div>

      <div className="grid-container-wrapper">
        <table className="tracker-table">
          <thead>
            <tr>
              <th className="task-col">Habits & Tasks</th>
              {DAYS_ARRAY.map(day => (
                <th 
                  key={day} 
                  className="day-col" 
                  onClick={() => setActiveDay(day)}
                  title="Click to add Daily Analysis"
                >
                  {day < 10 ? `0${day}` : day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.tasks.map(task => (
              <tr key={task.id}>
                <td className="task-name-cell">
                  <div className="task-name-wrapper">
                    <input 
                      type="text" 
                      className="task-name-input"
                      value={task.title}
                      onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                    />
                    <button 
                      className="btn btn-icon" 
                      style={{ padding: '0.25rem', border: '2px solid var(--b-black)' }}
                      onClick={() => deleteTask(task.id)}
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Task Progress Bar */}
                  {(() => {
                    let taskCompleted = 0;
                    for (let day = 1; day <= DAYS_IN_CYCLE; day++) {
                       if (data.records[task.id] && data.records[task.id][day]?.completed) {
                         taskCompleted++;
                       }
                    }
                    const percent = Math.round((taskCompleted / DAYS_IN_CYCLE) * 100);
                    return (
                      <div className="task-progress-wrapper">
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Completion</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="task-progress-bar">
                          <div className="task-progress-fill" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })()}
                </td>
                {DAYS_ARRAY.map(day => {
                  const cellRecord = (data.records[task.id] && data.records[task.id][day]) || { completed: false, comment: '' };
                  const hasComment = cellRecord.comment && cellRecord.comment.trim().length > 0;
                  
                  return (
                    <td 
                      key={day} 
                      className={`check-cell ${cellRecord.completed ? 'completed' : ''}`}
                    >
                      <div className="check-cell-content" onClick={() => toggleCheck(task.id, day)}>
                        <div className="check-icon">
                          {cellRecord.completed && <Check size={16} color="white" />}
                        </div>
                        {hasComment && (
                          <MessageSquare size={12} className="comment-indicator" />
                        )}
                        
                        {/* Hover/Click area for opening comment modal */}
                        <div 
                          style={{ position: 'absolute', right: 4, bottom: 4, cursor: 'pointer', padding: '2px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCell({ taskId: task.id, day });
                          }}
                          title="Add/Edit Comment"
                        >
                          <Edit3 size={14} opacity={0.4} />
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="add-task-row">
              <td className="task-name-cell" style={{ padding: '1rem' }}>
                <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="New task..." 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    style={{ flexGrow: 1, padding: '0.25rem 0.5rem' }}
                  />
                  <button type="submit" className="btn btn-icon" style={{ padding: '0.25rem 0.5rem' }}>
                    <Plus size={16} />
                  </button>
                </form>
              </td>
              <td colSpan={DAYS_IN_CYCLE} style={{ background: 'var(--b-bg)' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Chat Floating Button */}
      <div className="chat-fab" onClick={() => setIsChatOpen(!isChatOpen)}>
        {isChatOpen ? <X size={28} /> : <Bot size={28} />}
      </div>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="chat-window stacked-box">
          <div className="stacked-box-blue" style={{ padding: '1rem', borderBottom: '4px solid var(--b-black)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bot /> AI Assistant</h3>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>llama3.1:8b</span>
          </div>
          
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isChatLoading && (
              <div className="chat-message assistant">
                <span className="loading-dots">Thinking</span>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={sendChatMessage}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ask about your habits..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatLoading}
            />
            <button type="submit" className="btn btn-icon" style={{ background: 'var(--b-white)' }} disabled={isChatLoading}>
              <Send size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Cell Comment Modal */}
      {activeCell && (() => {
        const task = data.tasks.find(t => t.id === activeCell.taskId);
        const cellRecord = (data.records[activeCell.taskId] && data.records[activeCell.taskId][activeCell.day]) || { completed: false, comment: '' };
        
        return (
          <div className="modal-overlay" onClick={() => setActiveCell(null)}>
            <div className="modal-content stacked-box stacked-box-blue" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setActiveCell(null)}><X size={20} /></button>
              <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare /> Task Comment
              </h2>
              <div style={{ marginBottom: '1rem', fontWeight: 600, opacity: 0.9 }}>
                Day {activeCell.day} - {task?.title}
              </div>
              <textarea 
                className="input-field comment-textarea"
                placeholder="Write your comment, notes, or blockers for this specific task today..."
                value={cellRecord.comment}
                onChange={(e) => updateComment(activeCell.taskId, activeCell.day, e.target.value)}
                autoFocus
              ></textarea>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn" 
                  onClick={() => toggleCheck(activeCell.taskId, activeCell.day)}
                  style={{ background: cellRecord.completed ? 'var(--b-yellow)' : 'var(--b-white)' }}
                >
                  <Check size={18} /> {cellRecord.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Day Analysis Modal */}
      {activeDay && (() => {
        const analysisText = data.analysis[activeDay] || '';
        
        return (
          <div className="modal-overlay" onClick={() => setActiveDay(null)}>
            <div className="modal-content stacked-box stacked-box-red" onClick={e => e.stopPropagation()}>
              <button className="modal-close" style={{ background: 'var(--b-yellow)', color: 'var(--b-black)' }} onClick={() => setActiveDay(null)}>
                <X size={20} />
              </button>
              <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlignLeft /> Day {activeDay} Analysis
              </h2>
              <div style={{ marginBottom: '1rem', fontWeight: 600, opacity: 0.9 }}>
                Reflect on your overall progress and learnings for the day.
              </div>
              <textarea 
                className="input-field analysis-textarea"
                placeholder="How did today go?"
                value={analysisText}
                onChange={(e) => updateAnalysis(activeDay, e.target.value)}
                autoFocus
              ></textarea>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default App;
