<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import locale from "ant-design-vue/es/date-picker/locale/zh_CN";
import * as echarts from "echarts";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import {
  getPageVisitData,
  getUserVisitTrendData,
  getUserSummaryData,
  getUserRetainTrendData,
  getUserAccessDistributionData,
  getPolicyAll,
  getPolicyRound
} from "@/api/common/data";
import type { Dayjs } from "dayjs";

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

interface AccessDistributionItem {
  key: number;
  value: number;
}

interface AccessDistributionData {
  index: string;
  item_list: AccessDistributionItem[];
}

interface AccessDistributionResponse {
  ref_date: string;
  list: AccessDistributionData[];
}

defineOptions({
  name: "Welcome"
});

// 工具函数 - 格式化日期为YYYYMMDD
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// 工具函数 - 格式化YYYYMMDD为显示格式
const formatStringToDisplay = (dateStr: string): string => {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const d = new Date(`${year}-${month}-${day}`);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
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
const yesterdayDate = ref<string>("");
// 当前日期（时间戳）
const currentDate = ref<number>(0);
// 格式化日期（显示用）
const formattedDate = ref<string>("");
// 当前指标
const activeMetric = ref<string>("page_visit_uv");
// 指标标签
const metricLabels = {
  page_visit_uv: "访问人数",
  page_visit_pv: "访问次数",
  page_staytime_pv: "次均停留时长",
  entrypage_pv: "进入页次数",
  exitpage_pv: "退出页次数",
  page_share_pv: "转发次数",
  page_share_uv: "转发人数"
};

// 趋势数据相关
const trendData = ref<TrendDataItem[]>([]);
const activeTimeType = ref<string>("day");
// 组件用的日期
const selectedDate = ref<Dayjs | null>(null);
// 发后端用的日期
const backendDate = ref<string>("");
// 访问数据概况
const summaryData = ref<SummaryDataItem[]>([]);
const summaryLoading = ref<boolean>(false);
const summaryDate = ref<Dayjs | null>(null);

// 留存数据相关
const retainData = ref<RetainDataItem | null>(null);
const activeRetainTimeType = ref<string>("day");
const selectedRetainDate = ref<Dayjs | null>(null);
const backendRetainDate = ref<string>("");
const retainLoading = ref<boolean>(false);
const retainChartRef = ref<HTMLElement | null>(null);
let retainChart: echarts.ECharts | null = null;

// 访问分布数据相关
const distributionData = ref<AccessDistributionResponse | null>(null);
const activeDistributionType = ref<string>("access_source_session_cnt");
const selectedDistributionDate = ref<Dayjs | null>(null);
const backendDistributionDate = ref<string>("");
const distributionLoading = ref<boolean>(false);
const distributionChartRef = ref<HTMLElement | null>(null);
let distributionChart: echarts.ECharts | null = null;

// 找政策相关数据
const policyData = ref<any[]>([]);
const policyRoundData = ref<any[]>([]);

// 获取趋势数据的通用处理函数
const handleTrendResponse = (response: any): void => {
  if (response.code === 0) {
    trendData.value = response.data.list;
  }
};

// 获取日趋势
const fetchDailyTrendData = async (date: string): Promise<void> => {
  try {
    const response = await getUserVisitTrendData("daily", date);
    handleTrendResponse(response);
  } catch (error) {
    console.error("获取日趋势数据失败:", error);
  }
};

// 获取周趋势
const fetchWeeklyTrendData = async (date: string): Promise<void> => {
  try {
    const [startDate, endDate] = date.split("-");
    const response = await getUserVisitTrendData("weekly", startDate, endDate);
    handleTrendResponse(response);
  } catch (error) {
    console.error("获取周趋势数据失败:", error);
  }
};

// 获取月趋势
const fetchMonthlyTrendData = async (date: string): Promise<void> => {
  try {
    const [startDate, endDate] = date.split("-");
    const response = await getUserVisitTrendData("monthly", startDate, endDate);
    handleTrendResponse(response);
  } catch (error) {
    console.error("获取月趋势数据失败:", error);
  }
};

// 根据时间类型获取趋势数据
const fetchTrendData = (type: string, date: string): void => {
  if (!date) return;
  if (type === "day") {
    fetchDailyTrendData(date);
  } else if (type === "week") {
    fetchWeeklyTrendData(date);
  } else if (type === "month") {
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

  if (type === "day") {
    const yesterday = getDateWithOffset(today, -1);
    selectedDate.value = dayjs(yesterday);
    backendDate.value = formatDateToString(yesterday);
  } else if (type === "week") {
    // 获取当前周的上一周的周一到周日
    const lastWeek = getDateWithOffset(today, -7);
    const monday = new Date(lastWeek);
    monday.setDate(lastWeek.getDate() - monday.getDay() + 1);
    const sunday = getDateWithOffset(monday, 6);

    selectedDate.value = dayjs(monday);
    backendDate.value = `${formatDateToString(monday)}-${formatDateToString(
      sunday
    )}`;
  } else if (type === "month") {
    // 获取上个月的1号到最后一号
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const firstDayOfMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0
    );

    selectedDate.value = dayjs(firstDayOfMonth);
    backendDate.value = `${formatDateToString(
      firstDayOfMonth
    )}-${formatDateToString(lastDayOfMonth)}`;
  }

  fetchTrendData(activeTimeType.value, backendDate.value);
};

// 日期选择器变化事件
const handleDateChange = (date: Dayjs): void => {
  selectedDate.value = date;

  if (activeTimeType.value === "day") {
    backendDate.value = date.format("YYYYMMDD");
    fetchTrendData(activeTimeType.value, backendDate.value);
  } else if (activeTimeType.value === "week") {
    const monday = date.startOf("week").add(1, "day");
    const sunday = date.endOf("week").add(1, "day");
    backendDate.value = `${monday.format("YYYYMMDD")}-${sunday.format(
      "YYYYMMDD"
    )}`;
    fetchTrendData(activeTimeType.value, backendDate.value);
  } else if (activeTimeType.value === "month") {
    const firstDay = date.startOf("month");
    const lastDay = date.endOf("month");
    backendDate.value = `${firstDay.format("YYYYMMDD")}-${lastDay.format(
      "YYYYMMDD"
    )}`;
    fetchTrendData(activeTimeType.value, backendDate.value);
  }
};

// 禁用日期选择（不能选择今天及以后的日期）
const disabledDate = (current: Dayjs): boolean => {
  if (activeTimeType.value === "day") {
    return current && current > dayjs().startOf("day");
  } else if (activeTimeType.value === "week") {
    return current && current > dayjs().startOf("week");
  } else if (activeTimeType.value === "month") {
    return current && current > dayjs().startOf("month").subtract(1, "day");
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
    console.error("获取页面访问数据失败:", error);
  }
};

// 切换指标
const switchMetric = (metric: string): void => {
  activeMetric.value = metric;
};

// 计算百分比
const calculatePercentage = (value: number): number => {
  if (value === 0) return 0;
  const max = getMaxMetricValue();
  return Math.round((value / max) * 100);
};

// 计算排序后的页面访问数据（前10条）
const sortedPageVisitData = computed((): PageVisitItem[] => {
  if (pageVisitData.value.length === 0) return [];

  // 按当前指标值从大到小排序，并只取前10条
  return [...pageVisitData.value]
    .sort((a, b) => (b[activeMetric.value] || 0) - (a[activeMetric.value] || 0))
    .slice(0, 10);
});

// 计算最大值，用于进度条百分比计算（使用排序后的数据）
const getMaxMetricValue = (): number => {
  if (sortedPageVisitData.value.length === 0) return 1;
  return Math.max(
    ...sortedPageVisitData.value.map(item => item[activeMetric.value])
  );
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
    const response = await getUserSummaryData(dayjs(date).format("YYYYMMDD"));
    if (response.code === 0) {
      summaryData.value = response.data.list;
    }
  } catch (error) {
    console.error("获取访问数据概况失败:", error);
  } finally {
    summaryLoading.value = false;
  }
};

// 日期选择器变化事件 - 概况数据
const handleSummaryDateChange = (date: Dayjs): void => {
  summaryDate.value = date;
  fetchSummaryData(date.format("YYYYMMDD"));
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
    const response = await getUserRetainTrendData("daily", beginDate);
    handleRetainResponse(response);
  } catch (error) {
    console.error("获取日留存数据失败:", error);
  } finally {
    retainLoading.value = false;
  }
};

// 获取周留存
const fetchWeeklyRetainData = async (
  beginDate: string,
  endDate: string
): Promise<void> => {
  try {
    retainLoading.value = true;
    const response = await getUserRetainTrendData("weekly", beginDate, endDate);
    handleRetainResponse(response);
  } catch (error) {
    console.error("获取周留存数据失败:", error);
  } finally {
    retainLoading.value = false;
  }
};

// 获取月留存
const fetchMonthlyRetainData = async (
  beginDate: string,
  endDate: string
): Promise<void> => {
  try {
    retainLoading.value = true;
    const response = await getUserRetainTrendData(
      "monthly",
      beginDate,
      endDate
    );
    handleRetainResponse(response);
  } catch (error) {
    console.error("获取月留存数据失败:", error);
  } finally {
    retainLoading.value = false;
  }
};

// 根据时间类型获取留存数据
const fetchRetainData = (type: string, date: string): void => {
  if (type === "day") {
    fetchDailyRetainData(date);
  } else if (type === "week") {
    const [startDate, endDate] = date.split("-");
    fetchWeeklyRetainData(startDate, endDate);
  } else if (type === "month") {
    const [startDate, endDate] = date.split("-");
    fetchMonthlyRetainData(startDate, endDate);
  }
};

const fetchPolicyData = async (): Promise<void> => {
  const response = await getPolicyAll();
  if (response.code === 0) {
    policyData.value = response.data;
  }
  const responseRound = await getPolicyRound();
  if (responseRound.code === 0) {
    policyRoundData.value = responseRound.data;
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

  if (type === "day") {
    const yesterday = getDateWithOffset(today, -1);
    selectedRetainDate.value = dayjs(yesterday);
    backendRetainDate.value = formatDateToString(yesterday);
  } else if (type === "week") {
    // 获取当前周的上一周的周一到周日
    const lastWeek = getDateWithOffset(today, -7);
    const monday = new Date(lastWeek);
    monday.setDate(lastWeek.getDate() - monday.getDay() + 1);
    const sunday = getDateWithOffset(monday, 6);

    selectedRetainDate.value = dayjs(monday);
    backendRetainDate.value = `${formatDateToString(
      monday
    )}-${formatDateToString(sunday)}`;
  } else if (type === "month") {
    // 获取上个月的1号
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const firstDayOfMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0
    );

    selectedRetainDate.value = dayjs(firstDayOfMonth);
    backendRetainDate.value = `${formatDateToString(
      firstDayOfMonth
    )}-${formatDateToString(lastDayOfMonth)}`;
  }
  fetchRetainData(activeRetainTimeType.value, backendRetainDate.value);
};

// 留存日期选择器变化事件
const handleRetainDateChange = (date: Dayjs): void => {
  selectedRetainDate.value = date;

  if (activeRetainTimeType.value === "day") {
    backendRetainDate.value = date.format("YYYYMMDD");
    fetchRetainData(activeRetainTimeType.value, backendRetainDate.value);
  } else if (activeRetainTimeType.value === "week") {
    const monday = date.startOf("week").add(1, "day");
    const sunday = date.endOf("week").add(1, "day");
    backendRetainDate.value = `${monday.format("YYYYMMDD")}-${sunday.format(
      "YYYYMMDD"
    )}`;
    fetchRetainData(activeRetainTimeType.value, backendRetainDate.value);
  } else if (activeRetainTimeType.value === "month") {
    const firstDay = date.startOf("month");
    const lastDay = date.endOf("month");
    backendRetainDate.value = `${firstDay.format("YYYYMMDD")}-${lastDay.format(
      "YYYYMMDD"
    )}`;
    fetchRetainData(activeRetainTimeType.value, backendRetainDate.value);
  }
};

// 初始化留存图表
const initRetainChart = (): void => {
  if (retainChartRef.value) {
    retainChart = echarts.init(retainChartRef.value);
    window.addEventListener("resize", () => {
      retainChart?.resize();
    });
  }
};

// 获取留存标签
const getRetainLabels = (timeType: string, key: number): string => {
  if (timeType === "day") {
    if (key === 0) return "当天";
    if (key === 1) return "次日";
    if (key <= 7) return `${key}天后`;
    if (key === 14) return "14天后";
    if (key === 30) return "30天后";
    return `${key}天后`;
  } else if (timeType === "week") {
    if (key === 0) return "当周";
    if (key === 1) return "1周后";
    if (key === 2) return "2周后";
    if (key === 3) return "3周后";
    if (key === 4) return "4周后";
    return `${key}周后`;
  } else if (timeType === "month") {
    if (key === 0) return "当月";
    if (key === 1) return "1月后";
    return `${key}月后`;
  }
  return `${key}`;
};

// 渲染留存图表
const renderRetainChart = (): void => {
  if (!retainChart || !retainData.value) return;

  // 获取留存天数标签 - 使用动态标签函数
  const dayLabels = retainData.value.visit_uv_new.map(item =>
    getRetainLabels(activeRetainTimeType.value, item.key)
  );

  // 获取新增用户留存率数据
  const newRetainRates = retainData.value.visit_uv_new.map((item, index) => {
    if (index === 0) return 100; // 当天留存率为100%
    const baseValue = retainData.value!.visit_uv_new[0].value;
    return baseValue > 0 ? ((item.value / baseValue) * 100).toFixed(2) : 0;
  });

  // 获取活跃用户留存率数据
  const activeRetainRates = retainData.value.visit_uv.map((item, index) => {
    if (index === 0) return 100; // 当天留存率为100%
    const baseValue = retainData.value!.visit_uv[0].value;
    return baseValue > 0 ? ((item.value / baseValue) * 100).toFixed(2) : 0;
  });

  retainChart.setOption({
    title: {
      text: "用户留存率",
      left: "center",
      top: 0
    },
    tooltip: {
      trigger: "axis",
      formatter: function (params: any) {
        const newUserParam = params[0];
        const activeUserParam = params[1];
        return `${newUserParam.name}<br/>${newUserParam.seriesName}: ${newUserParam.value}%<br/>${activeUserParam.seriesName}: ${activeUserParam.value}%`;
      }
    },
    legend: {
      data: ["新增用户留存率", "活跃用户留存率"],
      top: 30
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: dayLabels
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "{value}%"
      }
    },
    series: [
      {
        name: "新增用户留存率",
        type: "line",
        data: newRetainRates,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: {
          color: "#409EFF"
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: "活跃用户留存率",
        type: "line",
        data: activeRetainRates,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: {
          color: "#67C23A"
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  });
};

// 获取访问分布数据
const fetchDistributionData = async (date: string): Promise<void> => {
  try {
    distributionLoading.value = true;
    const response = await getUserAccessDistributionData(date);
    if (response.code === 0) {
      distributionData.value = response.data;
      renderDistributionChart();
    }
  } catch (error) {
    console.error("获取访问分布数据失败:", error);
  } finally {
    distributionLoading.value = false;
  }
};

// 切换分布类型
const switchDistributionType = (type: string): void => {
  activeDistributionType.value = type;
  renderDistributionChart();
};

// 分布日期选择器变化事件
const handleDistributionDateChange = (date: Dayjs): void => {
  selectedDistributionDate.value = date;
  backendDistributionDate.value = date.format("YYYYMMDD");
  fetchDistributionData(backendDistributionDate.value);
};

// 初始化分布图表
const initDistributionChart = (): void => {
  if (distributionChartRef.value) {
    distributionChart = echarts.init(distributionChartRef.value);
    window.addEventListener("resize", () => {
      distributionChart?.resize();
    });
  }
};

// 获取分布类型标签
const getDistributionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    access_source_session_cnt: "访问来源分布",
    access_staytime_info: "访问时长分布",
    access_depth_info: "访问深度分布",
    access_source_visit_uv: "访问人数分布"
  };
  return labels[type] || type;
};

// 获取分布数据标签
const getDistributionLabels = (type: string, key: number): string => {
  if (type === "access_source_session_cnt") {
    const sourceLabels: Record<number, string> = {
      1: "小程序历史列表",
      2: "搜索",
      3: "会话",
      4: "扫一扫二维码",
      5: "公众号资料页",
      6: "聊天顶部",
      7: "系统桌面",
      8: "小程序主页",
      9: "附近的小程序",
      10: "其他",
      11: "模板消息",
      12: "客服消息",
      13: "公众号菜单",
      14: "APP分享",
      15: "支付完成页",
      16: "长按识别二维码",
      17: "相册选取二维码",
      18: "公众号文章",
      19: "钱包",
      20: "卡包",
      21: "小程序内卡券",
      22: "其他小程序",
      23: "其他小程序返回",
      24: "卡券适用门店列表",
      25: "搜索框快捷入口",
      26: "小程序客服消息",
      27: "公众号下发",
      28: "系统会话菜单",
      29: "任务栏-最近使用",
      30: "长按小程序菜单圆点",
      31: "连wifi成功页",
      32: "城市服务",
      33: "微信广告",
      34: "其他移动应用",
      35: "发现入口-我的小程序",
      36: "任务栏-我的小程序",
      37: "微信圈子",
      38: "手机充值",
      39: "H5",
      40: "插件",
      41: "大家在用",
      42: "发现页",
      43: "浮窗",
      44: "附近的人",
      45: "看一看",
      46: "朋友圈",
      47: "企业微信",
      48: "视频",
      49: "收藏",
      50: "微信红包",
      51: "微信游戏中心",
      52: "摇一摇",
      53: "公众号导购消息",
      54: "识物",
      55: "小程序订单",
      56: "小程序直播",
      57: "群工具"
    };
    return sourceLabels[key] || `来源${key}`;
  } else if (type === "access_staytime_info") {
    const timeLabels: Record<number, string> = {
      1: "0-2s",
      2: "3-5s",
      3: "6-10s",
      4: "11-20s",
      5: "20-30s",
      6: "30-50s",
      7: "50-100s",
      8: ">100s"
    };
    return timeLabels[key] || `${key}段`;
  } else if (type === "access_depth_info") {
    const depthLabels: Record<number, string> = {
      1: "1页",
      2: "2页",
      3: "3页",
      4: "4页",
      5: "5页",
      6: "6-10页",
      7: ">10页"
    };
    return depthLabels[key] || `${key}页`;
  } else if (type === "access_source_visit_uv") {
    const sourceLabels: Record<number, string> = {
      1: "小程序历史列表",
      2: "搜索",
      3: "会话",
      4: "扫一扫二维码",
      5: "公众号资料页",
      6: "聊天顶部",
      7: "系统桌面",
      8: "小程序主页",
      9: "附近的小程序",
      10: "其他",
      11: "模板消息",
      12: "客服消息",
      13: "公众号菜单",
      14: "APP分享",
      15: "支付完成页",
      16: "长按识别二维码",
      17: "相册选取二维码",
      18: "公众号文章",
      19: "钱包",
      20: "卡包",
      21: "小程序内卡券",
      22: "其他小程序",
      23: "其他小程序返回",
      24: "卡券适用门店列表",
      25: "搜索框快捷入口",
      26: "小程序客服消息",
      27: "公众号下发",
      28: "系统会话菜单",
      29: "任务栏-最近使用",
      30: "长按小程序菜单圆点",
      31: "连wifi成功页",
      32: "城市服务",
      33: "微信广告",
      34: "其他移动应用",
      35: "发现入口-我的小程序",
      36: "任务栏-我的小程序",
      37: "微信圈子",
      38: "手机充值",
      39: "H5",
      40: "插件",
      41: "大家在用",
      42: "发现页",
      43: "浮窗",
      44: "附近的人",
      45: "看一看",
      46: "朋友圈",
      47: "企业微信",
      48: "视频",
      49: "收藏",
      50: "微信红包",
      51: "微信游戏中心",
      52: "摇一摇",
      53: "公众号导购消息",
      54: "识物",
      55: "小程序订单",
      56: "小程序直播",
      57: "群工具"
    };
    return sourceLabels[key] || `来源${key}`;
  }
};

// 渲染分布图表
const renderDistributionChart = (): void => {
  if (!distributionChart || !distributionData.value) return;

  const currentData = distributionData.value.list.find(
    item => item.index === activeDistributionType.value
  );
  if (!currentData) return;

  const labels = currentData.item_list.map(item =>
    getDistributionLabels(activeDistributionType.value, item.key)
  );
  const values = currentData.item_list.map(item => item.value);
  const total = values.reduce((sum, value) => sum + value, 0);

  // 按数值降序排序，并只取前10条
  const sortedData = currentData.item_list
    .map((item, index) => ({
      name: labels[index],
      value: item.value,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(2) : "0"
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  distributionChart.setOption({
    title: {
      text: getDistributionTypeLabel(activeDistributionType.value),
      left: "center",
      top: 0
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      formatter: function (params: any) {
        const item = params[0];
        return `${item.name}<br/>数量: ${item.value}<br/>占比: ${item.data.percentage}%`;
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: "value",
      axisLabel: {
        formatter: "{value}"
      }
    },
    yAxis: {
      type: "category",
      data: sortedData.map(item => item.name),
      axisLabel: {
        formatter: function (value: string) {
          if (value.length > 8) {
            return value.substring(0, 8) + "...";
          }
          return value;
        }
      }
    },
    series: [
      {
        name: getDistributionTypeLabel(activeDistributionType.value),
        type: "bar",
        data: sortedData.map((item, index) => ({
          value: item.value,
          percentage: item.percentage,
          itemStyle: {
            color: `hsl(${(index * 45) % 360}, 70%, 60%)`
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        },
        label: {
          show: true,
          position: "right",
          formatter: function (params: any) {
            return `${params.data.percentage}%`;
          },
          color: "#606266",
          fontSize: 12
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
  fetchTrendData("day", backendDate.value);

  // 获取访问数据概况
  summaryDate.value = dayjs(yesterday);
  fetchSummaryData(yesterdayDate.value);
  // 初始化留存图表
  initRetainChart();
  // 初始化访问分布图表
  initDistributionChart();
  // 初始化留存数据
  selectedRetainDate.value = dayjs(yesterday);
  backendRetainDate.value = formatDateToString(yesterday);
  fetchRetainData("day", backendRetainDate.value);

  // 获取找政策相关数据
  fetchPolicyData();
  getPolicyAll;

  // 初始化访问分布数据
  selectedDistributionDate.value = dayjs(yesterday);
  backendDistributionDate.value = formatDateToString(yesterday);
  fetchDistributionData(backendDistributionDate.value);
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
          <el-card
            class="retain-card"
            v-loading="retainLoading"
            element-loading-text="加载中..."
          >
            <div class="retain-header">
              <div class="retain-title-wrapper">
                <h3 class="retain-title">用户留存数据</h3>
                <div class="retain-subtitle">微信小程序用户留存分析</div>
              </div>
            </div>

            <div class="retain-tabs">
              <div
                class="retain-tab"
                :class="{ active: activeRetainTimeType === 'day' }"
                @click="switchRetainTimeType('day')"
              >
                日
              </div>
              <div
                class="retain-tab"
                :class="{ active: activeRetainTimeType === 'week' }"
                @click="switchRetainTimeType('week')"
              >
                周
              </div>
              <div
                class="retain-tab"
                :class="{ active: activeRetainTimeType === 'month' }"
                @click="switchRetainTimeType('month')"
              >
                月
              </div>

              <div class="retain-date-picker">
                <a-date-picker
                  :locale="locale"
                  v-if="activeRetainTimeType === 'day'"
                  :value="selectedRetainDate"
                  :disabled-date="disabledDate"
                  @change="handleRetainDateChange"
                />
                <a-date-picker
                  :locale="locale"
                  v-if="activeRetainTimeType === 'week'"
                  picker="week"
                  :value="selectedRetainDate"
                  :disabled-date="disabledDate"
                  @change="handleRetainDateChange"
                />
                <a-date-picker
                  :locale="locale"
                  v-if="activeRetainTimeType === 'month'"
                  picker="month"
                  :value="selectedRetainDate"
                  :disabled-date="disabledDate"
                  @change="handleRetainDateChange"
                />
              </div>
            </div>

            <div class="retain-chart-container">
              <div ref="retainChartRef" class="retain-chart" />
            </div>

            <div v-if="!retainData" class="retain-empty">暂无数据</div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card
            class="summary-card"
            v-loading="summaryLoading"
            element-loading-text="加载中..."
          >
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
                  <div class="summary-value">
                    {{ summaryData[0].visit_total }}
                  </div>
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
              <div v-else-if="!summaryLoading" class="summary-empty">
                暂无数据
              </div>
            </div>
          </el-card>
          <el-card
            class="summary-card"
            v-loading="summaryLoading"
            element-loading-text="加载中..."
          >
            <div class="summary-header">
              <div class="summary-title-wrapper">
                <h3 class="summary-title">找政策</h3>
              </div>
            </div>
            <div class="summary-content">
              <div v-if="summaryData.length > 0" class="summary-items">
                <div class="summary-item">
                  <div class="summary-value">
                    {{ policyData.totalElements }}
                  </div>
                  <div class="summary-label">总会话数</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">{{ policyRoundData }}</div>
                  <div class="summary-label">对话轮数</div>
                </div>
              </div>
              <div v-else-if="!summaryLoading" class="summary-empty">
                暂无数据
              </div>
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
              <div
                class="trend-tab"
                :class="{ active: activeTimeType === 'day' }"
                @click="switchTimeType('day')"
              >
                日
              </div>
              <div
                class="trend-tab"
                :class="{ active: activeTimeType === 'week' }"
                @click="switchTimeType('week')"
              >
                周
              </div>
              <div
                class="trend-tab"
                :class="{ active: activeTimeType === 'month' }"
                @click="switchTimeType('month')"
              >
                月
              </div>

              <div class="trend-date-picker">
                <a-date-picker
                  :locale="locale"
                  v-if="activeTimeType === 'day'"
                  :value="selectedDate"
                  :disabled-date="disabledDate"
                  @change="handleDateChange"
                />
                <a-date-picker
                  :locale="locale"
                  v-if="activeTimeType === 'week'"
                  picker="week"
                  :value="selectedDate"
                  :disabled-date="disabledDate"
                  @change="handleDateChange"
                />
                <a-date-picker
                  :locale="locale"
                  v-if="activeTimeType === 'month'"
                  picker="month"
                  :value="selectedDate"
                  :disabled-date="disabledDate"
                  @change="handleDateChange"
                />
              </div>
            </div>

            <div class="trend-data" v-if="trendData.length > 0">
              <div class="trend-data-item">
                <div class="trend-data-label">时间范围</div>
                <div class="trend-data-value">{{ trendData[0].ref_date }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">会话数</div>
                <div class="trend-data-value">
                  {{ trendData[0].session_cnt }}
                </div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">访问人数</div>
                <div class="trend-data-value">{{ trendData[0].visit_uv }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">新访问人数</div>
                <div class="trend-data-value">
                  {{ trendData[0].visit_uv_new }}
                </div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">页面浏览量</div>
                <div class="trend-data-value">{{ trendData[0].visit_pv }}</div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">次均停留时长(秒)</div>
                <div class="trend-data-value">
                  {{ trendData[0].stay_time_session?.toFixed(2) }}
                </div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">人均停留时长(秒)</div>
                <div class="trend-data-value">
                  {{ trendData[0].stay_time_uv?.toFixed(2) }}
                </div>
              </div>
              <div class="trend-data-item">
                <div class="trend-data-label">平均访问深度</div>
                <div class="trend-data-value">
                  {{ trendData[0].visit_depth?.toFixed(2) }}
                </div>
              </div>
            </div>

            <div v-else class="trend-empty">暂无数据</div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="page-visit-card">
            <div class="page-visit-header">
              <div class="page-visit-title-wrapper">
                <h3 class="page-visit-title">页面访问Top10</h3>
                <div class="page-visit-subtitle">
                  微信小程序页面访问数据分析
                </div>
              </div>
              <div class="page-visit-date">
                <el-button text class="date-nav-button" @click="previousDay">
                  <el-icon><arrow-left /></el-icon>
                </el-button>
                <span>{{ formattedDate }}</span>
                <el-button
                  text
                  class="date-nav-button"
                  @click="nextDay"
                  :disabled="isDisabled"
                >
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
              <el-tooltip
                v-for="(item, index) in sortedPageVisitData"
                :key="index"
                :content="item.page_path"
                placement="top"
                :show-after="600"
              >
                <div
                  class="page-visit-item"
                  :style="{ animationDelay: index * 0.05 + 's' }"
                >
                  <div class="page-visit-rank">{{ index + 1 }}</div>

                  <div class="page-visit-path">{{ item.page_path }}</div>

                  <div class="page-visit-progress-container">
                    <div
                      class="page-visit-progress"
                      :style="{
                        width: calculatePercentage(item[activeMetric]) + '%'
                      }"
                    />
                  </div>
                  <div class="page-visit-percentage">
                    {{ calculatePercentage(item[activeMetric]) }}%
                  </div>
                </div>
              </el-tooltip>
              <div
                v-if="sortedPageVisitData.length === 0"
                class="page-visit-empty"
              >
                暂无数据
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 访问分布分析卡片 -->
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card
            class="distribution-card"
            v-loading="distributionLoading"
            element-loading-text="加载中..."
          >
            <div class="distribution-header">
              <div class="distribution-title-wrapper">
                <h3 class="distribution-title">用户访问分布分析</h3>
                <div class="distribution-subtitle">
                  微信小程序用户行为分布数据洞察
                </div>
              </div>
              <div class="distribution-date-picker">
                <a-date-picker
                  :locale="locale"
                  :value="selectedDistributionDate"
                  :disabled-date="disabledDate"
                  @change="handleDistributionDateChange"
                />
              </div>
            </div>

            <div class="distribution-tabs">
              <div
                class="distribution-tab"
                :class="{
                  active: activeDistributionType === 'access_source_session_cnt'
                }"
                @click="switchDistributionType('access_source_session_cnt')"
              >
                访问来源
              </div>
              <div
                class="distribution-tab"
                :class="{
                  active: activeDistributionType === 'access_staytime_info'
                }"
                @click="switchDistributionType('access_staytime_info')"
              >
                访问时长
              </div>
              <div
                class="distribution-tab"
                :class="{
                  active: activeDistributionType === 'access_depth_info'
                }"
                @click="switchDistributionType('access_depth_info')"
              >
                访问深度
              </div>
              <div
                class="distribution-tab"
                :class="{
                  active: activeDistributionType === 'access_source_visit_uv'
                }"
                @click="switchDistributionType('access_source_visit_uv')"
              >
                访问人数
              </div>
            </div>

            <div class="distribution-chart-container">
              <div ref="distributionChartRef" class="distribution-chart" />
            </div>

            <div v-if="!distributionData" class="distribution-empty">
              暂无数据
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progress-stripes {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 16px 0;
  }
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
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  box-shadow: 0 6px 16px rgb(0 0 0 / 10%);
  transform: translateY(-2px);
}

/* 趋势面板样式 */
.trend-card {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.trend-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  content: "";
  background: linear-gradient(
    90deg,
    var(--el-color-primary),
    var(--el-color-warning)
  );
  opacity: 0.8;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 16px;
}

.trend-title-wrapper {
  display: flex;
  flex-direction: column;
}

.trend-title {
  position: relative;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.trend-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.trend-tabs {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.trend-tab {
  padding: 6px 16px;
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.trend-tab:hover {
  color: var(--el-color-primary);
  background-color: rgb(64 158 255 / 8%);
}

.trend-tab.active {
  color: white;
  background-color: var(--el-color-primary);
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
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.trend-data-item:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  transform: translateY(-2px);
}

.trend-data-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: #909399;
}

.trend-data-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.trend-empty {
  padding: 40px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

/* 原有样式 */
.page-visit-card {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.page-visit-card::before {
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

.page-visit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 16px;
}

.page-visit-title-wrapper {
  display: flex;
  flex-direction: column;
}

.page-visit-title {
  position: relative;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.page-visit-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.page-visit-date {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  background-color: #f5f7fa;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
}

.page-visit-date span {
  margin: 0 8px;
  font-size: 14px;
  color: #606266;
}

.page-visit-tabs {
  position: relative;
  display: flex;
  padding-bottom: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.page-visit-tab-label {
  padding: 0 4px;
  margin-right: 20px;
  font-weight: 600;
  color: #303133;
}

.page-visit-tab {
  padding: 4px 8px;
  margin-right: 18px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.page-visit-tab:hover {
  color: var(--el-color-primary);
  background-color: rgb(64 158 255 / 8%);
}

.page-visit-tab.active {
  position: relative;
  font-weight: 500;
  color: var(--el-color-primary);
  background-color: rgb(64 158 255 / 10%);
}

.page-visit-tab.active::after {
  position: absolute;
  bottom: -12px;
  left: 50%;
  width: 6px;
  height: 6px;
  content: "";
  background-color: var(--el-color-primary);
  border-radius: 50%;
  transform: translateX(-50%);
}

.page-visit-list {
  max-height: 400px;
  padding-right: 8px;
  margin-top: 16px;
  overflow-y: auto;
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

.page-visit-item:hover {
  background-color: #f5f7fa;
}

.page-visit-path {
  width: 200px;
  overflow: hidden;
  font-weight: 500;
  color: #303133;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.page-visit-item:hover .page-visit-path {
  color: var(--el-color-primary);
}

.page-visit-progress-container {
  flex: 1;
  height: 8px;
  margin: 0 16px;
  overflow: hidden;
  background-color: #ebeef5;
  border-radius: 4px;
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 5%);
}

.page-visit-progress {
  position: relative;
  height: 100%;
  background: linear-gradient(90deg, #67c23a, #95d475);
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

.page-visit-progress::after {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  content: "";
  background: linear-gradient(
    45deg,
    rgb(255 255 255 / 15%) 25%,
    transparent 25%,
    transparent 50%,
    rgb(255 255 255 / 15%) 50%,
    rgb(255 255 255 / 15%) 75%,
    transparent 75%
  );
  background-size: 16px 16px;
  animation: progress-stripes 1s linear infinite;
}

.page-visit-value {
  width: 40px;
  margin-right: 8px;
  font-weight: 600;
  color: #303133;
  text-align: right;
}

.page-visit-percentage {
  width: 50px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 500;
  color: #67c23a;
  text-align: center;
  background-color: rgb(103 194 58 / 10%);
  border-radius: 12px;
}

.date-nav-button {
  transition: transform 0.2s ease;
}

.date-nav-button:hover {
  transform: scale(1.2);
}

.page-visit-rank {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 12px;
  font-size: 12px;
  font-weight: bold;
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-radius: 50%;
}

.page-visit-item:nth-child(1) .page-visit-rank {
  color: #e6a23c;
  background-color: rgb(230 162 60 / 20%);
}

.page-visit-item:nth-child(2) .page-visit-rank {
  color: #909399;
  background-color: rgb(144 147 153 / 20%);
}

.page-visit-item:nth-child(3) .page-visit-rank {
  color: #67777f;
  background-color: rgb(103 119 127 / 20%);
}

.page-visit-empty {
  padding: 40px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

/* 访问数据概况样式 */
.summary-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  transition: all 0.3s ease;
}

.summary-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  content: "";
  background: linear-gradient(
    90deg,
    var(--el-color-success),
    var(--el-color-primary)
  );
  opacity: 0.8;
}

.summary-card:hover {
  box-shadow: 0 6px 16px rgb(0 0 0 / 10%);
  transform: translateY(-2px);
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 16px;
}

.summary-title-wrapper {
  display: flex;
  flex-direction: column;
}

.summary-title {
  position: relative;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.summary-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.summary-content {
  padding: 10px 0;
}

.summary-items {
  display: flex;
  justify-content: space-around;
}

.summary-item {
  padding: 20px;
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.summary-item:hover {
  background-color: #ecf5ff;
  box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
  transform: translateY(-5px);
}

.summary-value {
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.summary-label {
  font-size: 14px;
  color: #606266;
}

.summary-empty {
  padding: 40px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

.summary-date-picker {
  margin-left: auto;
}

/* 留存面板样式 */
.retain-card {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.retain-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  content: "";
  background: linear-gradient(
    90deg,
    var(--el-color-primary),
    var(--el-color-danger)
  );
  opacity: 0.8;
}

.retain-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 16px;
}

.retain-title-wrapper {
  display: flex;
  flex-direction: column;
}

.retain-title {
  position: relative;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.retain-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.retain-tabs {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.retain-tab {
  padding: 6px 16px;
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.retain-tab:hover {
  color: var(--el-color-primary);
  background-color: rgb(64 158 255 / 8%);
}

.retain-tab.active {
  color: white;
  background-color: var(--el-color-primary);
}

.retain-date-picker {
  margin-left: auto;
}

.retain-chart-container {
  display: flex;
  flex-direction: column;
}

.retain-chart {
  min-width: 100%;
  height: 300px;
  margin-bottom: 20px;
}

.retain-data-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 10px;
}

.retain-summary-item {
  width: calc(50% - 10px);
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.retain-summary-item:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  transform: translateY(-2px);
}

.retain-summary-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: #909399;
}

.retain-summary-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.retain-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 350px;
  padding: 40px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

/* 访问分布分析卡片样式 */
.distribution-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  transition: all 0.3s ease;
}

.distribution-card::before {
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

.distribution-card:hover {
  box-shadow: 0 6px 16px rgb(0 0 0 / 10%);
  transform: translateY(-2px);
}

.distribution-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 16px;
}

.distribution-title-wrapper {
  display: flex;
  flex-direction: column;
}

.distribution-title {
  position: relative;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.distribution-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.distribution-date-picker {
  margin-left: auto;
}

.distribution-tabs {
  position: relative;
  display: flex;
  padding-bottom: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.distribution-tab {
  padding: 6px 16px;
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.distribution-tab:hover {
  color: var(--el-color-primary);
  background-color: rgb(64 158 255 / 8%);
}

.distribution-tab.active {
  color: white;
  background-color: var(--el-color-primary);
}

.distribution-chart-container {
  display: flex;
  flex-direction: column;
}

.distribution-chart {
  min-width: 100%;
  height: 450px;
  margin-bottom: 20px;
}

.distribution-data-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 10px;
}

.distribution-summary-item {
  width: calc(50% - 10px);
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.distribution-summary-item:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  transform: translateY(-2px);
}

.distribution-summary-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: #909399;
}

.distribution-summary-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.distribution-description {
  padding: 10px 0;
}

.distribution-description-title {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
}

.distribution-description-content {
  font-size: 14px;
  color: #909399;
}

.distribution-empty {
  padding: 40px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style>
