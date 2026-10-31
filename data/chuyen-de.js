// ===== KHOA CHUYEN DE =====
// Cau truc: khoa -> phan (vd: Phan co ban) -> chu de -> bai.
// Moi bai: ten (tieu de), tu (chu Han cach nhau dau cach), on_tap (duong link on tap rieng, neu co).
// Bai chua co noi dung: de {} – app se hien "Dang cap nhat".
// Tu chua co trong bang tu thi them vao data/bo-sung.js (va gan nhan trong data/nhan.js).
window.HSK_COURSES = [
  {
    id: 'tm', ten: 'Tiếng Trung thương mại', zh: '商务汉语', icon: 'tm',
    mo_ta: 'Tiếng Trung dùng trong mua bán, giao dịch và làm việc với khách hàng.',
    phan: [
      {
        ten: 'Phần cơ bản',
        chu_de: [
          {
            ten: 'Con số và thời gian',
            bai: [
              {
                ten: 'Tổng cộng bao nhiêu tiền?',
                tu: '价格 便宜 贵 打折 现金 刷卡 扫码 支付 付款 大概 发票 需要 笔记本电脑 顾客 老板 总共 一共 批',
                on_tap: 'https://tangerine-malasada-023816.netlify.app/'
              },
              {},
              {}
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'cx', ten: 'Tiếng Trung công xưởng', zh: '工厂汉语', icon: 'cx',
    mo_ta: 'Tiếng Trung dùng hằng ngày trong nhà máy: bộ phận, dây chuyền, kho và an toàn.',
    phan: [
      {
        ten: 'Phần cơ bản',
        chu_de: [
          {
            ten: 'Cơ cấu nhà máy và chức năng các bộ phận',
            bai: [
              {
                ten: 'Các bộ phận trong nhà máy',
                tu: '总经理 厂长 车间主任 组长 领班 员工 部门 采购部 生产部 品质部 仓库 物流部 工程部 项目部 人事部 合作 负责 汇报 上级 下级 沟通 管理',
                on_tap: 'https://resplendent-llama-7bb513.netlify.app/'
              },
              {},
              {}
            ]
          }
        ]
      }
    ]
  }
];
