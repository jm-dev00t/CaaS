// 연구비 감사에 적용되는 규정 데이터 및 인터페이스 정의

export interface Regulation {
  id: string;
  article: string;
  title: string;
  category: string;
  keywords: string[];
  limitAmount?: number;
  limitType?: 'per_person' | 'per_event' | 'total';
  content: string;
}

export const REGULATIONS: Regulation[] = [
  // 회의비 (3개)
  { id: 'REG-01', article: '제3-2조', title: '회의비 집행 기준', category: '회의비',
    keywords: ['회의비', '식대', '회식', '간담회', '식사'],
    limitAmount: 30000, limitType: 'per_person',
    content: '연구과제 관련 회의 시 1인당 3만원 이내로 집행해야 하며, 참석자 명단이 증빙되어야 한다.' },
  { id: 'REG-02', article: '제3-3조', title: '회의비 주말·공휴일 집행 제한', category: '회의비',
    keywords: ['회의비', '식대', '회식', '주말', '공휴일'],
    content: '회의비는 평일 집행이 원칙이며, 주말·공휴일 집행 시 사유를 소명해야 한다.' },
  { id: 'REG-03', article: '제3-4조', title: '회의비 분할결제 금지', category: '회의비',
    keywords: ['회의비', '식대', '분할', '결제', '한도'],
    content: '집행 한도를 우회하기 위한 분할결제는 부정 집행으로 간주된다.' },

  // 국내여비 (3개)
  { id: 'REG-04', article: '제5-1조', title: '국내 출장 교통비 기준', category: '국내여비',
    keywords: ['국내여비', '출장', '교통비', '기차', 'KTX', '버스'],
    content: '국내 출장 교통비는 실비 기준이며, 항공 이용 시 사전 승인이 필요하다.' },
  { id: 'REG-05', article: '제5-2조', title: '국내 출장 숙박비 한도', category: '국내여비',
    keywords: ['국내여비', '숙박', '호텔', '숙소'],
    limitAmount: 80000, limitType: 'per_event',
    content: '국내 출장 숙박비는 1박 8만원 이내이며, 서울·경기는 10만원까지 인정된다.' },
  { id: 'REG-06', article: '제5-3조', title: '국내 출장 일비 기준', category: '국내여비',
    keywords: ['국내여비', '일비', '출장비'],
    limitAmount: 20000, limitType: 'per_event',
    content: '국내 출장 일비는 1일 2만원이며, 당일 출장 시 절반을 지급한다.' },

  // 전문가 활용비 (3개)
  { id: 'REG-07', article: '제8-1조', title: '외부 전문가 자문료 한도', category: '전문가 활용비',
    keywords: ['전문가', '자문', '강사', '자문료', '강사료', '컨설팅'],
    limitAmount: 300000, limitType: 'per_event',
    content: '외부 전문가 1인당 1회 자문료는 30만원 이내이며, 연 12회를 초과할 수 없다.' },
  { id: 'REG-08', article: '제8-2조', title: '자문료 동일인 중복 지급 제한', category: '전문가 활용비',
    keywords: ['전문가', '자문', '강사', '중복', '반복'],
    content: '동일인에게 동일 월에 2회 이상 자문료를 지급하는 경우 기관장 승인이 필요하다.' },
  { id: 'REG-09', article: '제8-3조', title: '내부 직원 자문료 지급 금지', category: '전문가 활용비',
    keywords: ['전문가', '자문', '내부', '직원', '소속'],
    content: '동일 연구기관 소속 직원에 대한 자문료 지급은 원칙적으로 금지된다.' },

  // 연구재료비 (3개)
  { id: 'REG-10', article: '제4-1조', title: '연구재료비 증빙 기준', category: '연구재료비',
    keywords: ['연구재료', '재료', '시약', '실험', '부품'],
    content: '연구재료비는 세금계산서 또는 카드 영수증으로 증빙해야 하며, 연구 직접 관련성을 소명해야 한다.' },
  { id: 'REG-11', article: '제4-2조', title: '단가 50만원 이상 구매 절차', category: '연구재료비',
    keywords: ['연구재료', '재료', '고가', '구매', '발주'],
    limitAmount: 500000,
    content: '단가 50만원 이상 재료 구매 시 3개 업체 이상 견적서 비교가 원칙이다.' },
  { id: 'REG-12', article: '제4-3조', title: '연구재료 개인 사용 금지', category: '연구재료비',
    keywords: ['연구재료', '재료', '개인', '사적'],
    content: '연구재료는 과제 목적 외 개인 용도로 사용할 수 없으며, 위반 시 전액 반납해야 한다.' },

  // 소모품비 (3개)
  { id: 'REG-13', article: '제4-4조', title: '소모품비 범위', category: '소모품비',
    keywords: ['소모품', '사무용품', '문구', '토너', '용지'],
    content: '소모품비는 연구 수행에 필요한 사무용품, 전산소모품 등에 한정되며 개인 소지품 구매는 불가하다.' },
  { id: 'REG-14', article: '제4-5조', title: '소모품 일괄 구매 한도', category: '소모품비',
    keywords: ['소모품', '사무용품', '일괄', '대량'],
    limitAmount: 300000, limitType: 'per_event',
    content: '1회 소모품 일괄 구매는 30만원 이내가 원칙이며, 초과 시 사전 품의가 필요하다.' },
  { id: 'REG-15', article: '제4-6조', title: '소모품 재고 관리', category: '소모품비',
    keywords: ['소모품', '재고', '수불', '목록'],
    content: '소모품은 수불부를 작성·관리해야 하며, 정산 시 재고 현황을 제출해야 한다.' },

  // 국외여비 (3개)
  { id: 'REG-16', article: '제6-1조', title: '국외 출장 사전 승인', category: '국외여비',
    keywords: ['국외여비', '해외', '출장', '해외출장'],
    content: '국외 출장은 출발 14일 전 기관장 승인을 받아야 한다.' },
  { id: 'REG-17', article: '제6-2조', title: '국외 출장 항공료 기준', category: '국외여비',
    keywords: ['국외여비', '해외', '항공', '비행기', '항공료'],
    content: '항공료는 일반석 기준이며, 8시간 이상 장거리는 비즈니스석 이용이 가능하다.' },
  { id: 'REG-18', article: '제6-3조', title: '국외 출장 일비·숙박비', category: '국외여비',
    keywords: ['국외여비', '해외', '숙박', '일비'],
    content: '국외 출장 일비·숙박비는 기획재정부 고시 여비규정 별표에 따른다.' },
];
