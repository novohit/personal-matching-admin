import { http } from "@/utils/http";

// 获取访问页面数据
interface PageVisitItem {
  page_path: string;
  page_visit_pv: number;
  page_visit_uv: number;
  page_staytime_pv: number;
  entrypage_pv: number;
  exitpage_pv: number;
  page_share_pv: number;
  page_share_uv: number;
}

interface PageVisitResponse {
  ref_date: string;
  list: PageVisitItem[];
}
export const getPageVisitData = (date: string) => {
  return http.request<ResponseData<PageVisitResponse>>(
    "get",
    "/wechat/analysis/visit/page",
    { params: { date } }
  );
};

// 用户访问趋势
interface UserVisitTrendItem {
  ref_date: string;
  session_cnt: number;
  visit_pv: number;
  visit_uv: number;
  visit_uv_new: number;
  visit_depth: number;
}

interface UserVisitTrendResponse {
  ref_date: string;
  list: UserVisitTrendItem[];
}
// 获取用户访问趋势
export const getUserVisitTrendData = (
  type: string,
  beginDate: string,
  endDate: string | null = null
) => {
  if (type === "daily") {
    return http.request<ResponseData<UserVisitTrendResponse>>(
      "get",
      "/wechat/analysis/trend/daily",
      { params: { date: beginDate } }
    );
  } else if (type === "weekly") {
    return http.request<ResponseData<UserVisitTrendResponse>>(
      "get",
      "/wechat/analysis/trend/weekly",
      { params: { beginDate, endDate } }
    );
  } else if (type === "monthly") {
    return http.request<ResponseData<UserVisitTrendResponse>>(
      "get",
      "/wechat/analysis/trend/monthly",
      { params: { beginDate, endDate } }
    );
  }
};

// 获取用户画像
interface UserPortraitItem {
  ref_date: string;
  visit_uv_new: {
    province: {
      id: number;
      name: string;
      value: number;
    }[];
    city: {
      id: number;
      name: string;
      value: number;
    }[];
    genders: {
      id: number;
      name: string;
      value: number;
    }[];
    platforms: {
      id: number;
      name: string;
      value: number;
    }[];
    devices: {
      name: string;
      value: number;
    }[];
    ages: {
      id: number;
      name: string;
      value: number;
    }[];
  };
  visit_uv: {
    province: {
      id: number;
      name: string;
      value: number;
    }[];
    city: {
      id: number;
      name: string;
      value: number;
    }[];
    genders: {
      id: number;
      name: string;
      value: number;
    }[];
    platforms: {
      id: number;
      name: string;
      value: number;
    }[];
    devices: {
      name: string;
      value: number;
    }[];
    ages: {
      id: number;
      name: string;
      value: number;
    }[];
  };
}

export const getUserPortraitData = (beginDate: string, endDate: string) => {
  return http.request<ResponseData<UserPortraitItem>>(
    "get",
    "/wechat/analysis/user/portrait",
    { params: { beginDate, endDate } }
  );
};

// 获取用户访问小程序数据概况
interface UserSummaryItem {
  list: [
    {
      ref_date: string;
      visit_total: number;
      share_pv: number;
      share_uv: number;
    }
  ];
  errMsg: string;
}
export const getUserSummaryData = (date: string) => {
  return http.request<ResponseData<UserSummaryItem>>(
    "get",
    "/wechat/analysis/summary/daily",
    { params: { date } }
  );
};

// 用户留存趋势
interface UserRetainTrendResponse {
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
// 获取用户留存趋势
export const getUserRetainTrendData = (
  type: string,
  beginDate: string,
  endDate: string | null = null
) => {
  if (type === "daily") {
    return http.request<ResponseData<UserRetainTrendResponse>>(
      "get",
      `/wechat/analysis/retain/daily`,
      { params: { date: beginDate } }
    );
  } else if (type === "weekly") {
    return http.request<ResponseData<UserRetainTrendResponse>>(
      "get",
      `/wechat/analysis/retain/weekly`,
      { params: { beginDate, endDate } }
    );
  } else if (type === "monthly") {
    return http.request<ResponseData<UserRetainTrendResponse>>(
      "get",
      `/wechat/analysis/retain/monthly`,
      { params: { beginDate, endDate } }
    );
  }
};

// 获取用户小程序访问分布数据
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

export const getUserAccessDistributionData = (date: string) => {
  return http.request<ResponseData<AccessDistributionResponse>>(
    "get",
    `/wechat/analysis/visit/distribution`,
    { params: { date } }
  );
};

// 获取找政策所有会话数
export const getPolicyAll = () => {
  return http.request<ResponseData<any>>("get", `/policy/chats/all`);
};

// 获取找政策所有对话轮次
export const getPolicyRound = () => {
  return http.request<ResponseData<any>>("get", `/policy/chats/round`);
};
