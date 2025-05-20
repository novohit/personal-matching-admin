<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import * as echarts from "echarts";
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { getPageVisitData, getUserVisitTrendData, getUserSummaryData, getUserRetainTrendData } from "@/api/common/data";
import type { Dayjs } from 'dayjs';

// 类型定义
interface PageVisitItem {
  page_path: string;
  page_visit_uv: number;
  page_visit_pv: number;
  entrypage_pv: number;
  [key: string]: any;
}

interface TrendDataItem {
  ref_date: string;
  session_cnt: number;
  visit_uv: number;
  visit_uv_new: number;
  visit_pv: number;
  stay_time_session?: number;
  stay_time_uv?: number;
  visit_depth?: number;
  [key: string]: any;
}

interface RetainDataItem {
  ref_date: string;
  visit_uv_new: {
    key: number;
    value: number;
  }[];
  visit_uv: {
    key: number;
    value: number;
  }[];
}

interface SummaryDataItem {
  ref_date: string;
  visit_total: number;
  share_pv: number;
  share_uv: number;
}

defineOptions({
  name: "Welcome"
});

// 工具函数 - 格式化日期为YYYYMMDD
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// 工具函数 - 格式化YYYYMMDD为显示格式
const formatStringToDisplay = (dateStr: string): string => {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const d = new Date(`${year}-${month}-${day}`);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${weekdays[d.getDay()]} ${year}/${month}/${day}`;
};

// 工具函数 - 获取日期间隔
const getDateWithOffset = (date: Date, offsetDays: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + offsetDays);
  return newDate;
};

// 页面访问数据
const pageVisitData = ref<PageVisitItem[]>([]);
// 昨天日期
const yesterdayDate = ref<string>('');
// 当前日期（时间戳）
const currentDate = ref<number>(0);
// 格式化日期（显示用）
const formattedDate = ref<string>('');
// 当前指标
const activeMetric = ref<string>('page_visit_uv');
// 指标标签
const metricLabels = {
  page_visit_uv: '访问人数',
  page_visit_pv: '打开次数',
  entrypage_pv: '访问页面数'
};

// 趋势数据相关
const trendData = ref<TrendDataItem[]>([]);
const activeTimeType = ref<string>('day');
// 组件用的日期
const selectedDate = ref<Dayjs | null>(null);
// 发后端用的日期
const backendDate = ref<string>('');
// 访问数据概况
const summaryData = ref<SummaryDataItem[]>([]);
const summaryLoading = ref<boolean>(false);
const summaryDate = ref<Dayjs | null>(null);

// 留存数据相关
const retainData = ref<RetainDataItem | null>(null);
const activeRetainTimeType = ref<string>('day');
const selectedRetainDate = ref<Dayjs | null>(null);
const backendRetainDate = ref<string>('');
const retainLoading = ref<boolean>(false);
const retainChartRef = ref<HTMLElement | null>(null);
let retainChart: echarts.ECharts | null = null;

// 获取趋势数据的通用处理函数
const handleTrendResponse = (response: any): void => {
  if (response.code === 0) {
    trendData.value = response.data.list;
  }
};

// 获取日趋势
const fetchDailyTrendData = async (date: string): Promise<void> => {
  try {
    const response = await getUserVisitTrendData('daily', date);
    handleTrendResponse(response);
  } catch (error) {
    console.error('获取日趋势数据失败:', error);
  }
};

// 获取周趋势
const fetchWeeklyTrendData = async (date: string): Promise<void> => {
  try {
    const [startDate, endDate] = date.split('-');
    const response = await getUserVisitTrendData('weekly', startDate, endDate);
    handleTrendResponse(response);
  } catch (error) {
    console.error('获取周趋势数据失败:', error);
  }
};

// 获取月趋势
const fetchMonthlyTrendData = async (date: string): Promise<void> => {
  try {
    const [startDate, endDate] = date.split('-');
    const response = await getUserVisitTrendData('monthly', startDate, endDate);
    handleTrendResponse(response);
  } catch (error) {
    console.error('获取月趋势数据失败:', error);
  }
};

// 根据时间类型获取趋势数据
const fetchTrendData = (type: string, date: string): void => {
  if (!date) return;
  if (type === 'day') {
    fetchDailyTrendData(date);
  } else if (type === 'week') {
    fetchWeeklyTrendData(date);
  } else if (type === 'month') {
    fetchMonthlyTrendData(date);
  }
};

// 切换时间类型
const switchTimeType = (type: string): void => {
  activeTimeType.value = type;
  // 根据新的时间类型重置日期选择器
  resetDatePicker(type);
};

// 重置日期选择器
const resetDatePicker = (type: string): void => {
  const today = new Date();
  
  if(type === 'day'){
    const yesterday = getDateWithOffset(today, -1);
    selectedDate.value = dayjs(yesterday);
    backendDate.value = formatDateToString(yesterday);
  } else if (type === 'week') {
    // 获取当前周的上一周的周一到周日
    const lastWeek = getDateWithOffset(today, -7);
    const monday = new Date(lastWeek);
    monday.setDate(lastWeek.getDate() - monday.getDay() + 1);
    const sunday = getDateWithOffset(monday, 6);
    
    selectedDate.value = dayjs(monday);
    backendDate.value = `${formatDateToString(monday)}-${formatDateToString(sunday)}`;
  } else if (type === 'month') {
    // 获取上个月的1号到最后一号
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const firstDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    selectedDate.value = dayjs(firstDayOfMonth);
    backendDate.value = `${formatDateToString(firstDayOfMonth)}-${formatDateToString(lastDayOfMonth)}`;
  }
  
  fetchTrendData(activeTimeType.value, backendDate.value);
};

// 日期选择器变化事件
const handleDateChange = (date: Dayjs): void => {
  selectedDate.value = date;
  
  if(activeTimeType.value === 'day'){
    backendDate.value = date.format('YYYYMMDD');
    fetchTrendData(activeTimeType.value, backendDate.value);
  } else if(activeTimeType.value === 'week'){
    const monday = date.startOf('week').add(1, 'day');
    const sunday = date.endOf('week').add(1, 'day');
    backendDate.value = `${monday.format('YYYYMMDD')}-${sunday.format('YYYYMMDD')}`;
    fetchTrendData(activeTimeType.value, backendDate.value);
  } else if(activeTimeType.value === 'month'){
    const firstDay = date.startOf('month');
    const lastDay = date.endOf('month');
    backendDate.value = `${firstDay.format('YYYYMMDD')}-${lastDay.format('YYYYMMDD')}`;
    fetchTrendData(activeTimeType.value, backendDate.value);
  }
};

// 禁用日期选择（不能选择今天及以后的日期）
const disabledDate = (current: Dayjs): boolean => {
  if(activeTimeType.value === 'day'){
    return current && current > dayjs().startOf('day');
  } else if(activeTimeType.value === 'week'){
    return current && current > dayjs().startOf('week');
  } else if (activeTimeType.value === 'month') {
    return current && current > dayjs().startOf('month').subtract(1, 'day');
  }
  return false;
};

// 获取页面访问数据
const fetchPageVisitData = async (date: string): Promise<void> => {
  try {
    const response = await getPageVisitData(date);

    if (response.code === 0) {
      pageVisitData.value = response.data.list;
      formattedDate.value = formatStringToDisplay(date);
    }
  } catch (error) {
    console.error('获取页面访问数据失败:', error);
  }
};

// 切换指标
const switchMetric = (metric: string): void => {
  activeMetric.value = metric;
};

// 计算最大值，用于进度条百分比计算
const getMaxMetricValue = (): number => {
  if (pageVisitData.value.length === 0) return 1;
  return Math.max(...pageVisitData.value.map(item => item[activeMetric.value]));
};

// 计算百分比
const calculatePercentage = (value: number): number => {
  const max = getMaxMetricValue();
  return Math.round((value / max) * 100);
};

// 前一天
const previousDay = (): void => {
  currentDate.value = currentDate.value - 86400000;
  const prevDate = new Date(currentDate.value);
  fetchPageVisitData(formatDateToString(prevDate));
};

// 后一天
const nextDay = (): void => {
  currentDate.value = currentDate.value + 86400000;
  const nextDate = new Date(currentDate.value);
  fetchPageVisitData(formatDateToString(nextDate));
};

// 计算是否禁用"下一天"按钮
const isDisabled = computed((): boolean => {
  const temp = new Date(currentDate.value);
  return formatDateToString(temp) === yesterdayDate.value;
});

// 获取访问数据概况
const fetchSummaryData = async (date: string): Promise<void> => {
  try {
    summaryLoading.value = true;
    const response = await getUserSummaryData(dayjs(date).format('YYYYMMDD'));
    if (response.code === 0) {
      summaryData.value = response.data.list;
    }
  } catch (error) {
    console.error('获取访问数据概况失败:', error);
  } finally {
    summaryLoading.value = false;
  }
};

// 日期选择器变化事件 - 概况数据
const handleSummaryDateChange = (date: Dayjs): void => {
  summaryDate.value = date;
  fetchSummaryData(date.format('YYYYMMDD'));
};

// 获取留存数据的通用处理函数
const handleRetainResponse = (response: any): void => {
  if (response.code === 0) {
    retainData.value = response.data;
    renderRetainChart();
  }
};

// 获取日留存
const fetchDailyRetainData = async (beginDate: string): Promise<void> => {
  try {
    retainLoading.value = true;
    const response = await getUserRetainTrendData('daily', beginDate);
    handleRetainResponse(response);
  } catch (error) {
    console.error('获取日留存数据失败:', error);
  } finally {
    retainLoading.value = false;
  }
};

// 获取周留存
const fetchWeeklyRetainData = async (beginDate: string, endDate: string): Promise<void> => {
  try {
    retainLoading.value = true;
    const response = await getUserRetainTrendData('weekly', beginDate, endDate);
    handleRetainResponse(response);
  } catch (error) {
    console.error('获取周留存数据失败:', error);
  } finally {
    retainLoading.value = false;
  }
};

// 获取月留存
const fetchMonthlyRetainData = async (beginDate: string, endDate: string): Promise<void> => {
  try {
    retainLoading.value = true;
    const response = await getUserRetainTrendData('monthly', beginDate, endDate);
    handleRetainResponse(response);
  } catch (error) {
    console.error('获取月留存数据失败:', error);
  } finally {
    retainLoading.value = false;
  }
};

// 根据时间类型获取留存数据
const fetchRetainData = (type: string, date: string): void => {
  if (type === 'day') {
    fetchDailyRetainData(date);
  } else if (type === 'week') {
    const [startDate, endDate] = date.split('-');
    fetchWeeklyRetainData(startDate, endDate);
  } else if (type === 'month') {
    const [startDate, endDate] = date.split('-');
    fetchMonthlyRetainData(startDate, endDate);
  }
};

// 切换留存时间类型
const switchRetainTimeType = (type: string): void => {
  activeRetainTimeType.value = type;
  // 根据新的时间类型重置日期选择器
  resetRetainDatePicker(type);
};

// 重置留存日期选择器
const resetRetainDatePicker = (type: string): void => {
  const today = new Date();
  
  if(type === 'day'){
    const yesterday = getDateWithOffset(today, -1);
    selectedRetainDate.value = dayjs(yesterday);
    backendRetainDate.value = formatDateToString(yesterday);
  } else if (type === 'week') {
    // 获取当前周的上一周的周一到周日
    const lastWeek = getDateWithOffset(today, -7);
    const monday = new Date(lastWeek);
    monday.setDate(lastWeek.getDate() - monday.getDay() + 1);
    const sunday = getDateWithOffset(monday, 6);
    
    selectedRetainDate.value = dayjs(monday);
    backendRetainDate.value = `${formatDateToString(monday)}-${formatDateToString(sunday)}`;
  } else if (type === 'month') {
    // 获取上个月的1号
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const firstDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    selectedRetainDate.value = dayjs(firstDayOfMonth);
    backendRetainDate.value = `${formatDateToString(firstDayOfMonth)}-${formatDateToString(lastDayOfMonth)}`;
    
  }
  fetchRetainData(activeRetainTimeType.value, backendRetainDate.value);
};

// 留存日期选择器变化事件
const handleRetainDateChange = (date: Dayjs): void => {
  selectedRetainDate.value = date;
  
  if(activeRetainTimeType.value === 'day'){
    backendRetainDate.value = date.format('YYYYMMDD');
    fetchRetainData(activeRetainTimeType.value, backendRetainDate.value);
  } else if(activeRetainTimeType.value === 'week'){
    const monday = date.startOf('week').add(1, 'day');
    const sunday = date.endOf('week').add(1, 'day');
    backendRetainDate.value = `${monday.format('YYYYMMDD')}-${sunday.format('YYYYMMDD')}`;
    fetchRetainData(activeRetainTimeType.value, backendRetainDate.value);
  } else if(activeRetainTimeType.value === 'month'){
    const firstDay = date.startOf('month');
    const lastDay = date.endOf('month');
    backendRetainDate.value = `${firstDay.format('YYYYMMDD')}-${lastDay.format('YYYYMMDD')}`;
    fetchRetainData(activeRetainTimeType.value, backendRetainDate.value);
  }
};

// 初始化留存图表
const initRetainChart = (): void => {
  if (retainChartRef.value) {
    retainChart = echarts.init(retainChartRef.value);
    window.addEventListener('resize', () => {
      retainChart?.resize();
    });
  }
};

// 渲染留存图表
const renderRetainChart = (): void => {
  if (!retainChart || !retainData.value) return;
  
  // 获取留存天数标签
  const dayLabels = retainData.value.visit_uv_new.map(item => {
    if (item.key === 0) return '当天';
    if (item.key === 1) return '次日';
    if (item.key <= 7) return `${item.key}天后`;
    if (item.key === 14) return '14天后';
    if (item.key === 30) return '30天后';
    return `${item.key}天后`;
  });
  
  // 获取新增用户留存率数据
  const newRetainRates = retainData.value.visit_uv_new.map((item, index) => {
    if (index === 0) return 100; // 当天留存率为100%
    const baseValue = retainData.value!.visit_uv_new[0].value;
    return baseValue > 0 ? (item.value / baseValue * 100).toFixed(2) : 0;
  });
  
  // 获取活跃用户留存率数据
  const activeRetainRates = retainData.value.visit_uv.map((item, index) => {
    if (index === 0) return 100; // 当天留存率为100%
    const baseValue = retainData.value!.visit_uv[0].value;
    return baseValue > 0 ? (item.value / baseValue * 100).toFixed(2) : 0;
  });
  
  retainChart.setOption({
    title: {
      text: '用户留存率',
      left: 'center',
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const newUserParam = params[0];
        const activeUserParam = params[1];
        return `${newUserParam.name}<br/>${newUserParam.seriesName}: ${newUserParam.value}%<br/>${activeUserParam.seriesName}: ${activeUserParam.value}%`;
      }
    },
    legend: {
      data: ['新增用户留存率', '活跃用户留存率'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dayLabels
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '新增用户留存率',
        type: 'line',
        data: newRetainRates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: '活跃用户留存率',
        type: 'line',
        data: activeRetainRates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  });
};

onMounted(() => {
  const today = new Date();
  const yesterday = getDateWithOffset(today, -1);
  
  // 设置当前日期为昨天
  currentDate.value = yesterday.getTime();
  yesterdayDate.value = formatDateToString(yesterday);
  
  // 获取页面访问数据
  fetchPageVisitData(yesterdayDate.value);
  
  // 初始化趋势数据
  selectedDate.value = dayjs(yesterday);
  backendDate.value = formatDateToString(yesterday);
  fetchTrendData('day', backendDate.value);
  
  // 获取访问数据概况
  summaryDate.value = dayjs(yesterday);
  fetchSummaryData(yesterdayDate.value);
  
  // 初始化留存数据
  selectedRetainDate.value = dayjs(yesterday);
  backendRetainDate.value = formatDateToString(yesterday);
  fetchRetainData('day', backendRetainDate.value);
  
  // 初始化留存图表
  initRetainChart();
});
</script>

<template>
  <div class="p-5">
    <h1 class="mb-4 text-md">精准医链</h1>
    <div class="dashboard-container">
      <!-- 访问数据概况卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
                <!-- 留存面板 -->
        <el-col :span="12">
          <el-card class="retain-card" v-loading="retainLoading" element-loading-text="加载中...">
            <div class="retain-header">
              <div class="retain-title-wrapper">
                <h3 class="retain-title">用户留存数据</h3>
                <div class="retain-subtitle">微信小程序用户留存分析</div>
              </div>
            </div>
            
            <div class="retain-tabs">
              <div class="retain-tab" 
                   :class="{ active: activeRetainTimeType === 'day' }" 
                   @click="switchRetainTimeType('day')">日</div>
              <div class="retain-tab" 
                   :class="{ active: activeRetainTimeType === 'week' }" 
                   @click="switchRetainTimeType('week')">周</div>
              <div class="retain-tab" 
                   :class="{ active: activeRetainTimeType === 'month' }" 
                   @click="switchRetainTimeType('month')">月</div>
              
              <div class="retain-date-picker">
                <a-date-picker 
                  :locale="locale"
                  v-if="activeRetainTimeType === 'day'" 
                  :value="selectedRetainDate" 
                  :disabled-date="disabledDate"
                  @change="handleRetainDateChange" />
                <a-date-picker 
                  :locale="locale"
                  v-if="activeRetainTimeType === 'week'" 
                  picker="week" 
                  :value="selectedRetainDate" 
                  :disabled-date="disabledDate"
                  @change="handleRetainDateChange" />
                <a-date-picker 
                  :locale="locale"
                  v-if="activeRetainTimeType === 'month'" 
                  picker="month" 
                  :value="selectedRetainDate" 
                  :disabled-date="disabledDate"
                  @change="handleRetainDateChange" />
              </div>
            </div>
            
            <div v-if="retainData" class="retain-chart-container">
              <div ref="retainChartRef" class="retain-chart"></div>
              <div class="retain-data-summary">
                <div class="retain-summary-item">
                  <div class="retain-summary-label">日期</div>
                  <div class="retain-summary-value">{{ retainData.ref_date }}</div>
                </div>
                <div class="retain-summary-item">
                  <div class="retain-summary-label">新增用户</div>
                  <div class="retain-summary-value">{{ retainData.visit_uv_new[0]?.value || 0 }}</div>
                </div>
                <div class="retain-summary-item">
                  <div class="retain-summary-label">活跃用户</div>
                  <div class="retain-summary-value">{{ retainData.visit_uv[0]?.value || 0 }}</div>
                </div>
                <div class="retain-summary-item">
                  <div class="retain-summary-label">次日留存率</div>
                  <div class="retain-summary-value">
                    {{ retainData.visit_uv_new[0]?.value ? ((retainData.visit_uv_new[1]?.value || 0) / retainData.visit_uv_new[0].value * 100).toFixed(2) : 0 }}%
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else-if="!retainLoading" class="retain-empty">
              暂无数据
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="summary-card" v-loading="summaryLoading" element-loading-text="加载中...">
            <div class="summary-header">
              <div class="summary-title-wrapper">
                <h3 class="summary-title">访问数据概况</h3>
              </div>
              <div class="summary-date-picker">
                <a-date-picker
                  :locale="locale"
                  :value="summaryDate"
                  :disabled-date="disabledDate"
                  @change="handleSummaryDateChange"
                />
              </div>
            </div>
            <div class="summary-content">
              <div v-if="summaryData.length > 0" class="summary-items">
                <div class="summary-item">
                  <div class="summary-value">{{ summaryData[0].visit_total }}</div>
                  <div class="summary-label">访问总人数</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">{{ summaryData[0].share_pv }}</div>
                  <div class="summary-label">转发次数</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">{{ summaryData[0].share_uv }}</div>
                  <div class="summary-label">转发人数</div>
                </div>
              </div>
              <div v-else-if="!summaryLoading" class="summary-empty">暂无数据</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px">
        <!-- 趋势面板 -->
        <el-col :span="12">
          <el-card class="trend-card">
            <div class="trend-header">
              <div class="trend-title-wrapper">
                <h3 class="trend-title">用户访问数据</h3>
                <div class="trend-subtitle">微信小程序访问趋势数据分析</div>
              </div>
            </div>
            
            <div class="trend-tabs">
              <div class="trend-tab" 
                   :class="{ active: activeTimeType === 'day' }" 
                   @click="switchTimeType('day')">日</div>
              <div class="trend-tab" 
                   :class="{ active: activeTimeType === 'week' }" 
                   @click="switchTimeType('week')">周</div>
              <div class="trend-tab" 
                   :class="{ active: activeTimeType === 'month' }" 
                   @click="switchTimeType('month')">月</div>
              

              <div class="trend-date-picker">
                <a-date-picker 
                  :locale="locale"
                  v-if="activeTimeType === 'day'" 
                  :value="selectedDate" 
                  :disabled-date="disabledDate"
                  @change="handleDateChange" />
                <a-date-picker 
                  :locale="locale"
                  v-if="activeTimeType === 'week'" 
                  picker="week" 
                  :value="selectedDate" 
                  :disabled-date="disabledDate"
                  @change="handleDateChange" />
                <a-date-picker 
                  :locale="locale"
                  v-if="activeTimeType === 'month'" 
                  picker="month" 
                  :value="selectedDate" 
                  :disabled-date="disabledDate"
                  @change="handleDateChange" />
              </div>
            </div>
            

            <div class="trend-data" v-if="trendData.length > 0">
              <div class="trend-data-item">
                <div class="trend-data-label">时间范围</div>
                <div class="trend-data-value">{{ trendData[0].ref_date }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">会话数</div>
                <div class="trend-data-value">{{ trendData[0].session_cnt }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">访问人数</div>
                <div class="trend-data-value">{{ trendData[0].visit_uv }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">新访问人数</div>
                <div class="trend-data-value">{{ trendData[0].visit_uv_new }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">页面浏览量</div>
                <div class="trend-data-value">{{ trendData[0].visit_pv }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">次均停留时长(秒)</div>
                <div class="trend-data-value">{{ trendData[0].stay_time_session?.toFixed(2) }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">人均停留时长(秒)</div>
                <div class="trend-data-value">{{ trendData[0].stay_time_uv?.toFixed(2) }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">平均访问深度</div>
                <div class="trend-data-value">{{ trendData[0].visit_depth?.toFixed(2) }}</div>
              </div>
            </div>
            
            <div v-else class="trend-empty">
              暂无数据
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card class="page-visit-card">
            <div class="page-visit-header">
              <div class="page-visit-title-wrapper">
                <h3 class="page-visit-title">页面访问Top10</h3>
                <div class="page-visit-subtitle">微信小程序页面访问数据分析</div>
              </div>
              <div class="page-visit-date">
                <el-button type="text" class="date-nav-button" @click="previousDay">
                  <el-icon><arrow-left /></el-icon>
                </el-button>
                <span>{{ formattedDate }}</span>
                <el-button type="text" class="date-nav-button" @click="nextDay" :disabled="isDisabled">
                  <el-icon><arrow-right /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="page-visit-tabs">
              <div class="page-visit-tab-label">指标筛选</div>
              <div 
                v-for="(label, metric) in metricLabels" 
                :key="metric"
                class="page-visit-tab"
                :class="{ active: activeMetric === metric }"
                @click="switchMetric(metric)"
              >
                {{ label }}
              </div>
            </div>
            <div class="page-visit-list">
              <el-tooltip  v-for="(item, index) in pageVisitData" :key="index" :content="item.page_path" placement="top" :show-after="600">
              <div class="page-visit-item" :style="{ animationDelay: index * 0.05 + 's' }">
                
                  <div class="page-visit-rank">{{ index + 1 }}</div>
                  
                  <div class="page-visit-path">{{ item.page_path }}</div>
                  
                  <div class="page-visit-progress-container">
                    <div 
                      class="page-visit-progress" 
                      :style="{ width: calculatePercentage(item[activeMetric]) + '%' }"
                    ></div>
                  </div>
                  <div class="page-visit-percentage">{{ calculatePercentage(item[activeMetric]) }}%</div>
                
              </div>
              </el-tooltip>
              <div v-if="pageVisitData.length === 0" class="page-visit-empty">
                暂无数据
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.welcome-title {
  margin-bottom: 30px;
  font-size: 24px;
  color: var(--el-text-color-primary);
  text-align: center;
}

.dashboard-container {
  margin-top: 20px;
}

:deep(.el-card) {
  margin-bottom: 20px;
  transition: all 0.3s ease;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

:deep(.el-card:hover) {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 趋势面板样式 */
.trend-card {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.trend-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-warning));
  opacity: 0.8;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
}

.trend-title-wrapper {
  display: flex;
  flex-direction: column;
}

.trend-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  position: relative;
}

.trend-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.trend-tabs {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.trend-tab {
  padding: 6px 16px;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s ease;
}

.trend-tab:hover {
  background-color: rgba(64, 158, 255, 0.08);
  color: var(--el-color-primary);
}

.trend-tab.active {
  background-color: var(--el-color-primary);
  color: white;
}

.trend-date-picker {
  margin-left: auto;
}

.trend-data {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.trend-data-item {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
}

.trend-data-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.trend-data-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.trend-data-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.trend-empty {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

/* 原有样式 */
.page-visit-card {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.page-visit-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
  opacity: 0.8;
}

.page-visit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
}

.page-visit-title-wrapper {
  display: flex;
  flex-direction: column;
}

.page-visit-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  position: relative;
}

.page-visit-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.page-visit-date {
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 20px;
  padding: 4px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.page-visit-date span {
  margin: 0 8px;
  font-size: 14px;
  color: #606266;
}

.page-visit-tabs {
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  position: relative;
}

.page-visit-tab-label {
  font-weight: 600;
  margin-right: 20px;
  color: #303133;
  padding: 0 4px;
}

.page-visit-tab {
  margin-right: 18px;
  cursor: pointer;
  color: #606266;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.page-visit-tab:hover {
  color: var(--el-color-primary);
  background-color: rgba(64, 158, 255, 0.08);
}

.page-visit-tab.active {
  color: var(--el-color-primary);
  font-weight: 500;
  position: relative;
  background-color: rgba(64, 158, 255, 0.1);
}

.page-visit-tab.active::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
}

.page-visit-list {
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.page-visit-list::-webkit-scrollbar {
  width: 6px;
}

.page-visit-list::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.page-visit-list::-webkit-scrollbar-track {
  background-color: #f5f7fa;
  border-radius: 3px;
}

.page-visit-item {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  margin-bottom: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  animation: fade-in 0.5s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-visit-item:hover {
  background-color: #f5f7fa;
}

.page-visit-path {
  width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: #303133;
  transition: color 0.2s ease;
}

.page-visit-item:hover .page-visit-path {
  color: var(--el-color-primary);
}

.page-visit-progress-container {
  flex: 1;
  height: 8px;
  background-color: #ebeef5;
  border-radius: 4px;
  margin: 0 16px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-visit-progress {
  height: 100%;
  background: linear-gradient(90deg, #67c23a, #95d475);
  border-radius: 4px;
  transition: width 0.5s ease-out;
  position: relative;
}

.page-visit-progress::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%
  );
  background-size: 16px 16px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from { background-position: 0 0; }
  to { background-position: 16px 0; }
}

.page-visit-value {
  width: 40px;
  text-align: right;
  margin-right: 8px;
  font-weight: 600;
  color: #303133;
}

.page-visit-percentage {
  width: 50px;
  font-weight: 500;
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
  border-radius: 12px;
  text-align: center;
  padding: 2px 6px;
  font-size: 12px;
}

.date-nav-button {
  transition: transform 0.2s ease;
}

.date-nav-button:hover {
  transform: scale(1.2);
}

.page-visit-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 50%;
  font-weight: bold;
  font-size: 12px;
  margin-right: 12px;
  flex-shrink: 0;
}

.page-visit-item:nth-child(1) .page-visit-rank {
  background-color: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.page-visit-item:nth-child(2) .page-visit-rank {
  background-color: rgba(144, 147, 153, 0.2);
  color: #909399;
}

.page-visit-item:nth-child(3) .page-visit-rank {
  background-color: rgba(103, 119, 127, 0.2);
  color: #67777f;
}

.page-visit-empty {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

/* 访问数据概况样式 */
.summary-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--el-color-success), var(--el-color-primary));
  opacity: 0.8;
}

.summary-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
}

.summary-title-wrapper {
  display: flex;
  flex-direction: column;
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  position: relative;
}

.summary-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.summary-content {
  padding: 10px 0;
}

.summary-items {
  display: flex;
  justify-content: space-around;
}

.summary-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background-color: #f5f7fa;
  transition: all 0.3s ease;
}

.summary-item:hover {
  background-color: #ecf5ff;
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 8px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
}

.summary-empty {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

.summary-date-picker {
  margin-left: auto;
}

/* 留存面板样式 */
.retain-card {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.retain-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-danger));
  opacity: 0.8;
}

.retain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
}

.retain-title-wrapper {
  display: flex;
  flex-direction: column;
}

.retain-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  position: relative;
}

.retain-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.retain-tabs {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.retain-tab {
  padding: 6px 16px;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s ease;
}

.retain-tab:hover {
  background-color: rgba(64, 158, 255, 0.08);
  color: var(--el-color-primary);
}

.retain-tab.active {
  background-color: var(--el-color-primary);
  color: white;
}

.retain-date-picker {
  margin-left: auto;
}

.retain-chart-container {
  display: flex;
  flex-direction: column;
}

.retain-chart {
  margin-bottom: 20px;
}

.retain-data-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 10px;
}

.retain-summary-item {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  width: calc(50% - 10px);
  transition: all 0.3s ease;
}

.retain-summary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.retain-summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.retain-summary-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.retain-empty {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
