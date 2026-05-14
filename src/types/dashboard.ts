
export interface ProjectInfo {
  name: string;
  pi: string;
  budget: {
    total: number;
    used: number;
    remaining: number;
  };
  deadline: string;
  dDay: number;
}

export type AuditStatus = '작성중' | '정상' | '검토필요' | '소명중' | '반려';

export interface AuditLog {
  id: string;
  itemId: string;
  action: 'create' | 'update_status' | 'update_receipt' | 'ai_analysis' | 'edit';
  details: string;
  userId?: string;
  userName?: string;
  timestamp: any;
}

export interface AuditItem {
  id: string;
  projectId?: string;
  userId?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  aiScore: number; // 0-100
  status: AuditStatus;
  receiptUrl?: string;
  aiComment?: string;
  userReason?: string;
  updatedAt?: any;
}

export interface WeeklyExecution {
  week: string;
  amount: number;
}

export interface CategoryExecution {
  name: string;
  value: number;
  color: string;
}
