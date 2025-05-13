<script setup lang="ts">
import { ref, onMounted } from "vue";
import * as echarts from "echarts";

defineOptions({
  name: "Welcome"
});

// 模拟数据
const mockVisitData = {
  dailyVisits: [
    { date: "2024-03-01", count: 1200 },
    { date: "2024-03-02", count: 1300 },
    { date: "2024-03-03", count: 1100 },
    { date: "2024-03-04", count: 1400 },
    { date: "2024-03-05", count: 1600 },
    { date: "2024-03-06", count: 1500 },
    { date: "2024-03-07", count: 1800 }
  ],
  sourceDistribution: [
    { value: 40, name: "直接访问" },
    { value: 30, name: "搜索引擎" },
    { value: 20, name: "社交媒体" },
    { value: 10, name: "其他来源" }
  ],
  currentVisits: 256,
  maxVisits: 1000
};

const trendChartRef = ref(null);
const sourceChartRef = ref(null);
const gaugeChartRef = ref(null);

const initTrendChart = () => {
  const chart = echarts.init(trendChartRef.value);
  chart.setOption({
    title: {
      text: "日访问量趋势"
    },
    tooltip: {
      trigger: "axis"
    },
    xAxis: {
      type: "category",
      data: mockVisitData.dailyVisits.map(item => item.date)
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        data: mockVisitData.dailyVisits.map(item => item.count),
        type: "line",
        smooth: true,
        areaStyle: {}
      }
    ]
  });
};

const initSourceChart = () => {
  const chart = echarts.init(sourceChartRef.value);
  chart.setOption({
    title: {
      text: "访问来源分布"
    },
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)"
    },
    series: [
      {
        name: "访问来源",
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: "outside"
        },
        data: mockVisitData.sourceDistribution
      }
    ]
  });
};

const initGaugeChart = () => {
  const chart = echarts.init(gaugeChartRef.value);
  chart.setOption({
    title: {
      text: "实时访问量"
    },
    series: [
      {
        type: "gauge",
        progress: {
          show: true,
          width: 18
        },
        axisLine: {
          lineStyle: {
            width: 18
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          length: 15,
          lineStyle: {
            width: 2,
            color: "#999"
          }
        },
        pointer: {
          icon: "path://M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
          length: "60%",
          width: 16,
          offsetCenter: [0, "5%"]
        },
        anchor: {
          show: true,
          size: 20,
          showAbove: true,
          itemStyle: {
            borderWidth: 15
          }
        },
        detail: {
          valueAnimation: true,
          fontSize: 30,
          offsetCenter: [0, "40%"]
        },
        data: [
          {
            value: mockVisitData.currentVisits,
            name: "当前访问量"
          }
        ],
        max: mockVisitData.maxVisits
      }
    ]
  });
};

onMounted(() => {
  initTrendChart();
  initSourceChart();
  initGaugeChart();
});
</script>

<template>
  <div class="welcome-container">
    <h1 class="welcome-title">精准医链</h1>

    <div class="dashboard-container">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card>
            <div ref="trendChartRef" style="height: 400px" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <div ref="sourceChartRef" style="height: 400px" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="8">
          <el-card>
            <div ref="gaugeChartRef" style="height: 300px" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  padding: 20px;
}

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
}
</style>
