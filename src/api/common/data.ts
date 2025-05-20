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
  return http.request<ResponseData<PageVisitResponse>>("get", "/wechat/analysis/visit/page", { params: { date } });
};

// 获取用户访问日趋势
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
export const getUserVisitTrendData = (date: string) => {
  return http.request<ResponseData<UserVisitTrendResponse>>("get", "/wechat/analysis/trend/daily", { params: { date } });
};


// 获取用户访问周趋势
export const getUserVisitWeekTrendData = (beginDate: string, endDate: string) => {
  return http.request<ResponseData<UserVisitTrendResponse>>("get", "/wechat/analysis/trend/weekly", { params: { beginDate, endDate } });
};

// 获取用户访问月趋势
export const getUserVisitMonthTrendData = (beginDate: string, endDate: string) => {
  return http.request<ResponseData<UserVisitTrendResponse>>("get", "/wechat/analysis/trend/monthly", { params: { beginDate, endDate } });
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
  }
}

export const getUserPortraitData = (beginDate: string, endDate: string) => {
  return http.request<ResponseData<UserPortraitItem>>("get", "/wechat/analysis/user/portrait", { params: { beginDate, endDate } });
};

