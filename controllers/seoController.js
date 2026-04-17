const supabase = require('../config/db');

// @desc    Generate a dynamic sitemap.xml
// @route   GET /sitemap.xml
const getSitemap = async (req, res) => {
  const baseUrl = 'https://www.dclubfarmers.com';
  
  try {
    const [jobsRes, blogsRes] = await Promise.all([
      supabase.from('jobs').select('id, created_at'),
      supabase.from('blogs').select('slug, updated_at').eq('is_published', true)
    ]);

    const jobs = jobsRes.data || [];
    const blogs = blogsRes.data || [];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/career</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Add Dynamic Jobs
    jobs.forEach(job => {
      xml += `
  <url>
    <loc>${baseUrl}/career/${job.id}</loc>
    <lastmod>${new Date(job.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Add Dynamic Blogs
    blogs.forEach(blog => {
      xml += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${new Date(blog.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
};

// @desc    Generate robots.txt
// @route   GET /robots.txt
const getRobotsTxt = (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*

Sitemap: https://www.dclubfarmers.com/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
};

module.exports = { getSitemap, getRobotsTxt };
