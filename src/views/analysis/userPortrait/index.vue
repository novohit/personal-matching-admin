<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import locale from "ant-design-vue/es/date-picker/locale/zh_CN";
import * as echarts from "echarts";
import { getUserPortraitData } from "@/api/common/data";

// 用户类型选项
const userTypeOptions = [
  { label: "老用户", value: "old" },
  { label: "新用户", value: "new" },
  { label: "全部用户", value: "all" }
];

// 每个图表的用户类型选择
const chartUserTypes = reactive({
  province: "old",
  city: "old",
  gender: "old",
  platform: "old",
  age: "old",
  iosDevices: "old",
  androidDevices: "old"
});

// 日期相关
const beginDate = ref<string>("");
const endDate = ref<string>("");
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 活跃时间类型：日/周/月
const activeTimeType = ref<string>("day");

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

let provinceChart: echarts.ECharts | null = null;
let cityChart: echarts.ECharts | null = null;
let genderChart: echarts.ECharts | null = null;
let platformChart: echarts.ECharts | null = null;
let ageChart: echarts.ECharts | null = null;
let iosDevicesChart: echarts.ECharts | null = null;
let androidDevicesChart: echarts.ECharts | null = null;

// 合并数据的工具函数
const mergeUserData = (oldData: any[], newData: any[]) => {
  if (!oldData || !newData) return oldData || newData || [];

  const mergedMap = new Map();

  // 添加老用户数据
  oldData.forEach(item => {
    mergedMap.set(item.name, { ...item });
  });

  // 合并新用户数据
  newData.forEach(item => {
    if (mergedMap.has(item.name)) {
      mergedMap.get(item.name).value += item.value;
    } else {
      mergedMap.set(item.name, { ...item });
    }
  });

  return Array.from(mergedMap.values());
};

// 根据用户类型获取数据
const getDataByUserType = (userType: string, dataKey: string) => {
  if (!portraitData.value) return null;

  const oldData = portraitData.value.visit_uv?.[dataKey];
  const newData = portraitData.value.visit_uv_new?.[dataKey];

  switch (userType) {
    case "old":
      return oldData;
    case "new":
      return newData;
    case "all":
      return mergeUserData(oldData, newData);
    default:
      return oldData;
  }
};

// 用户类型改变处理函数
const handleUserTypeChange = (chartType: string, userType: string) => {
  chartUserTypes[chartType] = userType;
  renderSpecificChart(chartType);
};

// 渲染特定图表
const renderSpecificChart = (chartType: string) => {
  switch (chartType) {
    case "province":
      renderProvinceChart();
      break;
    case "city":
      renderCityChart();
      break;
    case "gender":
      renderGenderChart();
      break;
    case "platform":
      renderPlatformChart();
      break;
    case "age":
      renderAgeChart();
      break;
    case "iosDevices":
      renderIosDevicesChart();
      break;
    case "androidDevices":
      renderAndroidDevicesChart();
      break;
  }
};

// 禁用日期选择（不能选择今天及以后的日期）
const disabledDate = (current: dayjs.Dayjs): boolean => {
  if (activeTimeType.value === "day") {
    return current && current > dayjs().startOf("day");
  } else if (activeTimeType.value === "week") {
    return current && current > dayjs().startOf("week");
  } else if (activeTimeType.value === "month") {
    return current && current > dayjs().startOf("month").subtract(1, "day");
  }
  return false;
};

// 格式化日期为YYYYMMDD
const formatDateToString = (date: dayjs.Dayjs): string => {
  return date.format("YYYYMMDD");
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
    console.error("获取用户画像数据失败:", error);
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

  // 监听窗口大小变化，调整图表大小
  window.addEventListener("resize", () => {
    provinceChart?.resize();
    cityChart?.resize();
    genderChart?.resize();
    platformChart?.resize();
    ageChart?.resize();
    iosDevicesChart?.resize();
    androidDevicesChart?.resize();
  });
};

// 渲染省份图表
const renderProvinceChart = () => {
  if (!provinceChart) return;

  const data = getDataByUserType(chartUserTypes.province, "province");
  if (!data) return;

  const provinceData = data
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
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: "0",
      right: "0",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: provinceData.map((item: any) => item.name),
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        name: "访问人数",
        type: "bar",
        data: provinceData.map((item: any) => item.value)
      }
    ]
  });
};

// 渲染城市图表
const renderCityChart = () => {
  if (!cityChart) return;

  const data = getDataByUserType(chartUserTypes.city, "city");
  if (!data) return;

  const cityData = data
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
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: "0",
      right: "0",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: cityData.map((item: any) => item.name),
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        name: "访问人数",
        type: "bar",
        data: cityData.map((item: any) => item.value)
      }
    ]
  });
};

// 渲染性别图表
const renderGenderChart = () => {
  if (!genderChart) return;

  const data = getDataByUserType(chartUserTypes.gender, "genders");
  if (!data) return;

  const genderData = data.map((item: any) => ({
    name: item.name,
    value: item.value
  }));

  genderChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b} : {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      left: "left",
      data: genderData.map((item: any) => item.name)
    },
    series: [
      {
        name: "性别分布",
        type: "pie",
        radius: "70%",
        center: ["50%", "50%"],
        data: genderData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        }
      }
    ]
  });
};

// 渲染平台图表
const renderPlatformChart = () => {
  if (!platformChart) return;

  const data = getDataByUserType(chartUserTypes.platform, "platforms");
  if (!data) return;

  const platformData = data.map((item: any) => ({
    name: item.name,
    value: item.value
  }));

  platformChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b} : {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      left: "left",
      data: platformData.map((item: any) => item.name)
    },
    series: [
      {
        name: "平台分布",
        type: "pie",
        radius: "70%",
        center: ["50%", "50%"],
        data: platformData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        }
      }
    ]
  });
};

// 渲染年龄图表
const renderAgeChart = () => {
  if (!ageChart) return;

  const data = getDataByUserType(chartUserTypes.age, "ages");
  if (!data) return;

  const ageData = data.map((item: any) => ({
    name: item.name,
    value: item.value
  }));

  ageChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b} : {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      left: "left",
      data: ageData.map((item: any) => item.name)
    },
    series: [
      {
        name: "年龄分布",
        type: "pie",
        radius: "70%",
        center: ["55%", "50%"],
        data: ageData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        }
      }
    ]
  });
};

// 渲染iOS设备图表
const renderIosDevicesChart = () => {
  if (!iosDevicesChart) return;

  const data = getDataByUserType(chartUserTypes.iosDevices, "devices");
  if (!data) return;

  const iosDevices = data
    .filter(
      (item: any) =>
        item.name.includes("iPhone") ||
        item.name.includes("iPad") ||
        item.name.includes("iPod")
    )
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 10);

  iosDevicesChart.setOption({
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "value"
    },
    yAxis: {
      type: "category",
      data: iosDevices.map((item: any) => item.name)
    },
    series: [
      {
        name: "访问人数",
        type: "bar",
        data: iosDevices.map((item: any) => item.value)
      }
    ]
  });
};

// 渲染Android设备图表
const renderAndroidDevicesChart = () => {
  if (!androidDevicesChart) return;

  const data = getDataByUserType(chartUserTypes.androidDevices, "devices");
  if (!data) return;

  const androidDevices = data
    .filter(
      (item: any) =>
        !item.name.includes("iPhone") &&
        !item.name.includes("iPad") &&
        !item.name.includes("iPod")
    )
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 10);

  androidDevicesChart.setOption({
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "value"
    },
    yAxis: {
      type: "category",
      data: androidDevices.map((item: any) => item.name)
    },
    series: [
      {
        name: "访问人数",
        type: "bar",
        data: androidDevices.map((item: any) => item.value)
      }
    ]
  });
};

// 渲染图表
const renderCharts = () => {
  if (!portraitData.value) return;

  renderProvinceChart();
  renderCityChart();
  renderGenderChart();
  renderPlatformChart();
  renderAgeChart();
  renderIosDevicesChart();
  renderAndroidDevicesChart();
};

onMounted(() => {
  // 设置默认日期范围为最近7天
  const endDay = dayjs().subtract(1, "day");
  const startDay = endDay.subtract(6, "day");

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
          <div class="chart-header">
            <div class="chart-title">省份分布</div>
            <el-select
              v-model="chartUserTypes.province"
              class="user-type-select"
              @change="value => handleUserTypeChange('province', value)"
            >
              <el-option
                v-for="option in userTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div class="chart-scroll-container">
            <div ref="provinceChartRef" class="chart-container" />
          </div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>

      <!-- 城市分布柱状图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <div class="chart-title">城市分布</div>
            <el-select
              v-model="chartUserTypes.city"
              class="user-type-select"
              @change="value => handleUserTypeChange('city', value)"
            >
              <el-option
                v-for="option in userTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div class="chart-scroll-container">
            <div ref="cityChartRef" class="chart-container" />
          </div>
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>

      <!-- 性别分布饼图 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <div class="chart-title">性别分布</div>
            <el-select
              v-model="chartUserTypes.gender"
              class="user-type-select"
              @change="value => handleUserTypeChange('gender', value)"
            >
              <el-option
                v-for="option in userTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div ref="genderChartRef" class="chart-container" />
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>

      <!-- 平台分布饼图 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <div class="chart-title">平台分布</div>
            <el-select
              v-model="chartUserTypes.platform"
              class="user-type-select"
              @change="value => handleUserTypeChange('platform', value)"
            >
              <el-option
                v-for="option in userTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div ref="platformChartRef" class="chart-container" />
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>

      <!-- 年龄分布饼图 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <div class="chart-title">年龄分布</div>
            <el-select
              v-model="chartUserTypes.age"
              class="user-type-select"
              @change="value => handleUserTypeChange('age', value)"
            >
              <el-option
                v-for="option in userTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div ref="ageChartRef" class="chart-container" />
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>

      <!-- iOS设备Top10榜单 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <div class="chart-title">iOS平台机型Top10</div>
            <el-select
              v-model="chartUserTypes.iosDevices"
              class="user-type-select"
              @change="value => handleUserTypeChange('iosDevices', value)"
            >
              <el-option
                v-for="option in userTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div ref="iosDevicesChartRef" class="chart-container" />
          <div v-if="!portraitData" class="no-data">暂无数据</div>
        </el-card>
      </el-col>

      <!-- Android设备Top10榜单 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <div class="chart-title">Android平台机型Top10</div>
            <el-select
              v-model="chartUserTypes.androidDevices"
              class="user-type-select"
              @change="value => handleUserTypeChange('androidDevices', value)"
            >
              <el-option
                v-for="option in userTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div ref="androidDevicesChartRef" class="chart-container" />
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
  align-items: center;
  justify-content: space-between;
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
  position: relative;
  margin-bottom: 20px;
  overflow: hidden;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 6px 16px rgb(0 0 0 / 10%);
  transform: translateY(-2px);
}

.chart-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  content: "";
  background: linear-gradient(
    90deg,
    var(--el-color-primary),
    var(--el-color-success)
  );
  opacity: 0.8;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.user-type-select {
  width: 100px;
}

.chart-scroll-container {
  overflow: auto hidden;
}

.chart-container {
  min-width: 100%;
  height: 300px;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
