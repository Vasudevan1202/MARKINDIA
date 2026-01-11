const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let ads = [
  { _id: '1', title: 'Example Ad', price: 100, description: 'This is a sample ad.' }
];

app.get('/api/ads', (req, res) => {
  res.json(ads);
});

app.post('/api/ads', (req, res) => {
  const { title, price, description, images, userId, userPhone, category, location } = req.body;
  const newAd = {
    _id: Date.now().toString(),
    title,
    price,
    description,
    images: images || [],
    userId,
    userPhone,
    category,
    location
  };
  ads.push(newAd);
  res.status(201).json(newAd);
});

app.put('/api/ads/:id', (req, res) => {
  const { id } = req.params;
  const { title, price, description, images, userId, category, location } = req.body;
  const authUserId = req.headers['user-id'];

  const adIndex = ads.findIndex(ad => ad._id === id);
  if (adIndex === -1) return res.status(404).json({ error: "Ad not found" });

  if (ads[adIndex].userId !== authUserId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  ads[adIndex] = {
    ...ads[adIndex],
    title,
    price,
    description,
    images: images || ads[adIndex].images,
    category: category || ads[adIndex].category,
    location: location || ads[adIndex].location
  };

  res.json(ads[adIndex]);
});

app.delete('/api/ads/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.headers['user-id'];
  
  const adIndex = ads.findIndex(ad => ad._id === id);
  if (adIndex === -1) return res.status(404).send();
  
  if (ads[adIndex].userId !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  ads.splice(adIndex, 1);
  res.status(204).send();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

