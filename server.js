const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Use the PORT provided by Railway (or fallback to 3000 for local dev)
const port = process.env.PORT || 3000;

// === Supabase credentials from environment variables ===
const supabaseUrl = process.env.SUPABASE_URL || 'https://flqjilnjzpdfpkpwwiqr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

// Validate that we have the required credentials
if (!supabaseKey) {
  console.error('❌ SUPABASE_KEY environment variable is required!');
  console.error('Please set it in your Railway dashboard under Variables tab');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

// Serve static files from the "public" folder (where index.html should live)
app.use(express.static('public'));

// ────────────────────────────────────────────────
// API Routes
// ────────────────────────────────────────────────

// GET all tasks – newest first
app.get('/api/tasks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST – create new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: title.trim(), description: description?.trim() || null }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PUT – update task (title and/or description)
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Task not found' });

    res.json(data[0]);
  } catch (error) {
    console.error('PUT /api/tasks error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PATCH – toggle completed status
app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be boolean' });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Task not found' });

    res.json(data[0]);
  } catch (error) {
    console.error('PATCH /api/tasks/complete error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE – remove task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).end();
  } catch (error) {
    console.error('DELETE /api/tasks error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ────────────────────────────────────────────────
// Railway/Vercel serverless support + local dev fallback
// ────────────────────────────────────────────────
module.exports = app;

// For local development only
if (require.main === module) {
  app.listen(port, () => {
    console.log(`✅ Server running → http://localhost:${port}`);
    console.log('📁 Make sure index.html is in the "public" folder');
  });
}