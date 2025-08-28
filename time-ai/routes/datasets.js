import express from 'express';
import { google } from 'googleapis';
import { Octokit } from 'octokit';

const router = express.Router();

// Google Drive integration
router.get('/google-drive/files', async (req, res) => {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    auth.setCredentials({ access_token: req.headers.authorization?.split(' ')[1] });
    const drive = google.drive({ version: 'v3', auth });
    
    const response = await drive.files.list({
      q: "mimeType contains 'text/' or mimeType='application/json' or mimeType='text/csv'",
      fields: 'files(id, name, mimeType, size, modifiedTime)'
    });
    
    res.json(response.data.files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Google Drive files' });
  }
});

router.get('/google-drive/download/:fileId', async (req, res) => {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    auth.setCredentials({ access_token: req.headers.authorization?.split(' ')[1] });
    const drive = google.drive({ version: 'v3', auth });
    
    const response = await drive.files.get({
      fileId: req.params.fileId,
      alt: 'media'
    });
    
    res.json({ content: response.data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// GitHub integration
router.get('/github/repos', async (req, res) => {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const response = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 50
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GitHub repositories' });
  }
});

router.get('/github/files/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: req.query.path || ''
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repository files' });
  }
});

export default router;