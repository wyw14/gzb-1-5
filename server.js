const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const DATA_DIR = path.join(__dirname, 'data');

const readJSON = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data || '[]');
};

const writeJSON = (filename, data) => {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const calculateNextCare = (plant) => {
  const now = new Date();
  const lastWatering = plant.lastWatering ? new Date(plant.lastWatering) : now;
  const lastFertilizing = plant.lastFertilizing ? new Date(plant.lastFertilizing) : now;
  
  const nextWatering = new Date(lastWatering.getTime() + plant.wateringCycle * 24 * 60 * 60 * 1000);
  const nextFertilizing = new Date(lastFertilizing.getTime() + plant.fertilizingCycle * 24 * 60 * 60 * 1000);
  
  return {
    nextWatering: nextWatering.toISOString(),
    nextFertilizing: nextFertilizing.toISOString()
  };
};

const pestsKnowledge = [
  {
    id: 1,
    name: '蚜虫',
    keywords: ['蚜虫', '蜜露', '卷曲', '黄叶', '小黑点', '发粘'],
    symptoms: '叶片背面出现绿色或黑色小虫，分泌蜜露，叶片卷曲发黄',
    treatment: '用清水冲洗，喷施肥皂水或杀虫剂，引入瓢虫等天敌',
    prevention: '保持通风，定期检查新叶，避免过度施肥'
  },
  {
    id: 2,
    name: '红蜘蛛',
    keywords: ['红蜘蛛', '蛛网', '白点', '失绿', '枯萎', '蜘蛛网'],
    symptoms: '叶片出现白色小点，严重时覆盖蛛网，叶片枯黄脱落',
    treatment: '增加湿度，喷施阿维菌素或螨虫专用药剂',
    prevention: '保持空气湿度，定期喷水，避免高温干燥环境'
  },
  {
    id: 3,
    name: '白粉病',
    keywords: ['白粉', '白斑', '粉状', '霉层', '白色粉末'],
    symptoms: '叶片表面出现白色粉状霉层，逐渐扩大导致叶片枯萎',
    treatment: '摘除病叶，喷施小苏打溶液或杀菌剂',
    prevention: '保持通风透光，避免叶片积水，合理密植'
  },
  {
    id: 4,
    name: '根腐病',
    keywords: ['根腐', '烂根', '倒伏', '萎蔫', '黑根', '发臭'],
    symptoms: '植株萎蔫，叶片发黄，根部发黑腐烂有臭味',
    treatment: '切除腐烂部分，更换土壤，减少浇水，喷施多菌灵',
    prevention: '选用透气土壤，避免积水，浇水见干见湿'
  },
  {
    id: 5,
    name: '叶斑病',
    keywords: ['叶斑', '黑斑', '褐斑', '斑点', '穿孔'],
    symptoms: '叶片出现圆形或不规则褐色斑点，严重时穿孔脱落',
    treatment: '摘除病叶，喷施代森锰锌或多菌灵',
    prevention: '保持通风，避免夜间浇水，及时清除落叶'
  },
  {
    id: 6,
    name: '介壳虫',
    keywords: ['介壳虫', '蚧壳虫', '蜡质', '褐色斑点', '固定不动'],
    symptoms: '茎干和叶片出现褐色蜡质小虫，固定不动，分泌蜜露',
    treatment: '用棉签蘸酒精擦拭，喷施杀扑磷或噻嗪酮',
    prevention: '定期检查，保持通风，新植物隔离观察'
  },
  {
    id: 7,
    name: '炭疽病',
    keywords: ['炭疽', '凹陷斑', '小黑点', '轮纹', '坏死'],
    symptoms: '叶片出现圆形凹陷病斑，中央有小黑点，呈轮纹状',
    treatment: '剪除病枝病叶，喷施咪鲜胺或苯醚甲环唑',
    prevention: '减少机械损伤，合理施肥，增强植株抗性'
  },
  {
    id: 8,
    name: '蓟马',
    keywords: ['蓟马', '锉吸', '银灰色', '畸形', '卷叶'],
    symptoms: '叶片出现银灰色斑点，嫩叶畸形卷曲，花期受害严重',
    treatment: '喷施吡虫啉或噻虫嗪，悬挂蓝色粘虫板',
    prevention: '清除杂草，保持通风，定期检查'
  },
  {
    id: 9,
    name: '灰霉病',
    keywords: ['灰霉', '灰毛', '腐烂', '软腐', '灰色霉层'],
    symptoms: '花、果、叶出现褐色腐烂，表面覆盖灰色霉层',
    treatment: '摘除病部，喷施腐霉利或异菌脲',
    prevention: '降低湿度，保持通风，避免植株受伤'
  },
  {
    id: 10,
    name: '线虫病',
    keywords: ['线虫', '根结', '矮化', '小疙瘩', '根部肿瘤'],
    symptoms: '植株矮化黄化，根部出现小疙瘩状根结',
    treatment: '更换土壤，使用杀线虫剂，热水处理根系',
    prevention: '土壤消毒，使用无病种苗，轮作换茬'
  }
];

app.get('/api/plants', (req, res) => {
  const { difficulty } = req.query;
  let plants = readJSON('plants.json');
  
  plants = plants.map(plant => {
    const nextCare = calculateNextCare(plant);
    return { ...plant, ...nextCare };
  });
  
  if (difficulty) {
    plants = plants.filter(p => p.difficulty === difficulty);
  }
  
  res.json(plants);
});

app.post('/api/plants', (req, res) => {
  const plants = readJSON('plants.json');
  const now = new Date().toISOString();
  const newPlant = {
    id: generateId(),
    ...req.body,
    createdAt: now,
    lastWatering: req.body.lastWatering || now,
    lastFertilizing: req.body.lastFertilizing || now,
    status: 'healthy'
  };
  plants.push(newPlant);
  writeJSON('plants.json', plants);
  
  const nextCare = calculateNextCare(newPlant);
  res.json({ ...newPlant, ...nextCare });
});

app.put('/api/plants/:id', (req, res) => {
  const plants = readJSON('plants.json');
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '植物不存在' });
  }
  plants[index] = { ...plants[index], ...req.body, updatedAt: new Date().toISOString() };
  writeJSON('plants.json', plants);
  
  const nextCare = calculateNextCare(plants[index]);
  res.json({ ...plants[index], ...nextCare });
});

app.delete('/api/plants/:id', (req, res) => {
  let plants = readJSON('plants.json');
  const plant = plants.find(p => p.id === req.params.id);
  if (!plant) {
    return res.status(404).json({ error: '植物不存在' });
  }
  plants = plants.filter(p => p.id !== req.params.id);
  writeJSON('plants.json', plants);
  res.json({ message: '删除成功' });
});

app.post('/api/plants/:id/water', (req, res) => {
  const plants = readJSON('plants.json');
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '植物不存在' });
  }
  const now = new Date().toISOString();
  plants[index].lastWatering = now;
  plants[index].status = 'healthy';
  writeJSON('plants.json', plants);
  
  const careRecords = readJSON('care-records.json');
  careRecords.push({
    id: generateId(),
    plantId: req.params.id,
    type: 'watering',
    date: now,
    completed: true
  });
  writeJSON('care-records.json', careRecords);
  
  const nextCare = calculateNextCare(plants[index]);
  res.json({ ...plants[index], ...nextCare });
});

app.post('/api/plants/:id/fertilize', (req, res) => {
  const plants = readJSON('plants.json');
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '植物不存在' });
  }
  const now = new Date().toISOString();
  plants[index].lastFertilizing = now;
  plants[index].status = 'healthy';
  writeJSON('plants.json', plants);
  
  const careRecords = readJSON('care-records.json');
  careRecords.push({
    id: generateId(),
    plantId: req.params.id,
    type: 'fertilizing',
    date: now,
    completed: true
  });
  writeJSON('care-records.json', careRecords);
  
  const nextCare = calculateNextCare(plants[index]);
  res.json({ ...plants[index], ...nextCare });
});

app.get('/api/plants/:id/photos', (req, res) => {
  const photos = readJSON('photos.json');
  const plantPhotos = photos.filter(p => p.plantId === req.params.id);
  plantPhotos.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(plantPhotos);
});

app.post('/api/plants/:id/photos', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传照片' });
  }
  const photos = readJSON('photos.json');
  const newPhoto = {
    id: generateId(),
    plantId: req.params.id,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    date: new Date().toISOString(),
    note: req.body.note || ''
  };
  photos.push(newPhoto);
  writeJSON('photos.json', photos);
  res.json(newPhoto);
});

app.delete('/api/photos/:id', (req, res) => {
  let photos = readJSON('photos.json');
  const photo = photos.find(p => p.id === req.params.id);
  if (!photo) {
    return res.status(404).json({ error: '照片不存在' });
  }
  const filePath = path.join(__dirname, 'public', photo.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  photos = photos.filter(p => p.id !== req.params.id);
  writeJSON('photos.json', photos);
  res.json({ message: '删除成功' });
});

const riskKeywords = [
  { keywords: ['枯萎', '死亡', '倒伏', '发臭', '烂根', '根腐'], score: 30 },
  { keywords: ['腐烂', '软腐', '黑根', '萎蔫'], score: 25 },
  { keywords: ['蚜虫', '红蜘蛛', '介壳虫', '蓟马', '线虫'], score: 20 },
  { keywords: ['黑斑', '褐斑', '白粉', '灰霉', '炭疽', '叶斑'], score: 20 },
  { keywords: ['黄叶', '卷曲', '掉叶', '畸形'], score: 15 },
  { keywords: ['白斑', '蛛网', '蜜露', '蜡质', '银灰色'], score: 15 },
  { keywords: ['失绿', '小黑点', '粉状'], score: 10 }
];

const calculateRiskScore = (symptoms) => {
  if (!symptoms) return 0;
  let totalScore = 0;
  const matchedKeywords = [];
  riskKeywords.forEach(group => {
    group.keywords.forEach(kw => {
      if (symptoms.includes(kw)) {
        totalScore += group.score;
        matchedKeywords.push(kw);
      }
    });
  });
  return { score: Math.min(totalScore, 100), matchedKeywords };
};

const severityFromRiskScore = (score) => {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'major';
  if (score >= 15) return 'minor';
  return 'low';
};

app.get('/api/pests', (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.json(pestsKnowledge);
  }
  const results = pestsKnowledge.filter(pest => 
    pest.keywords.some(kw => 
      kw.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(kw.toLowerCase())
    ) ||
    pest.name.toLowerCase().includes(keyword.toLowerCase()) ||
    pest.symptoms.toLowerCase().includes(keyword.toLowerCase())
  );
  res.json(results);
});

app.get('/api/pests/:id', (req, res) => {
  const pest = pestsKnowledge.find(p => p.id === parseInt(req.params.id));
  if (!pest) {
    return res.status(404).json({ error: '病虫害不存在' });
  }
  res.json(pest);
});

app.get('/api/inspections', (req, res) => {
  const { status, plantId } = req.query;
  let orders = readJSON('inspection-orders.json');
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  if (plantId) {
    orders = orders.filter(o => o.plantId === plantId);
  }
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

app.post('/api/inspections', upload.single('photo'), (req, res) => {
  const { symptoms, plantId, handler } = req.body;
  if (!symptoms || !plantId) {
    return res.status(400).json({ error: '症状和植物号为必填项' });
  }
  if (!req.file) {
    return res.status(400).json({ error: '照片为必填项，请上传巡检照片' });
  }
  const plants = readJSON('plants.json');
  const plant = plants.find(p => p.id === plantId);
  if (!plant) {
    return res.status(404).json({ error: '植物不存在' });
  }
  const { score, matchedKeywords } = calculateRiskScore(symptoms);
  const severity = severityFromRiskScore(score);
  const orders = readJSON('inspection-orders.json');
  const now = new Date().toISOString();
  const newOrder = {
    id: generateId(),
    symptoms,
    plantId,
    plantName: plant.name,
    handler: handler || '',
    severity,
    riskScore: score,
    matchedKeywords,
    photo: `/uploads/${req.file.filename}`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    trackingLog: [{ action: '创建工单', time: now, note: `风险分: ${score}, 严重度: ${severity}` }]
  };
  orders.push(newOrder);
  writeJSON('inspection-orders.json', orders);
  res.json(newOrder);
});

app.put('/api/inspections/:id', (req, res) => {
  const orders = readJSON('inspection-orders.json');
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }
  const { action, note, handler, status, symptoms } = req.body;
  const now = new Date().toISOString();
  if (handler !== undefined) orders[index].handler = handler;
  if (status) orders[index].status = status;
  if (symptoms) {
    orders[index].symptoms = symptoms;
    const { score, matchedKeywords } = calculateRiskScore(symptoms);
    orders[index].riskScore = score;
    orders[index].matchedKeywords = matchedKeywords;
    orders[index].severity = severityFromRiskScore(score);
  }
  if (action) {
    orders[index].trackingLog = orders[index].trackingLog || [];
    orders[index].trackingLog.push({ action, time: now, note: note || '' });
  }
  orders[index].updatedAt = now;
  writeJSON('inspection-orders.json', orders);
  res.json(orders[index]);
});

app.put('/api/inspections/:id/accept', (req, res) => {
  const orders = readJSON('inspection-orders.json');
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }
  const now = new Date().toISOString();
  orders[index].status = 'accepted';
  orders[index].trackingLog = orders[index].trackingLog || [];
  orders[index].trackingLog.push({ action: '已接单', time: now, note: `处理人: ${orders[index].handler}` });
  orders[index].updatedAt = now;
  writeJSON('inspection-orders.json', orders);
  res.json(orders[index]);
});

app.put('/api/inspections/:id/verify', (req, res) => {
  const orders = readJSON('inspection-orders.json');
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }
  const { result } = req.body;
  const now = new Date().toISOString();
  orders[index].status = result === 'reject' ? 'rejected' : 'verified';
  orders[index].trackingLog = orders[index].trackingLog || [];
  orders[index].trackingLog.push({
    action: result === 'reject' ? '验收不通过' : '验收通过',
    time: now,
    note: req.body.note || ''
  });
  orders[index].updatedAt = now;
  writeJSON('inspection-orders.json', orders);
  res.json(orders[index]);
});

app.get('/api/statistics', (req, res) => {
  const plants = readJSON('plants.json');
  const careRecords = readJSON('care-records.json');
  const photos = readJSON('photos.json');
  
  const totalPlants = plants.length;
  const alivePlants = plants.filter(p => p.status !== 'dead').length;
  const survivalRate = totalPlants > 0 ? Math.round((alivePlants / totalPlants) * 100) : 0;
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentRecords = careRecords.filter(r => new Date(r.date) >= thirtyDaysAgo);
  
  let overdueCount = 0;
  let upcomingCount = 0;
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  plants.forEach(plant => {
    const nextCare = calculateNextCare(plant);
    const nextWatering = new Date(nextCare.nextWatering);
    const nextFertilizing = new Date(nextCare.nextFertilizing);
    
    if (nextWatering < now || nextFertilizing < now) {
      overdueCount++;
    }
    if ((nextWatering >= now && nextWatering <= sevenDaysLater) ||
        (nextFertilizing >= now && nextFertilizing <= sevenDaysLater)) {
      upcomingCount++;
    }
  });
  
  const difficultyStats = {};
  plants.forEach(p => {
    difficultyStats[p.difficulty] = (difficultyStats[p.difficulty] || 0) + 1;
  });
  
  const careTypeStats = {
    watering: careRecords.filter(r => r.type === 'watering').length,
    fertilizing: careRecords.filter(r => r.type === 'fertilizing').length
  };
  
  const completedRecords = careRecords.filter(r => r.completed).length;
  const totalExpected = plants.length * 4;
  const complianceRate = totalExpected > 0 ? Math.min(Math.round((completedRecords / totalExpected) * 100), 100) : 0;
  
  const monthlyStats = {};
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyStats[monthKey] = {
      watering: 0,
      fertilizing: 0,
      newPlants: 0
    };
  }
  
  careRecords.forEach(record => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyStats[monthKey]) {
      if (record.type === 'watering') monthlyStats[monthKey].watering++;
      if (record.type === 'fertilizing') monthlyStats[monthKey].fertilizing++;
    }
  });
  
  plants.forEach(plant => {
    const date = new Date(plant.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyStats[monthKey]) {
      monthlyStats[monthKey].newPlants++;
    }
  });
  
  res.json({
    totalPlants,
    alivePlants,
    survivalRate,
    complianceRate,
    overdueCount,
    upcomingCount,
    totalPhotos: photos.length,
    totalCareRecords: careRecords.length,
    difficultyStats,
    careTypeStats,
    monthlyStats
  });
});

app.get('/api/report/yearly', (req, res) => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  
  const plants = readJSON('plants.json');
  const careRecords = readJSON('care-records.json');
  const photos = readJSON('photos.json');
  
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear + 1, 0, 1);
  
  const yearPlants = plants.filter(p => new Date(p.createdAt) < endDate);
  const yearRecords = careRecords.filter(r => {
    const date = new Date(r.date);
    return date >= startDate && date < endDate;
  });
  const yearPhotos = photos.filter(p => {
    const date = new Date(p.date);
    return date >= startDate && date < endDate;
  });
  
  const alivePlants = yearPlants.filter(p => p.status !== 'dead').length;
  const survivalRate = yearPlants.length > 0 ? Math.round((alivePlants / yearPlants.length) * 100) : 0;
  
  const monthlyData = {};
  for (let i = 0; i < 12; i++) {
    const monthKey = `${targetYear}-${String(i + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = {
      watering: 0,
      fertilizing: 0,
      photos: 0,
      newPlants: 0
    };
  }
  
  yearRecords.forEach(record => {
    const date = new Date(record.date);
    const monthKey = `${targetYear}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[monthKey]) {
      if (record.type === 'watering') monthlyData[monthKey].watering++;
      if (record.type === 'fertilizing') monthlyData[monthKey].fertilizing++;
    }
  });
  
  yearPhotos.forEach(photo => {
    const date = new Date(photo.date);
    const monthKey = `${targetYear}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].photos++;
    }
  });
  
  yearPlants.forEach(plant => {
    const date = new Date(plant.createdAt);
    if (date.getFullYear() === targetYear) {
      const monthKey = `${targetYear}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].newPlants++;
      }
    }
  });
  
  const difficultyStats = {};
  yearPlants.forEach(p => {
    difficultyStats[p.difficulty] = (difficultyStats[p.difficulty] || 0) + 1;
  });
  
  const lightStats = {};
  yearPlants.forEach(p => {
    lightStats[p.lightPreference] = (lightStats[p.lightPreference] || 0) + 1;
  });
  
  const totalWatering = yearRecords.filter(r => r.type === 'watering').length;
  const totalFertilizing = yearRecords.filter(r => r.type === 'fertilizing').length;
  const completedRecords = yearRecords.filter(r => r.completed).length;
  const complianceRate = yearRecords.length > 0 ? Math.round((completedRecords / yearRecords.length) * 100) : 100;
  
  const plantDetails = yearPlants.map(plant => {
    const plantRecords = yearRecords.filter(r => r.plantId === plant.id);
    const plantPhotos = yearPhotos.filter(p => p.plantId === plant.id);
    return {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      difficulty: plant.difficulty,
      status: plant.status,
      wateringCount: plantRecords.filter(r => r.type === 'watering').length,
      fertilizingCount: plantRecords.filter(r => r.type === 'fertilizing').length,
      photoCount: plantPhotos.length,
      createdAt: plant.createdAt
    };
  });
  
  const report = {
    year: targetYear,
    generatedAt: new Date().toISOString(),
    summary: {
      totalPlants: yearPlants.length,
      alivePlants,
      survivalRate,
      complianceRate,
      totalWatering,
      totalFertilizing,
      totalPhotos: yearPhotos.length,
      totalRecords: yearRecords.length
    },
    monthlyData,
    difficultyStats,
    lightStats,
    plantDetails
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="plant-care-report-${targetYear}.json"`);
  res.json(report);
});

app.get('/api/notifications', (req, res) => {
  const plants = readJSON('plants.json');
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  const notifications = [];
  
  plants.forEach(plant => {
    const nextCare = calculateNextCare(plant);
    const nextWatering = new Date(nextCare.nextWatering);
    const nextFertilizing = new Date(nextCare.nextFertilizing);
    
    if (nextWatering <= threeDaysLater) {
      const isOverdue = nextWatering < now;
      notifications.push({
        id: `water-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        type: 'watering',
        date: nextCare.nextWatering,
        isOverdue,
        message: `${plant.name} ${isOverdue ? '已过期' : '需要'}浇水`
      });
    }
    
    if (nextFertilizing <= threeDaysLater) {
      const isOverdue = nextFertilizing < now;
      notifications.push({
        id: `fert-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        type: 'fertilizing',
        date: nextCare.nextFertilizing,
        isOverdue,
        message: `${plant.name} ${isOverdue ? '已过期' : '需要'}施肥`
      });
    }
  });
  
  notifications.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(notifications);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌱 家庭绿植养护智能管家已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📁 数据目录: ${DATA_DIR}`);
  console.log(`🖼️  上传目录: ${path.join(__dirname, 'public', 'uploads')}\n`);
});
