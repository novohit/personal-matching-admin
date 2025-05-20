<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import * as echarts from 'echarts';
import { getUserPortraitData } from "@/api/common/data";

// 日期相关
const beginDate = ref<string>('');
const endDate = ref<string>('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 用户画像数据
const portraitData = ref<any>(null);
const loading = ref<boolean>(false);

// 图表实例
const provinceChartRef = ref<HTMLElement | null>(null);
const genderChartRef = ref<HTMLElement | null>(null);
const platformChartRef = ref<HTMLElement | null>(null);
const ageChartRef = ref<HTMLElement | null>(null);
const deviceChartRef = ref<HTMLElement | null>(null);
const cityChartRef = ref<HTMLElement | null>(null);

let provinceChart: echarts.ECharts | null = null;
let genderChart: echarts.ECharts | null = null;
let platformChart: echarts.ECharts | null = null;
let ageChart: echarts.ECharts | null = null;
let deviceChart: echarts.ECharts | null = null;
let cityChart: echarts.ECharts | null = null;

// 禁用日期选择（不能选择今天及以后的日期）
const disabledDate = (current: dayjs.Dayjs): boolean => {
  return current && current > dayjs().startOf('day');
};

// 格式化日期为YYYYMMDD
const formatDateToString = (date: dayjs.Dayjs): string => {
  return date.format('YYYYMMDD');
};

// 日期范围变化处理函数
const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
  if (dates && dates.length === 2) {
    beginDate.value = formatDateToString(dates[0]);
    endDate.value = formatDateToString(dates[1]);
    fetchUserPortraitData();
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

// 初始化图表
const initCharts = () => {
  // 初始化图表实例
  if (provinceChartRef.value) {
    provinceChart = echarts.init(provinceChartRef.value);
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
  if (deviceChartRef.value) {
    deviceChart = echarts.init(deviceChartRef.value);
  }
  if (cityChartRef.value) {
    cityChart = echarts.init(cityChartRef.value);
  }
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    provinceChart?.resize();
    genderChart?.resize();
    platformChart?.resize();
    ageChart?.resize();
    deviceChart?.resize();
    cityChart?.resize();
  });
};

// 渲染图表
const renderCharts = () => {
  if (!portraitData.value) return;
  
  const { visit_uv } = portraitData.value;
  
  // 渲染省份分布图表
  if (provinceChart && visit_uv?.province) {
    const provinceData = visit_uv.province.map((item: any) => ({
      name: item.name,
      value: item.value
    }));
    
    provinceChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: provinceData.map((item: any) => item.name)
      },
      series: [
        {
          name: '省份分布',
          type: 'pie',
          radius: '70%',
          center: ['50%', '60%'],
          data: provinceData,
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
  
  // 渲染性别分布图表
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
          center: ['50%', '60%'],
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
  
  // 渲染平台分布图表
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
          center: ['50%', '60%'],
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
  
  // 渲染年龄分布图表
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
          center: ['50%', '60%'],
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
  
  // 渲染设备分布图表
  if (deviceChart && visit_uv?.devices) {
    const deviceData = visit_uv.devices.map((item: any) => ({
      name: item.name,
      value: item.value
    })).slice(0, 10); // 只显示前10个设备
    
    deviceChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: deviceData.map((item: any) => item.name)
      },
      series: [
        {
          name: '设备分布',
          type: 'pie',
          radius: '70%',
          center: ['50%', '60%'],
          data: deviceData,
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
  
  // 渲染城市分布图表
  if (cityChart && visit_uv?.city) {
    const cityData = visit_uv.city.map((item: any) => ({
      name: item.name,
      value: item.value
    })).slice(0, 10); // 只显示前10个城市
    
    cityChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: cityData.map((item: any) => item.name)
      },
      series: [
        {
          name: '城市分布',
          type: 'pie',
          radius: '70%',
          center: ['50%', '60%'],
          data: cityData,
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
});
</script>

<template>
  <div class="container">
    <div class="page-header">
      <div class="title">用户画像</div>
      <div class="date-picker">
        <a-range-picker
          v-model:value="dateRange"
          :locale="locale"
          :disabled-date="disabledDate"
          @change="handleDateRangeChange"
        />
      </div>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">省份分布</div>
          <div ref="provinceChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">性别分布</div>
          <div ref="genderChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">平台分布</div>
          <div ref="platformChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">年龄分布</div>
          <div ref="ageChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">设备分布</div>
          <div ref="deviceChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">城市分布</div>
          <div ref="cityChartRef" class="chart-container"></div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
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

.chart-container {
  height: 300px;
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
