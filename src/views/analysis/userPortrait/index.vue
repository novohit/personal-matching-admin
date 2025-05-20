<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import * as echarts from 'echarts';
import { getUserPortraitData } from "@/api/common/data";

// 日期相关
const beginDate = ref<string>('');
const endDate = ref<string>('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 活跃时间类型：日/周/月
const activeTimeType = ref<string>('day');

// 用户画像数据
const portraitData = ref<any>(null);
const loading = ref<boolean>(false);

// 图表实例
const provinceChartRef = ref<HTMLElement | null>(null);
const cityChartRef = ref<HTMLElement | null>(null);
const genderChartRef = ref<HTMLElement | null>(null);
const platformChartRef = ref<HTMLElement | null>(null);
const ageChartRef = ref<HTMLElement | null>(null);
const iosDevicesChartRef = ref<HTMLElement | null>(null);
const androidDevicesChartRef = ref<HTMLElement | null>(null);
const genderTrendChartRef = ref<HTMLElement | null>(null);
const ageTrendChartRef = ref<HTMLElement | null>(null);

let provinceChart: echarts.ECharts | null = null;
let cityChart: echarts.ECharts | null = null;
let genderChart: echarts.ECharts | null = null;
let platformChart: echarts.ECharts | null = null;
let ageChart: echarts.ECharts | null = null;
let iosDevicesChart: echarts.ECharts | null = null;
let androidDevicesChart: echarts.ECharts | null = null;
let genderTrendChart: echarts.ECharts | null = null;
let ageTrendChart: echarts.ECharts | null = null;

// 趋势数据（模拟）
const trendData = reactive({
  dates: [] as string[],
  genderData: {
    male: [] as number[],
    female: [] as number[]
  },
  ageData: {
    under17: [] as number[],
    age18to24: [] as number[],
    age25to34: [] as number[],
    age35to44: [] as number[],
    over45: [] as number[]
  }
});

// 禁用日期选择（不能选择今天及以后的日期）
const disabledDate = (current: dayjs.Dayjs): boolean => {
  if (activeTimeType.value === 'day') {
    return current && current > dayjs().startOf('day');
  } else if (activeTimeType.value === 'week') {
    return current && current > dayjs().startOf('week');
  } else if (activeTimeType.value === 'month') {
    return current && current > dayjs().startOf('month').subtract(1, 'day');
  }
  return false;
};

// 格式化日期为YYYYMMDD
const formatDateToString = (date: dayjs.Dayjs): string => {
  return date.format('YYYYMMDD');
};

// 切换时间类型
const switchTimeType = (type: string): void => {
  activeTimeType.value = type;
  // 根据时间类型重新设置日期范围
  resetDateRange();
};

// 重置日期范围
const resetDateRange = (): void => {
  const endDay = dayjs().subtract(1, 'day');
  let startDay;

  if (activeTimeType.value === 'day') {
    startDay = endDay.subtract(6, 'day');
  } else if (activeTimeType.value === 'week') {
    startDay = endDay.subtract(4, 'week');
  } else if (activeTimeType.value === 'month') {
    startDay = endDay.subtract(5, 'month');
  }

  dateRange.value = [startDay, endDay];
  beginDate.value = formatDateToString(startDay);
  endDate.value = formatDateToString(endDay);

  // 获取新的数据
  fetchUserPortraitData();
  generateTrendData(); // 生成趋势数据
};

// 日期范围变化处理函数
const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
  if (dates && dates.length === 2) {
    beginDate.value = formatDateToString(dates[0]);
    endDate.value = formatDateToString(dates[1]);
    fetchUserPortraitData();
    generateTrendData(); // 生成趋势数据
  }
};

// 获取用户画像数据
const fetchUserPortraitData = async () => {
  if (!beginDate.value || !endDate.value) return;
  
  loading.value = true;
  try {
    const response = await getUserPortraitData(beginDate.value, endDate.value);
    if (response.code === 0) {
      portraitData.value = response.data;
      renderCharts();
    }
  } catch (error) {
    console.error('获取用户画像数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 生成趋势数据（模拟数据，实际应该从API获取）
const generateTrendData = () => {
  trendData.dates = [];
  trendData.genderData.male = [];
  trendData.genderData.female = [];
  trendData.ageData.under17 = [];
  trendData.ageData.age18to24 = [];
  trendData.ageData.age25to34 = [];
  trendData.ageData.age35to44 = [];
  trendData.ageData.over45 = [];
  
  const start = dayjs(beginDate.value, 'YYYYMMDD');
  const end = dayjs(endDate.value, 'YYYYMMDD');
  let current = start.clone();
  
  const dateFormat = activeTimeType.value === 'day' ? 'MM-DD' :
                    activeTimeType.value === 'week' ? 'MM-DD' : 'YYYY-MM';
  
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    trendData.dates.push(current.format(dateFormat));
    
    // 模拟性别数据
    trendData.genderData.male.push(Math.floor(Math.random() * 1000) + 500);
    trendData.genderData.female.push(Math.floor(Math.random() * 800) + 300);
    
    // 模拟年龄数据
    trendData.ageData.under17.push(Math.floor(Math.random() * 300) + 100);
    trendData.ageData.age18to24.push(Math.floor(Math.random() * 500) + 200);
    trendData.ageData.age25to34.push(Math.floor(Math.random() * 700) + 300);
    trendData.ageData.age35to44.push(Math.floor(Math.random() * 400) + 150);
    trendData.ageData.over45.push(Math.floor(Math.random() * 200) + 50);
    
    if (activeTimeType.value === 'day') {
      current = current.add(1, 'day');
    } else if (activeTimeType.value === 'week') {
      current = current.add(1, 'week');
    } else if (activeTimeType.value === 'month') {
      current = current.add(1, 'month');
    }
  }
  
  renderTrendCharts();
};

// 初始化图表
const initCharts = () => {
  // 初始化图表实例
  if (provinceChartRef.value) {
    provinceChart = echarts.init(provinceChartRef.value);
  }
  if (cityChartRef.value) {
    cityChart = echarts.init(cityChartRef.value);
  }
  if (genderChartRef.value) {
    genderChart = echarts.init(genderChartRef.value);
  }
  if (platformChartRef.value) {
    platformChart = echarts.init(platformChartRef.value);
  }
  if (ageChartRef.value) {
    ageChart = echarts.init(ageChartRef.value);
  }
  if (iosDevicesChartRef.value) {
    iosDevicesChart = echarts.init(iosDevicesChartRef.value);
  }
  if (androidDevicesChartRef.value) {
    androidDevicesChart = echarts.init(androidDevicesChartRef.value);
  }
  if (genderTrendChartRef.value) {
    genderTrendChart = echarts.init(genderTrendChartRef.value);
  }
  if (ageTrendChartRef.value) {
    ageTrendChart = echarts.init(ageTrendChartRef.value);
  }
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    provinceChart?.resize();
    cityChart?.resize();
    genderChart?.resize();
    platformChart?.resize();
    ageChart?.resize();
    iosDevicesChart?.resize();
    androidDevicesChart?.resize();
    genderTrendChart?.resize();
    ageTrendChart?.resize();
  });
};

// 渲染图表
const renderCharts = () => {
  if (!portraitData.value) return;
  
  const { visit_uv } = portraitData.value;
  
  // 渲染省份分布柱状图
  if (provinceChart && visit_uv?.province) {
    const provinceData = visit_uv.province
      .sort((a: any, b: any) => b.value - a.value)
      .map((item: any) => ({
        name: item.name,
        value: item.value
      }));
    
    // 根据省份数量设置图表宽度
    const chartWidth = Math.max(provinceData.length * 50, 500);
    provinceChartRef.value.style.width = `${chartWidth}px`;
    
    provinceChart.resize();
    provinceChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '0',
        right: '0',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: provinceData.map((item: any) => item.name),
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '访问人数',
          type: 'bar',
          data: provinceData.map((item: any) => item.value)
        }
      ]
    });
  }
  
  // 渲染城市分布柱状图
  if (cityChart && visit_uv?.city) {
    const cityData = visit_uv.city
      .sort((a: any, b: any) => b.value - a.value)
      .map((item: any) => ({
        name: item.name,
        value: item.value
      }));
    
    // 根据城市数量设置图表宽度
    const chartWidth = Math.max(cityData.length * 50, 500);
    cityChartRef.value.style.width = `${chartWidth}px`;
    
    cityChart.resize();
    cityChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '0',
        right: '0',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: cityData.map((item: any) => item.name),
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '访问人数',
          type: 'bar',
          data: cityData.map((item: any) => item.value)
        }
      ]
    });
  }
  
  // 渲染性别分布饼图
  if (genderChart && visit_uv?.genders) {
    const genderData = visit_uv.genders.map((item: any) => ({
      name: item.name,
      value: item.value
    }));
    
    genderChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: genderData.map((item: any) => item.name)
      },
      series: [
        {
          name: '性别分布',
          type: 'pie',
          radius: '70%',
          center: ['50%', '50%'],
          data: genderData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    });
  }
  
  // 渲染平台分布饼图
  if (platformChart && visit_uv?.platforms) {
    const platformData = visit_uv.platforms.map((item: any) => ({
      name: item.name,
      value: item.value
    }));
    
    platformChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: platformData.map((item: any) => item.name)
      },
      series: [
        {
          name: '平台分布',
          type: 'pie',
          radius: '70%',
          center: ['50%', '50%'],
          data: platformData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    });
  }
  
  // 渲染年龄分布饼图
  if (ageChart && visit_uv?.ages) {
    const ageData = visit_uv.ages.map((item: any) => ({
      name: item.name,
      value: item.value
    }));
    
    ageChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: ageData.map((item: any) => item.name)
      },
      series: [
        {
          name: '年龄分布',
          type: 'pie',
          radius: '70%',
          center: ['55%', '50%'],
          data: ageData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    });
  }
  
  // 渲染iOS设备Top10榜单
  if (iosDevicesChart && visit_uv?.devices) {
    const iosDevices = visit_uv.devices
      .filter((item: any) => item.name.includes('iPhone') || item.name.includes('iPad') || item.name.includes('iPod'))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10);
    
    iosDevicesChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: iosDevices.map((item: any) => item.name),
        // axisLabel: {
        //   formatter: function(value: string) {
        //     if (value.length > 10) {
        //       return value.substring(0, 10) + '...';
        //     }
        //     return value;
        //   }
        // }
      },
      series: [
        {
          name: '访问人数',
          type: 'bar',
          data: iosDevices.map((item: any) => item.value)
        }
      ]
    });
  }
  
  // 渲染Android设备Top10榜单
  if (androidDevicesChart && visit_uv?.devices) {
    const androidDevices = visit_uv.devices
      .filter((item: any) => !item.name.includes('iPhone') && !item.name.includes('iPad') && !item.name.includes('iPod'))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10);
    
    androidDevicesChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: androidDevices.map((item: any) => item.name),
        // axisLabel: {
        //   formatter: function(value: string) {
        //     if (value.length > 10) {
        //       return value.substring(0, 10) + '...';
        //     }
        //     return value;
        //   }
        // }
      },
      series: [
        {
          name: '访问人数',
          type: 'bar',
          data: androidDevices.map((item: any) => item.value)
        }
      ]
    });
  }
};

// 渲染趋势图表
const renderTrendCharts = () => {
  // 渲染性别趋势折线图
  if (genderTrendChart) {
    genderTrendChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['男', '女']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.dates
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '男',
          type: 'line',
          data: trendData.genderData.male,
          smooth: true
        },
        {
          name: '女',
          type: 'line',
          data: trendData.genderData.female,
          smooth: true
        }
      ]
    });
  }

  // 渲染年龄趋势折线图
  if (ageTrendChart) {
    ageTrendChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['17岁以下', '18-24岁', '25-34岁', '35-44岁', '45岁以上']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.dates
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '17岁以下',
          type: 'line',
          data: trendData.ageData.under17,
          smooth: true
        },
        {
          name: '18-24岁',
          type: 'line',
          data: trendData.ageData.age18to24,
          smooth: true
        },
        {
          name: '25-34岁',
          type: 'line',
          data: trendData.ageData.age25to34,
          smooth: true
        },
        {
          name: '35-44岁',
          type: 'line',
          data: trendData.ageData.age35to44,
          smooth: true
        },
        {
          name: '45岁以上',
          type: 'line',
          data: trendData.ageData.over45,
          smooth: true
        }
      ]
    });
  }
};

onMounted(() => {
  // 设置默认日期范围为最近7天
  const endDay = dayjs().subtract(1, 'day');
  const startDay = endDay.subtract(6, 'day');
  
  dateRange.value = [startDay, endDay];
  beginDate.value = formatDateToString(startDay);
  endDate.value = formatDateToString(endDay);
  
  // 初始化图表
  initCharts();
  
  // 获取数据
  fetchUserPortraitData();
  
  // 生成趋势数据
  generateTrendData();
});
</script>

<template>
  <div class="container">
    <div class="page-header">
      <div class="title">用户画像</div>
      <div class="controls">
        <!-- <div class="time-tabs">
          <a-radio-group v-model:value="activeTimeType" button-style="solid" @change="switchTimeType">
            <a-radio-button value="day">日</a-radio-button>
            <a-radio-button value="week">周</a-radio-button>
            <a-radio-button value="month">月</a-radio-button>
          </a-radio-group>
        </div> -->
        <div class="date-picker">
          <a-range-picker
            v-model:value="dateRange"
            :locale="locale"
            :disabled-date="disabledDate"
            @change="handleDateRangeChange"
          />
        </div>
      </div>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <!-- 省份分布柱状图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">省份分布</div>
          <div class="chart-scroll-container">
            <div ref="provinceChartRef" class="chart-container"></div>
          </div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <!-- 城市分布柱状图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">城市分布</div>
          <div class="chart-scroll-container">
            <div ref="cityChartRef" class="chart-container"></div>
          </div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <!-- 性别分布饼图 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">性别分布</div>
          <div ref="genderChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <!-- 平台分布饼图 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">平台分布</div>
          <div ref="platformChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <!-- 年龄分布饼图 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">年龄分布</div>
          <div ref="ageChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <!-- iOS设备Top10榜单 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">iOS平台机型Top10</div>
          <div ref="iosDevicesChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <!-- Android设备Top10榜单 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">Android平台机型Top10</div>
          <div ref="androidDevicesChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <!-- 性别趋势折线图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">性别趋势</div>
          <div ref="genderTrendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <!-- 年龄趋势折线图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">年龄趋势</div>
          <div ref="ageTrendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.chart-card {
  margin-bottom: 20px;
  transition: all 0.3s ease;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.chart-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
  opacity: 0.8;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.chart-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
}

.chart-container {
  height: 300px;
  min-width: 100%;
}

.no-data {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
