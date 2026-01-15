const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

// === Replace with your Supabase credentials ===
const supabaseUrl = 'https://flqjilnjzpdfpkpwwiqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWppbG5qenBkZnBrcHd3aXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTIyOTEsImV4cCI6MjA4Mzg2ODI5MX0.YQT__qYIWQ2SiFYh9_k1guCdvBp0vIxPgwbPM6qDsEc';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(express.static(__dirname)); // serves index.html

// GET all tasks – newest first
app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST new task
app.post('/api/tasks', async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, description }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// PUT update task (title + description)
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description || null;

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(404).json({ error: 'Task not found' });

  res.json(data[0]);
});

// PATCH toggle complete
app.patch('/api/tasks/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(404).json({ error: 'Task not found' });

  res.json(data[0]);
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

app.listen(port, () => {
  console.log(`Server running → http://localhost:${port}`);
});