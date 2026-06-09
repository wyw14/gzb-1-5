const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } = Vue;
const { ElMessage, ElMessageBox, ElNotification } = ElementPlus;

const API_BASE = '';

const api = {
  async getPlants(difficulty) {
    const url = difficulty ? `${API_BASE}/api/plants?difficulty=${difficulty}` : `${API_BASE}/api/plants`;
    const res = await fetch(url);
    return res.json();
  },
  async createPlant(data) {
    const res = await fetch(`${API_BASE}/api/plants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async updatePlant(id, data) {
    const res = await fetch(`${API_BASE}/api/plants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async deletePlant(id) {
    const res = await fetch(`${API_BASE}/api/plants/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async waterPlant(id) {
    const res = await fetch(`${API_BASE}/api/plants/${id}/water`, { method: 'POST' });
    return res.json();
  },
  async fertilizePlant(id) {
    const res = await fetch(`${API_BASE}/api/plants/${id}/fertilize`, { method: 'POST' });
    return res.json();
  },
  async getPhotos(plantId) {
    const res = await fetch(`${API_BASE}/api/plants/${plantId}/photos`);
    return res.json();
  },
  async uploadPhoto(plantId, formData) {
    const res = await fetch(`${API_BASE}/api/plants/${plantId}/photos`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  async deletePhoto(id) {
    const res = await fetch(`${API_BASE}/api/photos/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async getInspections(status, plantId) {
    let url = `${API_BASE}/api/inspections?`;
    if (status) url += `status=${status}&`;
    if (plantId) url += `plantId=${plantId}&`;
    const res = await fetch(url);
    return res.json();
  },
  async createInspection(formData) {
    const res = await fetch(`${API_BASE}/api/inspections`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  async updateInspection(id, data) {
    const res = await fetch(`${API_BASE}/api/inspections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async acceptInspection(id) {
    const res = await fetch(`${API_BASE}/api/inspections/${id}/accept`, { method: 'PUT' });
    return res.json();
  },
  async verifyInspection(id, data) {
    const res = await fetch(`${API_BASE}/api/inspections/${id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async searchPests(keyword) {
    const url = keyword ? `${API_BASE}/api/pests?keyword=${encodeURIComponent(keyword)}` : `${API_BASE}/api/pests`;
    const res = await fetch(url);
    return res.json();
  },
  async getStatistics() {
    const res = await fetch(`${API_BASE}/api/statistics`);
    return res.json();
  },
  async getNotifications() {
    const res = await fetch(`${API_BASE}/api/notifications`);
    return res.json();
  },
  async getYearlyReport(year) {
    const url = `${API_BASE}/api/report/yearly?year=${year}`;
    const res = await fetch(url);
    const blob = await res.blob();
    const url2 = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url2;
    a.download = `plant-care-report-${year}.json`;
    a.click();
    window.URL.revokeObjectURL(url2);
    return { success: true };
  },
  async getYearlyReportData(year) {
    const res = await fetch(`${API_BASE}/api/report/yearly?year=${year}`);
    return res.json();
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  const formatStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  if (days === 0) return `${formatStr} (今天)`;
  if (days === 1) return `${formatStr} (明天)`;
  if (days === -1) return `${formatStr} (昨天)`;
  if (days > 1 && days <= 7) return `${formatStr} (${days}天后)`;
  if (days < -1 && days >= -7) return `${formatStr} (${Math.abs(days)}天前)`;
  return formatStr;
};

const getDaysDiff = (dateStr) => {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const difficultyOptions = [
  { value: 'easy', label: '简单', color: '#4caf50' },
  { value: 'medium', label: '中等', color: '#ff9800' },
  { value: 'hard', label: '困难', color: '#f44336' }
];

const lightOptions = [
  { value: 'full', label: '全日照', icon: '☀️' },
  { value: 'bright', label: '明亮散射光', icon: '🌤️' },
  { value: 'medium', label: '半阴', icon: '⛅' },
  { value: 'low', label: '耐阴', icon: '🌙' }
];

const humidityOptions = [
  { value: 'high', label: '高湿度 (60-80%)', icon: '💧' },
  { value: 'medium', label: '中等湿度 (40-60%)', icon: '💦' },
  { value: 'low', label: '低湿度 (<40%)', icon: '🏜️' }
];

const commonPlants = [
  { name: '绿萝', species: 'Epipremnum aureum', difficulty: 'easy', light: 'medium', humidity: 'medium', wateringCycle: 7, fertilizingCycle: 30 },
  { name: '多肉', species: 'Succulent', difficulty: 'easy', light: 'full', humidity: 'low', wateringCycle: 14, fertilizingCycle: 60 },
  { name: '吊兰', species: 'Chlorophytum comosum', difficulty: 'easy', light: 'bright', humidity: 'medium', wateringCycle: 5, fertilizingCycle: 30 },
  { name: '发财树', species: 'Pachira aquatica', difficulty: 'medium', light: 'bright', humidity: 'low', wateringCycle: 10, fertilizingCycle: 45 },
  { name: '龟背竹', species: 'Monstera deliciosa', difficulty: 'medium', light: 'bright', humidity: 'high', wateringCycle: 7, fertilizingCycle: 30 },
  { name: '琴叶榕', species: 'Ficus lyrata', difficulty: 'hard', light: 'bright', humidity: 'medium', wateringCycle: 10, fertilizingCycle: 30 },
  { name: '蝴蝶兰', species: 'Phalaenopsis', difficulty: 'hard', light: 'bright', humidity: 'high', wateringCycle: 7, fertilizingCycle: 21 },
  { name: '君子兰', species: 'Clivia miniata', difficulty: 'medium', light: 'medium', humidity: 'medium', wateringCycle: 7, fertilizingCycle: 30 },
  { name: '仙人掌', species: 'Cactaceae', difficulty: 'easy', light: 'full', humidity: 'low', wateringCycle: 21, fertilizingCycle: 90 },
  { name: '常春藤', species: 'Hedera nepalensis', difficulty: 'easy', light: 'medium', humidity: 'high', wateringCycle: 5, fertilizingCycle: 30 },
  { name: '芦荟', species: 'Aloe vera', difficulty: 'easy', light: 'full', humidity: 'low', wateringCycle: 14, fertilizingCycle: 60 },
  { name: '文竹', species: 'Asparagus setaceus', difficulty: 'medium', light: 'medium', humidity: 'high', wateringCycle: 5, fertilizingCycle: 30 }
];

const App = {
  setup() {
    const currentRoute = ref('dashboard');
    const notifications = ref([]);
    const notificationPermission = ref('default');
    let notificationTimer = null;
    let checkTimer = null;

    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationPermission.value = permission;
        if (permission === 'granted') {
          ElMessage.success('通知权限已开启，将及时推送养护提醒');
        }
      }
    };

    const showBrowserNotification = (title, body, type = 'info') => {
      if ('Notification' in window && notificationPermission.value === 'granted') {
        const icon = type === 'warning' ? '⚠️' : type === 'error' ? '❌' : '🌱';
        new Notification(title, { body, icon: icon });
      }
    };

    const loadNotifications = async () => {
      try {
        const data = await api.getNotifications();
        notifications.value = data;
        
        const overdue = data.filter(n => n.isOverdue);
        if (overdue.length > 0) {
          overdue.forEach(n => {
            if (!localStorage.getItem(`notified_${n.id}`)) {
              showBrowserNotification(`养护提醒: ${n.plantName}`, n.message, n.isOverdue ? 'error' : 'warning');
              localStorage.setItem(`notified_${n.id}`, Date.now().toString());
            }
          });
        }
      } catch (e) {
        console.error('加载通知失败', e);
      }
    };

    const navigate = (route) => {
      currentRoute.value = route;
    };

    onMounted(() => {
      if ('Notification' in window) {
        notificationPermission.value = Notification.permission;
      }
      loadNotifications();
      notificationTimer = setInterval(loadNotifications, 60000);
      
      checkTimer = setInterval(() => {
        localStorage.clear();
      }, 24 * 60 * 60 * 1000);
    });

    onUnmounted(() => {
      if (notificationTimer) clearInterval(notificationTimer);
      if (checkTimer) clearInterval(checkTimer);
    });

    return {
      currentRoute,
      navigate,
      notifications,
      notificationPermission,
      requestNotificationPermission,
      loadNotifications
    };
  },
  template: `
    <div class="app-container">
      <aside class="sidebar">
        <div class="logo">
          <div class="logo-icon">🌱</div>
          <div class="logo-text">绿植管家</div>
        </div>
        <ul class="nav-menu">
          <li>
            <a @click="navigate('dashboard')" :class="{ active: currentRoute === 'dashboard' }">
              <el-icon><DataLine /></el-icon>
              <span>数据总览</span>
            </a>
          </li>
          <li>
            <a @click="navigate('plants')" :class="{ active: currentRoute === 'plants' }">
              <el-icon><Grid /></el-icon>
              <span>植物管理</span>
            </a>
          </li>
          <li>
            <a @click="navigate('notifications')" :class="{ active: currentRoute === 'notifications' }">
              <el-icon><Bell /></el-icon>
              <span>养护提醒</span>
              <el-badge v-if="notifications.length > 0" :value="notifications.length" class="notification-badge" style="margin-left: auto;"></el-badge>
            </a>
          </li>
          <li>
            <a @click="navigate('photos')" :class="{ active: currentRoute === 'photos' }">
              <el-icon><Picture /></el-icon>
              <span>成长记录</span>
            </a>
          </li>
          <li>
            <a @click="navigate('inspection')" :class="{ active: currentRoute === 'inspection' }">
              <el-icon><FirstAidKit /></el-icon>
              <span>巡检问诊</span>
            </a>
          </li>
          <li>
            <a @click="navigate('report')" :class="{ active: currentRoute === 'report' }">
              <el-icon><Document /></el-icon>
              <span>年度报告</span>
            </a>
          </li>
        </ul>
        <div style="position: absolute; bottom: 20px; left: 0; right: 0; padding: 0 20px;">
          <el-button v-if="notificationPermission !== 'granted'" type="success" size="small" @click="requestNotificationPermission" style="width: 100%;">
            🔔 开启通知
          </el-button>
        </div>
      </aside>
      
      <main class="main-content">
        <dashboard v-if="currentRoute === 'dashboard'" @navigate="navigate" />
        <plant-management v-else-if="currentRoute === 'plants'" @refresh-notifications="loadNotifications" />
        <notification-page v-else-if="currentRoute === 'notifications'" :notifications="notifications" @refresh="loadNotifications" />
        <photo-timeline v-else-if="currentRoute === 'photos'" />
        <inspection-diagnosis v-else-if="currentRoute === 'inspection'" />
        <yearly-report v-else-if="currentRoute === 'report'" />
      </main>
    </div>
  `
};

const Dashboard = {
  props: ['navigate'],
  emits: ['navigate'],
  setup(props, { emit }) {
    const stats = ref(null);
    const loading = ref(true);
    const plants = ref([]);
    const monthlyChart = ref(null);
    const difficultyChart = ref(null);

    const loadStats = async () => {
      try {
        loading.value = true;
        stats.value = await api.getStatistics();
        plants.value = await api.getPlants();
        nextTick(() => {
          renderCharts();
        });
      } catch (e) {
        console.error('加载统计数据失败', e);
        ElMessage.error('加载统计数据失败');
      } finally {
        loading.value = false;
      }
    };

    const renderCharts = () => {
      if (!stats.value) return;

      const monthlyCtx = document.getElementById('monthlyChart');
      if (monthlyCtx && stats.value.monthlyStats) {
        if (monthlyChart.value) monthlyChart.value.destroy();
        const labels = Object.keys(stats.value.monthlyStats);
        const wateringData = labels.map(m => stats.value.monthlyStats[m].watering);
        const fertilizingData = labels.map(m => stats.value.monthlyStats[m].fertilizing);
        
        monthlyChart.value = new Chart(monthlyCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: '浇水次数',
                data: wateringData,
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fill: true,
                tension: 0.4
              },
              {
                label: '施肥次数',
                data: fertilizingData,
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }

      const difficultyCtx = document.getElementById('difficultyChart');
      if (difficultyCtx && stats.value.difficultyStats) {
        if (difficultyChart.value) difficultyChart.value.destroy();
        const labels = Object.keys(stats.value.difficultyStats).map(k => {
          const map = { easy: '简单', medium: '中等', hard: '困难' };
          return map[k] || k;
        });
        const data = Object.values(stats.value.difficultyStats);
        const colors = ['#4caf50', '#ff9800', '#f44336'];
        
        difficultyChart.value = new Chart(difficultyCtx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors,
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    };

    const getUrgentPlants = computed(() => {
      return plants.value.filter(p => {
        const daysToWater = getDaysDiff(p.nextWatering);
        const daysToFertilize = getDaysDiff(p.nextFertilizing);
        return daysToWater <= 0 || daysToFertilize <= 0 || daysToWater <= 3 || daysToFertilize <= 3;
      }).slice(0, 5);
    });

    onMounted(() => {
      loadStats();
    });

    return {
      stats,
      loading,
      plants,
      getUrgentPlants,
      formatDate,
      getDaysDiff,
      emit
    };
  },
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">📊 数据总览</h1>
        <div class="page-header-actions">
          <el-button type="primary" @click="emit('navigate', 'plants')">
            <el-icon><Plus /></el-icon> 添加植物
          </el-button>
        </div>
      </div>

      <el-row :gutter="20" v-loading="loading">
        <el-col :xs="12" :sm="12" :md="8" :lg="6">
          <div class="stat-card">
            <div class="stat-card-icon green">🌱</div>
            <div class="stat-card-value">{{ stats?.totalPlants || 0 }}</div>
            <div class="stat-card-label">植物总数</div>
            <div class="stat-card-trend up">存活 {{ stats?.alivePlants || 0 }} 株</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="8" :lg="6">
          <div class="stat-card">
            <div class="stat-card-icon blue">💯</div>
            <div class="stat-card-value">{{ stats?.survivalRate || 0 }}%</div>
            <div class="stat-card-label">存活率</div>
            <div class="progress-bar" style="margin-top: 10px;">
              <div class="progress-bar-fill" :style="{ width: (stats?.survivalRate || 0) + '%' }"></div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="8" :lg="6">
          <div class="stat-card">
            <div class="stat-card-icon orange">✅</div>
            <div class="stat-card-value">{{ stats?.complianceRate || 0 }}%</div>
            <div class="stat-card-label">养护达标率</div>
            <div class="progress-bar" style="margin-top: 10px;">
              <div class="progress-bar-fill" :style="{ width: (stats?.complianceRate || 0) + '%' }"></div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="8" :lg="6">
          <div class="stat-card">
            <div class="stat-card-icon red">🔔</div>
            <div class="stat-card-value">{{ stats?.overdueCount || 0 }}</div>
            <div class="stat-card-label">待处理提醒</div>
            <div class="stat-card-trend down">即将到期 {{ stats?.upcomingCount || 0 }} 项</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="8" :lg="6">
          <div class="stat-card">
            <div class="stat-card-icon purple">📷</div>
            <div class="stat-card-value">{{ stats?.totalPhotos || 0 }}</div>
            <div class="stat-card-label">成长照片</div>
            <div class="stat-card-trend up">记录美好时刻</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 24px;">
        <el-col :lg="16" :md="24">
          <div class="chart-container">
            <h3 class="chart-title">📈 近12个月养护趋势</h3>
            <canvas id="monthlyChart" height="250"></canvas>
          </div>
        </el-col>
        <el-col :lg="8" :md="24">
          <div class="chart-container">
            <h3 class="chart-title">🎯 难度分布</h3>
            <canvas id="difficultyChart" height="250"></canvas>
          </div>
        </el-col>
      </el-row>

      <div class="chart-container" style="margin-top: 24px;">
        <h3 class="chart-title">⚠️ 需要关注的植物</h3>
        <div v-if="getUrgentPlants.length === 0" class="empty-state">
          <div class="empty-state-icon">🎉</div>
          <div class="empty-state-text">太棒了！所有植物都养护得很好</div>
        </div>
        <el-table v-else :data="getUrgentPlants" style="width: 100%">
          <el-table-column prop="name" label="植物名称" width="120">
            <template #default="{ row }">
              <span style="font-weight: bold;">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="species" label="品种" width="150" />
          <el-table-column label="下次浇水">
            <template #default="{ row }">
              <el-tag :type="getDaysDiff(row.nextWatering) <= 0 ? 'danger' : getDaysDiff(row.nextWatering) <= 3 ? 'warning' : 'success'">
                {{ formatDate(row.nextWatering) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="下次施肥">
            <template #default="{ row }">
              <el-tag :type="getDaysDiff(row.nextFertilizing) <= 0 ? 'danger' : getDaysDiff(row.nextFertilizing) <= 3 ? 'warning' : 'success'">
                {{ formatDate(row.nextFertilizing) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="emit('navigate', 'plants')">去处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  `
};

const PlantManagement = {
  emits: ['refresh-notifications'],
  setup(props, { emit }) {
    const plants = ref([]);
    const loading = ref(false);
    const filterDifficulty = ref('');
    const searchKeyword = ref('');
    const dialogVisible = ref(false);
    const photoDialogVisible = ref(false);
    const currentPlant = ref(null);
    const plantPhotos = ref([]);
    const isEdit = ref(false);
    const uploadFile = ref(null);
    const photoNote = ref('');
    const photoLoading = ref(false);

    const formData = reactive({
      name: '',
      species: '',
      difficulty: 'easy',
      lightPreference: 'bright',
      humidityPreference: 'medium',
      wateringCycle: 7,
      fertilizingCycle: 30,
      lastWatering: '',
      lastFertilizing: '',
      notes: ''
    });

    const rules = {
      name: [{ required: true, message: '请输入植物名称', trigger: 'blur' }],
      species: [{ required: true, message: '请输入植物品种', trigger: 'blur' }],
      wateringCycle: [{ required: true, message: '请输入浇水周期', trigger: 'blur' }],
      fertilizingCycle: [{ required: true, message: '请输入施肥周期', trigger: 'blur' }]
    };

    const filteredPlants = computed(() => {
      let result = plants.value;
      if (filterDifficulty.value) {
        result = result.filter(p => p.difficulty === filterDifficulty.value);
      }
      if (searchKeyword.value) {
        const kw = searchKeyword.value.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(kw) || 
          p.species.toLowerCase().includes(kw)
        );
      }
      return result;
    });

    const loadPlants = async () => {
      try {
        loading.value = true;
        plants.value = await api.getPlants();
        emit('refresh-notifications');
      } catch (e) {
        ElMessage.error('加载植物列表失败');
      } finally {
        loading.value = false;
      }
    };

    const openAddDialog = () => {
      isEdit.value = false;
      currentPlant.value = null;
      Object.assign(formData, {
        name: '',
        species: '',
        difficulty: 'easy',
        lightPreference: 'bright',
        humidityPreference: 'medium',
        wateringCycle: 7,
        fertilizingCycle: 30,
        lastWatering: new Date().toISOString().split('T')[0],
        lastFertilizing: new Date().toISOString().split('T')[0],
        notes: ''
      });
      dialogVisible.value = true;
    };

    const openEditDialog = (plant) => {
      isEdit.value = true;
      currentPlant.value = plant;
      Object.assign(formData, {
        name: plant.name,
        species: plant.species,
        difficulty: plant.difficulty,
        lightPreference: plant.lightPreference,
        humidityPreference: plant.humidityPreference,
        wateringCycle: plant.wateringCycle,
        fertilizingCycle: plant.fertilizingCycle,
        lastWatering: plant.lastWatering ? plant.lastWatering.split('T')[0] : '',
        lastFertilizing: plant.lastFertilizing ? plant.lastFertilizing.split('T')[0] : '',
        notes: plant.notes || ''
      });
      dialogVisible.value = true;
    };

    const selectCommonPlant = (plant) => {
      Object.assign(formData, {
        species: plant.species,
        difficulty: plant.difficulty,
        lightPreference: plant.light,
        humidityPreference: plant.humidity,
        wateringCycle: plant.wateringCycle,
        fertilizingCycle: plant.fertilizingCycle
      });
    };

    const handleSubmit = async (formRef) => {
      if (!formRef) return;
      await formRef.validate(async (valid) => {
        if (valid) {
          try {
            const submitData = { ...formData };
            if (submitData.lastWatering) {
              submitData.lastWatering = new Date(submitData.lastWatering).toISOString();
            }
            if (submitData.lastFertilizing) {
              submitData.lastFertilizing = new Date(submitData.lastFertilizing).toISOString();
            }
            
            if (isEdit.value) {
              await api.updatePlant(currentPlant.value.id, submitData);
              ElMessage.success('植物信息更新成功');
            } else {
              await api.createPlant(submitData);
              ElMessage.success('植物添加成功');
            }
            dialogVisible.value = false;
            loadPlants();
          } catch (e) {
            ElMessage.error('保存失败');
          }
        }
      });
    };

    const handleDelete = async (plant) => {
      try {
        await ElMessageBox.confirm(`确定要删除 "${plant.name}" 吗？`, '确认删除', {
          type: 'warning'
        });
        await api.deletePlant(plant.id);
        ElMessage.success('删除成功');
        loadPlants();
      } catch (e) {
        if (e !== 'cancel') {
          ElMessage.error('删除失败');
        }
      }
    };

    const handleWater = async (plant) => {
      try {
        await api.waterPlant(plant.id);
        ElMessage.success(`已记录 ${plant.name} 的浇水`);
        loadPlants();
      } catch (e) {
        ElMessage.error('操作失败');
      }
    };

    const handleFertilize = async (plant) => {
      try {
        await api.fertilizePlant(plant.id);
        ElMessage.success(`已记录 ${plant.name} 的施肥`);
        loadPlants();
      } catch (e) {
        ElMessage.error('操作失败');
      }
    };

    const getPlantStatus = (plant) => {
      const daysToWater = getDaysDiff(plant.nextWatering);
      const daysToFertilize = getDaysDiff(plant.nextFertilizing);
      if (daysToWater < 0 || daysToFertilize < 0) return 'overdue';
      if (daysToWater <= 3 || daysToFertilize <= 3) return 'warning';
      return 'healthy';
    };

    const getStatusText = (status) => {
      const map = { healthy: '状态良好', warning: '即将到期', overdue: '已过期' };
      return map[status] || status;
    };

    const getDifficultyLabel = (difficulty) => {
      const opt = difficultyOptions.find(o => o.value === difficulty);
      return opt ? opt.label : difficulty;
    };

    const getLightLabel = (light) => {
      const opt = lightOptions.find(o => o.value === light);
      return opt ? `${opt.icon} ${opt.label}` : light;
    };

    const openPhotoDialog = async (plant) => {
      currentPlant.value = plant;
      photoDialogVisible.value = true;
      loadPhotos(plant.id);
    };

    const loadPhotos = async (plantId) => {
      try {
        photoLoading.value = true;
        plantPhotos.value = await api.getPhotos(plantId);
      } catch (e) {
        ElMessage.error('加载照片失败');
      } finally {
        photoLoading.value = false;
      }
    };

    const handlePhotoUpload = async () => {
      if (!uploadFile.value) {
        ElMessage.warning('请选择照片');
        return;
      }
      try {
        const formData = new FormData();
        formData.append('photo', uploadFile.value);
        formData.append('note', photoNote.value);
        photoLoading.value = true;
        await api.uploadPhoto(currentPlant.value.id, formData);
        ElMessage.success('照片上传成功');
        uploadFile.value = null;
        photoNote.value = '';
        loadPhotos(currentPlant.value.id);
      } catch (e) {
        ElMessage.error('上传失败');
      } finally {
        photoLoading.value = false;
      }
    };

    const handlePhotoDelete = async (photo) => {
      try {
        await ElMessageBox.confirm('确定要删除这张照片吗？', '确认删除', { type: 'warning' });
        await api.deletePhoto(photo.id);
        ElMessage.success('删除成功');
        loadPhotos(currentPlant.value.id);
      } catch (e) {
        if (e !== 'cancel') ElMessage.error('删除失败');
      }
    };

    const handleFileChange = (uploadFileObj) => {
      uploadFile.value = uploadFileObj.raw;
    };

    onMounted(() => {
      loadPlants();
    });

    return {
      plants,
      loading,
      filterDifficulty,
      searchKeyword,
      dialogVisible,
      photoDialogVisible,
      currentPlant,
      formData,
      rules,
      isEdit,
      filteredPlants,
      plantPhotos,
      uploadFile,
      photoNote,
      photoLoading,
      difficultyOptions,
      lightOptions,
      humidityOptions,
      commonPlants,
      openAddDialog,
      openEditDialog,
      selectCommonPlant,
      handleSubmit,
      handleDelete,
      handleWater,
      handleFertilize,
      getPlantStatus,
      getStatusText,
      getDifficultyLabel,
      getLightLabel,
      formatDate,
      getDaysDiff,
      openPhotoDialog,
      handlePhotoUpload,
      handlePhotoDelete,
      handleFileChange
    };
  },
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">🌿 植物管理</h1>
        <div class="page-header-actions">
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon> 添加植物
          </el-button>
        </div>
      </div>

      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索植物名称或品种"
          clearable
          style="width: 250px;"
          :prefix-icon="Search"
        />
        <el-select v-model="filterDifficulty" placeholder="按难度筛选" clearable style="width: 150px;">
          <el-option v-for="opt in difficultyOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <span style="color: #666; margin-left: auto;">共 {{ filteredPlants.length }} 株植物</span>
      </div>

      <div v-loading="loading">
        <div v-if="filteredPlants.length === 0" class="empty-state">
          <div class="empty-state-icon">🌱</div>
          <div class="empty-state-text">暂无植物，点击上方按钮添加第一株植物吧</div>
          <el-button type="primary" @click="openAddDialog">立即添加</el-button>
        </div>
        <el-row v-else :gutter="20">
          <el-col v-for="plant in filteredPlants" :key="plant.id" :xs="24" :sm="12" :md="8" :lg="6" style="margin-bottom: 20px;">
            <div class="plant-card">
              <div class="plant-card-image">
                <img v-if="plantPhotos.find(p => p.plantId === plant.id)" :src="plantPhotos.find(p => p.plantId === plant.id)?.url" alt="" />
                <span v-else>🪴</span>
                <span class="plant-card-status" :class="getPlantStatus(plant)">
                  {{ getStatusText(getPlantStatus(plant)) }}
                </span>
              </div>
              <div class="plant-card-body">
                <div class="plant-card-name">{{ plant.name }}</div>
                <div class="plant-card-species">{{ plant.species }}</div>
                <div class="plant-card-info">
                  <span class="difficulty-badge" :class="'difficulty-' + plant.difficulty">
                    {{ getDifficultyLabel(plant.difficulty) }}
                  </span>
                  <span class="plant-card-tag">{{ getLightLabel(plant.lightPreference) }}</span>
                </div>
                <div class="plant-card-care">
                  <div class="plant-card-care-item">
                    <span>💧 下次浇水</span>
                    <el-tag size="small" :type="getDaysDiff(plant.nextWatering) <= 0 ? 'danger' : getDaysDiff(plant.nextWatering) <= 3 ? 'warning' : 'success'">
                      {{ formatDate(plant.nextWatering) }}
                    </el-tag>
                  </div>
                  <div class="plant-card-care-item">
                    <span>🌾 下次施肥</span>
                    <el-tag size="small" :type="getDaysDiff(plant.nextFertilizing) <= 0 ? 'danger' : getDaysDiff(plant.nextFertilizing) <= 3 ? 'warning' : 'success'">
                      {{ formatDate(plant.nextFertilizing) }}
                    </el-tag>
                  </div>
                </div>
                <div class="plant-card-actions">
                  <el-button size="small" type="primary" @click="handleWater(plant)">浇水</el-button>
                  <el-button size="small" type="warning" @click="handleFertilize(plant)">施肥</el-button>
                  <el-dropdown>
                    <el-button size="small" :icon="MoreFilled">更多</el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="openEditDialog(plant)">✏️ 编辑</el-dropdown-item>
                        <el-dropdown-item @click="openPhotoDialog(plant)">📷 照片</el-dropdown-item>
                        <el-dropdown-item divided @click="handleDelete(plant)" style="color: #f44336;">🗑️ 删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑植物' : '添加植物'" width="700px">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
          <el-alert title="快捷选择" type="success" :closable="false" style="margin-bottom: 20px;">
            <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px;">
              <el-tag
                v-for="plant in commonPlants"
                :key="plant.name"
                size="large"
                style="cursor: pointer; padding: 8px 16px;"
                @click="selectCommonPlant(plant)"
              >
                {{ plant.name }}
              </el-tag>
            </div>
          </el-alert>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="植物名称" prop="name">
                <el-input v-model="formData.name" placeholder="给它起个名字" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="植物品种" prop="species">
                <el-input v-model="formData.species" placeholder="如：绿萝、多肉等" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="养护难度">
                <el-radio-group v-model="formData.difficulty">
                  <el-radio-button v-for="opt in difficultyOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="光照偏好">
                <el-select v-model="formData.lightPreference" style="width: 100%;">
                  <el-option v-for="opt in lightOptions" :key="opt.value" :label="opt.icon + ' ' + opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="湿度偏好">
                <el-select v-model="formData.humidityPreference" style="width: 100%;">
                  <el-option v-for="opt in humidityOptions" :key="opt.value" :label="opt.icon + ' ' + opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="浇水周期(天)" prop="wateringCycle">
                <el-input-number v-model="formData.wateringCycle" :min="1" :max="90" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="施肥周期(天)" prop="fertilizingCycle">
                <el-input-number v-model="formData.fertilizingCycle" :min="1" :max="180" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="上次浇水">
                <el-date-picker v-model="formData.lastWatering" type="date" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="上次施肥">
            <el-date-picker v-model="formData.lastFertilizing" type="date" style="width: 48%;" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="formData.notes" type="textarea" :rows="3" placeholder="记录一些养护心得..." />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit($refs.formRef)">保存</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="photoDialogVisible" :title="currentPlant?.name + ' - 成长照片'" width="900px">
        <div class="filter-bar">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleFileChange"
          >
            <el-button type="primary" :icon="Upload">选择照片</el-button>
          </el-upload>
          <el-input v-model="photoNote" placeholder="记录一下此刻的状态..." style="flex: 1; max-width: 400px;" />
          <el-button type="success" @click="handlePhotoUpload" :loading="photoLoading">
            <el-icon><Upload /></el-icon> 上传
          </el-button>
        </div>
        
        <div v-loading="photoLoading">
          <div v-if="plantPhotos.length === 0" class="empty-state">
            <div class="empty-state-icon">📷</div>
            <div class="empty-state-text">还没有照片，上传第一张记录成长吧</div>
          </div>
          <div v-else class="photo-timeline">
            <div v-for="(photo, index) in plantPhotos" :key="photo.id" class="photo-timeline-item">
              <div class="timeline-date">
                <div class="timeline-date-day">{{ new Date(photo.date).getDate() }}</div>
                <div class="timeline-date-month">{{ new Date(photo.date).getFullYear() }}-{{ String(new Date(photo.date).getMonth() + 1).padStart(2, '0') }}</div>
              </div>
              <div class="timeline-content">
                <div class="timeline-photo">
                  <img :src="photo.url" alt="" />
                </div>
                <div v-if="photo.note" class="timeline-note">{{ photo.note }}</div>
                <el-button size="small" type="danger" text @click="handlePhotoDelete(photo)" style="margin-top: 8px;">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
                <div v-if="index > 0" class="photo-compare">
                  <div class="photo-compare-item">
                    <img :src="plantPhotos[index - 1].url" alt="之前" />
                    <div style="margin-top: 8px; color: #666; font-size: 12px;">{{ formatDate(plantPhotos[index - 1].date) }}</div>
                  </div>
                  <div class="photo-compare-arrow">→</div>
                  <div class="photo-compare-item">
                    <img :src="photo.url" alt="现在" />
                    <div style="margin-top: 8px; color: #666; font-size: 12px;">{{ formatDate(photo.date) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  `
};

const NotificationPage = {
  props: ['notifications'],
  emits: ['refresh'],
  setup(props, { emit }) {
    const loading = ref(false);

    const handleWater = async (notification) => {
      try {
        loading.value = true;
        await api.waterPlant(notification.plantId);
        ElMessage.success('浇水完成');
        emit('refresh');
      } catch (e) {
        ElMessage.error('操作失败');
      } finally {
        loading.value = false;
      }
    };

    const handleFertilize = async (notification) => {
      try {
        loading.value = true;
        await api.fertilizePlant(notification.plantId);
        ElMessage.success('施肥完成');
        emit('refresh');
      } catch (e) {
        ElMessage.error('操作失败');
      } finally {
        loading.value = false;
      }
    };

    const getNotificationClass = (n) => {
      if (n.isOverdue) return 'overdue';
      const days = getDaysDiff(n.date);
      if (days <= 1) return 'warning';
      return 'upcoming';
    };

    const getNotificationIcon = (n) => {
      if (n.type === 'watering') return '💧';
      return '🌾';
    };

    const groupedNotifications = computed(() => {
      const overdue = props.notifications.filter(n => n.isOverdue);
      const today = props.notifications.filter(n => !n.isOverdue && getDaysDiff(n.date) <= 1);
      const upcoming = props.notifications.filter(n => !n.isOverdue && getDaysDiff(n.date) > 1);
      return [
        { title: '已过期', items: overdue, type: 'overdue' },
        { title: '今天', items: today, type: 'today' },
        { title: '即将到来', items: upcoming, type: 'upcoming' }
      ].filter(g => g.items.length > 0);
    });

    return {
      loading,
      groupedNotifications,
      handleWater,
      handleFertilize,
      getNotificationClass,
      getNotificationIcon,
      formatDate
    };
  },
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">🔔 养护提醒</h1>
      </div>

      <div v-if="notifications.length === 0" class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <div class="empty-state-text">太棒了！目前没有需要处理的养护任务</div>
      </div>

      <div v-else>
        <div v-for="group in groupedNotifications" :key="group.title">
          <h3 style="margin: 20px 0 12px; color: #333; font-size: 16px;">
            {{ group.title }} ({{ group.items.length }})
          </h3>
          <div v-for="notification in group.items" :key="notification.id" 
               class="notification-item" 
               :class="getNotificationClass(notification)"
               v-loading="loading">
            <div class="notification-icon">{{ getNotificationIcon(notification) }}</div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.message }}</div>
              <div class="notification-desc">{{ notification.plantName }} - {{ notification.type === 'watering' ? '浇水' : '施肥' }}</div>
              <div class="notification-time">{{ formatDate(notification.date) }}</div>
            </div>
            <div>
              <el-button v-if="notification.type === 'watering'" type="primary" @click="handleWater(notification)">
                立即浇水
              </el-button>
              <el-button v-else type="warning" @click="handleFertilize(notification)">
                立即施肥
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

const PhotoTimeline = {
  setup() {
    const plants = ref([]);
    const selectedPlantId = ref('');
    const photos = ref([]);
    const loading = ref(false);
    const compareMode = ref(false);
    const comparePhoto1 = ref(null);
    const comparePhoto2 = ref(null);

    const loadPlants = async () => {
      try {
        plants.value = await api.getPlants();
        if (plants.value.length > 0 && !selectedPlantId.value) {
          selectedPlantId.value = plants.value[0].id;
        }
      } catch (e) {
        ElMessage.error('加载植物列表失败');
      }
    };

    const loadPhotos = async () => {
      if (!selectedPlantId.value) return;
      try {
        loading.value = true;
        photos.value = await api.getPhotos(selectedPlantId.value);
      } catch (e) {
        ElMessage.error('加载照片失败');
      } finally {
        loading.value = false;
      }
    };

    const selectedPlant = computed(() => {
      return plants.value.find(p => p.id === selectedPlantId.value);
    });

    const selectForCompare = (photo) => {
      if (!compareMode.value) return;
      if (!comparePhoto1.value) {
        comparePhoto1.value = photo;
      } else if (!comparePhoto2.value && comparePhoto1.value.id !== photo.id) {
        comparePhoto2.value = photo;
      } else {
        comparePhoto1.value = photo;
        comparePhoto2.value = null;
      }
    };

    const toggleCompareMode = () => {
      compareMode.value = !compareMode.value;
      comparePhoto1.value = null;
      comparePhoto2.value = null;
    };

    watch(selectedPlantId, () => {
      loadPhotos();
      compareMode.value = false;
      comparePhoto1.value = null;
      comparePhoto2.value = null;
    });

    onMounted(() => {
      loadPlants();
    });

    return {
      plants,
      selectedPlantId,
      photos,
      loading,
      selectedPlant,
      compareMode,
      comparePhoto1,
      comparePhoto2,
      toggleCompareMode,
      selectForCompare,
      formatDate
    };
  },
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">📷 成长记录</h1>
        <div class="page-header-actions">
          <el-button :type="compareMode ? 'warning' : 'default'" @click="toggleCompareMode">
            <el-icon><Switch /></el-icon> {{ compareMode ? '退出对比' : '对比模式' }}
          </el-button>
        </div>
      </div>

      <div class="filter-bar">
        <el-select v-model="selectedPlantId" placeholder="选择植物" style="width: 250px;">
          <el-option v-for="plant in plants" :key="plant.id" :label="plant.name + ' - ' + plant.species" :value="plant.id" />
        </el-select>
        <span style="color: #666;">共 {{ photos.length }} 张照片</span>
      </div>

      <div v-if="compareMode && comparePhoto1 && comparePhoto2" class="chart-container" style="margin-bottom: 24px;">
        <h3 class="chart-title">📊 成长对比</h3>
        <div class="photo-compare">
          <div class="photo-compare-item">
            <img :src="comparePhoto1.url" alt="对比1" />
            <div style="margin-top: 12px;">
              <div style="font-weight: bold; color: #333;">{{ formatDate(comparePhoto1.date) }}</div>
              <div v-if="comparePhoto1.note" style="color: #666; font-size: 13px; margin-top: 4px;">{{ comparePhoto1.note }}</div>
            </div>
          </div>
          <div class="photo-compare-arrow">→</div>
          <div class="photo-compare-item">
            <img :src="comparePhoto2.url" alt="对比2" />
            <div style="margin-top: 12px;">
              <div style="font-weight: bold; color: #333;">{{ formatDate(comparePhoto2.date) }}</div>
              <div v-if="comparePhoto2.note" style="color: #666; font-size: 13px; margin-top: 4px;">{{ comparePhoto2.note }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="compareMode && !comparePhoto2" style="margin-bottom: 20px;">
        <el-alert :title="comparePhoto1 ? '请选择第二张照片进行对比' : '请选择第一张照片'" type="info" :closable="false" />
      </div>

      <div v-loading="loading">
        <div v-if="photos.length === 0" class="empty-state">
          <div class="empty-state-icon">📷</div>
          <div class="empty-state-text">
            {{ selectedPlant ? selectedPlant.name + ' 还没有照片记录' : '请先添加植物' }}
          </div>
        </div>
        <div v-else class="photo-timeline">
          <div v-for="photo in photos" :key="photo.id" class="photo-timeline-item"
               :style="{ cursor: compareMode ? 'pointer' : 'default' }"
               @click="selectForCompare(photo)">
            <div class="timeline-date">
              <div class="timeline-date-day">{{ new Date(photo.date).getDate() }}</div>
              <div class="timeline-date-month">{{ new Date(photo.date).getFullYear() }}-{{ String(new Date(photo.date).getMonth() + 1).padStart(2, '0') }}</div>
            </div>
            <div class="timeline-content" 
                 :style="{ border: (comparePhoto1?.id === photo.id || comparePhoto2?.id === photo.id) ? '3px solid #4caf50' : 'none', borderRadius: '12px', padding: (comparePhoto1?.id === photo.id || comparePhoto2?.id === photo.id) ? '8px' : '0' }">
              <div class="timeline-photo">
                <img :src="photo.url" alt="" />
              </div>
              <div v-if="photo.note" class="timeline-note">{{ photo.note }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

const InspectionDiagnosis = {
  setup() {
    const orders = ref([]);
    const plants = ref([]);
    const loading = ref(false);
    const createVisible = ref(false);
    const detailVisible = ref(false);
    const trackVisible = ref(false);
    const currentOrder = ref(null);
    const filterStatus = ref('');
    const symptomInput = ref('');
    const matchedPests = ref([]);
    const pestsLoading = ref(false);

    const formData = reactive({
      symptoms: '',
      plantId: '',
      handler: '',
      photo: null
    });

    const rules = {
      symptoms: [{ required: true, message: '请输入症状描述', trigger: 'blur' }],
      plantId: [{ required: true, message: '请选择植物', trigger: 'change' }],
      handler: [{ required: true, message: '请输入处理人', trigger: 'blur' }]
    };

    const severityMap = {
      critical: { label: '紧急', color: '#f44336', bg: '#ffebee' },
      major: { label: '严重', color: '#ff9800', bg: '#fff3e0' },
      minor: { label: '一般', color: '#2196f3', bg: '#e3f2fd' },
      low: { label: '轻微', color: '#4caf50', bg: '#e8f5e9' }
    };

    const statusMap = {
      pending: { label: '待处理', color: '#ff9800', bg: '#fff3e0' },
      accepted: { label: '处理中', color: '#2196f3', bg: '#e3f2fd' },
      verified: { label: '已验收', color: '#4caf50', bg: '#e8f5e9' },
      rejected: { label: '验收不通过', color: '#f44336', bg: '#ffebee' }
    };

    const loadOrders = async () => {
      try {
        loading.value = true;
        orders.value = await api.getInspections(filterStatus.value);
      } catch (e) {
        ElMessage.error('加载工单列表失败');
      } finally {
        loading.value = false;
      }
    };

    const loadPlants = async () => {
      try {
        plants.value = await api.getPlants();
      } catch (e) {
        ElMessage.error('加载植物列表失败');
      }
    };

    const searchPestsBySymptom = async () => {
      if (!formData.symptoms || formData.symptoms.trim().length < 2) {
        matchedPests.value = [];
        return;
      }
      try {
        pestsLoading.value = true;
        const firstKw = formData.symptoms.split(/[，,、\s]+/)[0];
        matchedPests.value = await api.searchPests(firstKw);
      } catch (e) {
        matchedPests.value = [];
      } finally {
        pestsLoading.value = false;
      }
    };

    const previewRisk = computed(() => {
      if (!formData.symptoms) return { score: 0, severity: 'low', matched: [] };
      const kw = formData.symptoms;
      const riskMap = [
        { keywords: ['枯萎', '死亡', '倒伏', '发臭', '烂根', '根腐'], score: 30 },
        { keywords: ['腐烂', '软腐', '黑根', '萎蔫'], score: 25 },
        { keywords: ['蚜虫', '红蜘蛛', '介壳虫', '蓟马', '线虫'], score: 20 },
        { keywords: ['黑斑', '褐斑', '白粉', '灰霉', '炭疽', '叶斑'], score: 20 },
        { keywords: ['黄叶', '卷曲', '掉叶', '畸形'], score: 15 },
        { keywords: ['白斑', '蛛网', '蜜露', '蜡质', '银灰色'], score: 15 },
        { keywords: ['失绿', '小黑点', '粉状'], score: 10 }
      ];
      let total = 0;
      const matched = [];
      riskMap.forEach(group => {
        group.keywords.forEach(k => {
          if (kw.includes(k)) {
            total += group.score;
            matched.push(k);
          }
        });
      });
      const score = Math.min(total, 100);
      let severity = 'low';
      if (score >= 70) severity = 'critical';
      else if (score >= 40) severity = 'major';
      else if (score >= 15) severity = 'minor';
      return { score, severity, matched };
    });

    const handleSubmit = async (formRef) => {
      if (!formRef) return;
      await formRef.validate(async (valid) => {
        if (valid) {
          try {
            const fd = new FormData();
            fd.append('symptoms', formData.symptoms);
            fd.append('plantId', formData.plantId);
            fd.append('handler', formData.handler);
            if (formData.photo) fd.append('photo', formData.photo);
            const result = await api.createInspection(fd);
            ElMessage.success(`工单创建成功！风险分: ${result.riskScore}`);
            createVisible.value = false;
            resetForm();
            loadOrders();
          } catch (e) {
            ElMessage.error('创建工单失败');
          }
        }
      });
    };

    const resetForm = () => {
      formData.symptoms = '';
      formData.plantId = '';
      formData.handler = '';
      formData.photo = null;
      matchedPests.value = [];
    };

    const openCreateDialog = () => {
      resetForm();
      createVisible.value = true;
    };

    const openDetail = (order) => {
      currentOrder.value = order;
      detailVisible.value = true;
    };

    const openTrack = (order) => {
      currentOrder.value = order;
      trackVisible.value = true;
    };

    const handleAccept = async (order) => {
      try {
        await api.acceptInspection(order.id);
        ElMessage.success('已接单处理');
        loadOrders();
      } catch (e) {
        ElMessage.error('操作失败');
      }
    };

    const handleVerify = async (order, result) => {
      try {
        await api.verifyInspection(order.id, { result, note: '' });
        ElMessage.success(result === 'pass' ? '验收通过' : '验收不通过，工单已退回');
        detailVisible.value = false;
        loadOrders();
      } catch (e) {
        ElMessage.error('操作失败');
      }
    };

    const handleFileChange = (uploadFileObj) => {
      formData.photo = uploadFileObj.raw;
    };

    const getRiskColor = (score) => {
      if (score >= 70) return '#f44336';
      if (score >= 40) return '#ff9800';
      if (score >= 15) return '#2196f3';
      return '#4caf50';
    };

    const quickFillSymptom = (symptom) => {
      if (formData.symptoms) {
        formData.symptoms += '、' + symptom;
      } else {
        formData.symptoms = symptom;
      }
    };

    const commonSymptoms = ['黄叶', '黑斑', '白斑', '卷曲', '腐烂', '蚜虫', '蛛网', '白粉', '根腐', '掉叶', '枯萎', '萎蔫', '介壳虫', '灰霉', '炭疽'];

    watch(filterStatus, () => loadOrders());
    watch(() => formData.symptoms, () => searchPestsBySymptom());

    onMounted(() => {
      loadOrders();
      loadPlants();
    });

    return {
      orders, plants, loading, createVisible, detailVisible, trackVisible,
      currentOrder, filterStatus, formData, rules, matchedPests, pestsLoading,
      previewRisk, commonSymptoms, severityMap, statusMap,
      openCreateDialog, openDetail, openTrack,
      handleSubmit, handleAccept, handleVerify, handleFileChange,
      quickFillSymptom, getRiskColor, formatDate, loadOrders
    };
  },
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">🔍 巡检问诊</h1>
        <div class="page-header-actions">
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon> 新建巡检工单
          </el-button>
        </div>
      </div>

      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="按状态筛选" clearable style="width: 160px;">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="accepted" />
          <el-option label="已验收" value="verified" />
          <el-option label="验收不通过" value="rejected" />
        </el-select>
        <span style="color: #666; margin-left: auto;">共 {{ orders.length }} 条工单</span>
      </div>

      <div v-loading="loading">
        <div v-if="orders.length === 0" class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">暂无巡检工单，点击上方按钮新建</div>
          <el-button type="primary" @click="openCreateDialog">新建工单</el-button>
        </div>
        <el-table v-else :data="orders" style="width: 100%" border stripe>
          <el-table-column prop="id" label="工单号" width="130" show-overflow-tooltip />
          <el-table-column prop="plantName" label="植物号" width="100" />
          <el-table-column prop="symptoms" label="症状" min-width="180" show-overflow-tooltip />
          <el-table-column label="风险分" width="100" align="center">
            <template #default="{ row }">
              <span class="risk-score" :style="{ color: getRiskColor(row.riskScore), fontWeight: 'bold', fontSize: '16px' }">
                {{ row.riskScore }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="严重度" width="90" align="center">
            <template #default="{ row }">
              <el-tag :color="severityMap[row.severity]?.bg" :style="{ color: severityMap[row.severity]?.color, border: 'none' }" size="small">
                {{ severityMap[row.severity]?.label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="handler" label="处理人" width="100" />
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :color="statusMap[row.status]?.bg" :style="{ color: statusMap[row.status]?.color, border: 'none' }" size="small">
                {{ statusMap[row.status]?.label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="110">
            <template #default="{ row }">
              {{ new Date(row.createdAt).toLocaleDateString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" text @click="openDetail(row)">详情</el-button>
              <el-button v-if="row.status === 'pending'" size="small" type="warning" text @click="handleAccept(row)">接单</el-button>
              <el-button size="small" type="info" text @click="openTrack(row)">追踪</el-button>
              <el-button v-if="row.status === 'accepted'" size="small" type="success" text @click="handleVerify(row, 'pass')">验收</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="createVisible" title="新建巡检工单" width="750px" :close-on-click-modal="false">
        <el-form ref="createFormRef" :model="formData" :rules="rules" label-width="90px">
          <el-form-item label="植物号" prop="plantId">
            <el-select v-model="formData.plantId" placeholder="选择植物" style="width: 100%;" filterable>
              <el-option v-for="plant in plants" :key="plant.id" :label="plant.name + ' (' + plant.species + ')'" :value="plant.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="症状" prop="symptoms">
            <el-input v-model="formData.symptoms" type="textarea" :rows="3" placeholder="描述观察到的症状，如：叶片黄化、黑斑、卷曲等" />
          </el-form-item>
          <div style="margin-bottom: 18px; padding: 0 0 0 90px;">
            <span style="color: #666; font-size: 13px; margin-right: 8px;">快捷填入：</span>
            <el-tag
              v-for="s in commonSymptoms"
              :key="s"
              size="small"
              style="cursor: pointer; margin: 2px;"
              @click="quickFillSymptom(s)"
            >{{ s }}</el-tag>
          </div>
          <el-form-item label="照片">
            <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" @change="handleFileChange">
              <el-button type="default">选择照片</el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="处理人" prop="handler">
            <el-input v-model="formData.handler" placeholder="指定处理人" />
          </el-form-item>

          <div v-if="previewRisk.score > 0" class="risk-preview">
            <div class="risk-preview-header">⚡ 实时风险评估</div>
            <div class="risk-preview-body">
              <div class="risk-preview-score" :style="{ color: getRiskColor(previewRisk.score) }">
                {{ previewRisk.score }} 分
              </div>
              <div class="risk-preview-severity">
                <el-tag :color="severityMap[previewRisk.severity]?.bg" :style="{ color: severityMap[previewRisk.severity]?.color, border: 'none' }">
                  {{ severityMap[previewRisk.severity]?.label }}
                </el-tag>
              </div>
              <div v-if="previewRisk.matched.length" class="risk-preview-matched">
                <span style="color: #666; font-size: 13px;">命中的关键词：</span>
                <el-tag v-for="kw in previewRisk.matched" :key="kw" size="small" type="warning" style="margin: 2px;">{{ kw }}</el-tag>
              </div>
            </div>
          </div>

          <div v-if="matchedPests.length > 0" style="margin-top: 16px;">
            <el-alert title="参考：可能的病虫害" type="warning" :closable="false" style="margin-bottom: 12px;" />
            <el-collapse>
              <el-collapse-item v-for="pest in matchedPests.slice(0, 5)" :key="pest.id" :title="pest.name">
                <div style="font-size: 14px; color: #666; line-height: 1.8;">
                  <p><strong>症状：</strong>{{ pest.symptoms }}</p>
                  <p><strong>治疗：</strong>{{ pest.treatment }}</p>
                  <p><strong>预防：</strong>{{ pest.prevention }}</p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-form>
        <template #footer>
          <el-button @click="createVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit($refs.createFormRef)">保存工单</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="detailVisible" :title="'工单详情 - ' + (currentOrder?.id || '')" width="650px">
        <div v-if="currentOrder">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="植物号">{{ currentOrder.plantName }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{ currentOrder.handler || '-' }}</el-descriptions-item>
            <el-descriptions-item label="严重度">
              <el-tag :color="severityMap[currentOrder.severity]?.bg" :style="{ color: severityMap[currentOrder.severity]?.color, border: 'none' }">
                {{ severityMap[currentOrder.severity]?.label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="风险分">
              <span :style="{ color: getRiskColor(currentOrder.riskScore), fontWeight: 'bold' }">{{ currentOrder.riskScore }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :color="statusMap[currentOrder.status]?.bg" :style="{ color: statusMap[currentOrder.status]?.color, border: 'none' }">
                {{ statusMap[currentOrder.status]?.label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ new Date(currentOrder.createdAt).toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="症状" :span="2">{{ currentOrder.symptoms }}</el-descriptions-item>
            <el-descriptions-item v-if="currentOrder.matchedKeywords?.length" label="命中关键词" :span="2">
              <el-tag v-for="kw in currentOrder.matchedKeywords" :key="kw" size="small" type="warning" style="margin: 2px;">{{ kw }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentOrder.photo" label="照片" :span="2">
              <img :src="currentOrder.photo" style="max-width: 300px; border-radius: 8px;" />
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <template #footer>
          <el-button v-if="currentOrder?.status === 'pending'" type="warning" @click="handleAccept(currentOrder); detailVisible = false;">接单处理</el-button>
          <el-button v-if="currentOrder?.status === 'accepted'" type="success" @click="handleVerify(currentOrder, 'pass'); detailVisible = false;">验收通过</el-button>
          <el-button v-if="currentOrder?.status === 'accepted'" type="danger" @click="handleVerify(currentOrder, 'reject'); detailVisible = false;">验收不通过</el-button>
          <el-button @click="detailVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="trackVisible" :title="'追踪记录 - ' + (currentOrder?.id || '')" width="600px">
        <div v-if="currentOrder && currentOrder.trackingLog?.length">
          <div class="tracking-timeline">
            <div v-for="(log, idx) in currentOrder.trackingLog" :key="idx" class="tracking-item">
              <div class="tracking-dot" :class="{ 'tracking-dot-active': idx === currentOrder.trackingLog.length - 1 }"></div>
              <div class="tracking-content-box">
                <div class="tracking-action">{{ log.action }}</div>
                <div class="tracking-note" v-if="log.note">{{ log.note }}</div>
                <div class="tracking-time">{{ new Date(log.time).toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-text">暂无追踪记录</div>
        </div>
        <template #footer>
          <el-button @click="trackVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  `
};

const YearlyReport = {
  setup() {
    const selectedYear = ref(new Date().getFullYear());
    const reportData = ref(null);
    const loading = ref(false);
    const trendChart = ref(null);
    const typeChart = ref(null);

    const years = computed(() => {
      const current = new Date().getFullYear();
      return [current - 2, current - 1, current].filter(y => y >= 2020);
    });

    const loadReport = async () => {
      try {
        loading.value = true;
        reportData.value = await api.getYearlyReportData(selectedYear.value);
        nextTick(() => {
          renderCharts();
        });
      } catch (e) {
        ElMessage.error('加载报告数据失败');
      } finally {
        loading.value = false;
      }
    };

    const renderCharts = () => {
      if (!reportData.value) return;

      const trendCtx = document.getElementById('trendChart');
      if (trendCtx && reportData.value.monthlyData) {
        if (trendChart.value) trendChart.value.destroy();
        const labels = Object.keys(reportData.value.monthlyData);
        const wateringData = labels.map(m => reportData.value.monthlyData[m].watering);
        const fertilizingData = labels.map(m => reportData.value.monthlyData[m].fertilizing);
        const photosData = labels.map(m => reportData.value.monthlyData[m].photos);
        const newPlantsData = labels.map(m => reportData.value.monthlyData[m].newPlants);
        
        trendChart.value = new Chart(trendCtx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: '浇水',
                data: wateringData,
                backgroundColor: 'rgba(33, 150, 243, 0.8)'
              },
              {
                label: '施肥',
                data: fertilizingData,
                backgroundColor: 'rgba(255, 152, 0, 0.8)'
              },
              {
                label: '照片',
                data: photosData,
                backgroundColor: 'rgba(156, 39, 176, 0.8)'
              },
              {
                label: '新增植物',
                data: newPlantsData,
                backgroundColor: 'rgba(76, 175, 80, 0.8)'
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }

      const typeCtx = document.getElementById('typeChart');
      if (typeCtx && reportData.value.difficultyStats) {
        if (typeChart.value) typeChart.value.destroy();
        const labels = Object.keys(reportData.value.difficultyStats).map(k => {
          const map = { easy: '简单', medium: '中等', hard: '困难' };
          return map[k] || k;
        });
        const data = Object.values(reportData.value.difficultyStats);
        const colors = ['#4caf50', '#ff9800', '#f44336'];
        
        typeChart.value = new Chart(typeCtx, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    };

    const exportReport = async () => {
      try {
        await api.getYearlyReport(selectedYear.value);
        ElMessage.success('年度报告导出成功');
      } catch (e) {
        ElMessage.error('导出失败');
      }
    };

    const getDifficultyLabel = (difficulty) => {
      const opt = difficultyOptions.find(o => o.value === difficulty);
      return opt ? opt.label : difficulty;
    };

    const getStatusLabel = (status) => {
      const map = { healthy: '健康', warning: '需关注', dead: '已死亡' };
      return map[status] || status;
    };

    watch(selectedYear, () => {
      loadReport();
    });

    onMounted(() => {
      loadReport();
    });

    return {
      selectedYear,
      years,
      reportData,
      loading,
      loadReport,
      exportReport,
      getDifficultyLabel,
      getStatusLabel,
      formatDate
    };
  },
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">📄 年度养护报告</h1>
        <div class="page-header-actions">
          <el-select v-model="selectedYear" style="width: 150px; margin-right: 12px;">
            <el-option v-for="year in years" :key="year" :label="year + '年'" :value="year" />
          </el-select>
          <el-button type="success" @click="loadReport" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
          <el-button type="primary" @click="exportReport">
            <el-icon><Download /></el-icon> 导出JSON
          </el-button>
        </div>
      </div>

      <div v-loading="loading">
        <div v-if="!reportData" class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">加载报告数据中...</div>
        </div>
        <div v-else class="report-preview">
          <div class="report-header">
            <h2 class="report-title">🌱 {{ selectedYear }}年度绿植养护报告</h2>
            <p class="report-subtitle">生成时间：{{ formatDate(reportData.generatedAt) }}</p>
          </div>

          <div class="report-section">
            <h3 class="report-section-title">📈 年度总结</h3>
            <div class="report-summary-grid">
              <div class="report-summary-item">
                <div class="report-summary-value">{{ reportData.summary.totalPlants }}</div>
                <div class="report-summary-label">植物总数</div>
              </div>
              <div class="report-summary-item">
                <div class="report-summary-value">{{ reportData.summary.alivePlants }}</div>
                <div class="report-summary-label">存活数量</div>
              </div>
              <div class="report-summary-item">
                <div class="report-summary-value">{{ reportData.summary.survivalRate }}%</div>
                <div class="report-summary-label">存活率</div>
              </div>
              <div class="report-summary-item">
                <div class="report-summary-value">{{ reportData.summary.complianceRate }}%</div>
                <div class="report-summary-label">养护达标率</div>
              </div>
              <div class="report-summary-item">
                <div class="report-summary-value">{{ reportData.summary.totalWatering }}</div>
                <div class="report-summary-label">浇水次数</div>
              </div>
              <div class="report-summary-item">
                <div class="report-summary-value">{{ reportData.summary.totalFertilizing }}</div>
                <div class="report-summary-label">施肥次数</div>
              </div>
              <div class="report-summary-item">
                <div class="report-summary-value">{{ reportData.summary.totalPhotos }}</div>
                <div class="report-summary-label">成长照片</div>
              </div>
              <div class="report-summary-item">
                <div class="report-summary-value">{{ reportData.summary.totalRecords }}</div>
                <div class="report-summary-label">养护记录</div>
              </div>
            </div>
          </div>

          <el-row :gutter="20">
            <el-col :lg="16" :md="24">
              <div class="chart-container">
                <h3 class="chart-title">📊 月度养护统计</h3>
                <canvas id="trendChart" height="300"></canvas>
              </div>
            </el-col>
            <el-col :lg="8" :md="24">
              <div class="chart-container">
                <h3 class="chart-title">🎯 难度分布</h3>
                <canvas id="typeChart" height="300"></canvas>
              </div>
            </el-col>
          </el-row>

          <div class="report-section" style="margin-top: 24px;">
            <h3 class="report-section-title">🌿 植物养护详情</h3>
            <el-table :data="reportData.plantDetails" style="width: 100%" border>
              <el-table-column prop="name" label="名称" width="120" />
              <el-table-column prop="species" label="品种" width="150" />
              <el-table-column label="难度" width="100">
                <template #default="{ row }">
                  <span class="difficulty-badge" :class="'difficulty-' + row.difficulty">
                    {{ getDifficultyLabel(row.difficulty) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'healthy' ? 'success' : row.status === 'dead' ? 'danger' : 'warning'">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="wateringCount" label="浇水次数" width="100" align="center" />
              <el-table-column prop="fertilizingCount" label="施肥次数" width="100" align="center" />
              <el-table-column prop="photoCount" label="照片数" width="100" align="center" />
              <el-table-column label="添加日期">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
  `
};

const app = createApp(App);
app.use(ElementPlus, { locale: ElementPlusLocaleZhCn });

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.component('dashboard', Dashboard);
app.component('plant-management', PlantManagement);
app.component('notification-page', NotificationPage);
app.component('photo-timeline', PhotoTimeline);
app.component('inspection-diagnosis', InspectionDiagnosis);
app.component('yearly-report', YearlyReport);

app.mount('#app');

