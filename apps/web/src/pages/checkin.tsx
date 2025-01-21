import React, { useState } from 'react';

export default function CheckIn(){
  const [taskId, setTaskId] = useState<string>('1');
  const [message, setMessage] = useState<string>('');
  const [history, setHistory] = useState<Array<{ taskId: string; ts: number }>>([]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ts = Date.now();
    setHistory(prev => [{ taskId, ts }, ...prev]);
    setMessage(`Check-in submitted for task ${taskId} at ${new Date(ts).toLocaleString()}`);
  };

  return (
    <main>
      <h1>Daily Check-In</h1>
      <form onSubmit={onSubmit}>
        <label>
          Task ID
          <input value={taskId} onChange={e => setTaskId(e.target.value)} />
        </label>
        <button type="submit">Submit Check-In</button>
      </form>
      {message && <p aria-live="polite">{message}</p>}
      <section>
        <h2>Recent</h2>
        <ul>
          {history.map((h, i) => (
            <li key={i}>Task {h.taskId} at {new Date(h.ts).toLocaleString()}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
