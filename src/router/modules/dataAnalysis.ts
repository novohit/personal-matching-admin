export default {
  "name": "",
  "path": "/analysis",
  "meta": {
    "title": "数据分析",
    "icon": "ep:histogram",
    "showParent": true,
    "auths": [
      ""
    ],
    "rank": 5
  },
  "children": [
    {
      "name": "UserPortrait",
      "path": "/analysis/userPortrait",
      "component": import("@/views/analysis/userPortrait/index.vue"),
      "meta": {
        "title": "画像洞察",
        "showParent": true,
        "auths": [
          "system:user:list"
        ]
      }
    }
  ]
} as RouteConfigsTable;

