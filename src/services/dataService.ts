import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  setDoc,
  doc, 
  deleteDoc,
  getDocs,
  writeBatch,
  orderBy
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { AuditItem, AuditLog } from "../types/dashboard";
import { auditItems as mockSeedData } from "../data/mockData";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function logAuditAction(
  projectId: string, 
  itemId: string, 
  action: AuditLog['action'], 
  details: string
) {
  const path = `projects/${projectId}/auditItems/${itemId}/logs`;
  try {
    const colRef = collection(db, "projects", projectId, "auditItems", itemId, "logs");
    const user = auth.currentUser;
    await addDoc(colRef, {
      itemId,
      action,
      details,
      userId: user?.uid || 'system',
      userName: user?.displayName || user?.email || 'System',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToAuditLogs(projectId: string, itemId: string, callback: (logs: AuditLog[]) => void) {
  const path = `projects/${projectId}/auditItems/${itemId}/logs`;
  const q = query(
    collection(db, "projects", projectId, "auditItems", itemId, "logs"),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AuditLog[];
    callback(logs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export function subscribeToAuditItems(projectId: string, callback: (items: AuditItem[]) => void) {
  const path = `projects/${projectId}/auditItems`;
  const q = query(collection(db, "projects", projectId, "auditItems"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AuditItem[];
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function seedInitialData(projectId: string) {
  const path = `projects/${projectId}/auditItems`;
  try {
    const q = query(collection(db, "projects", projectId, "auditItems"));
    const snapshot = await getDocs(q);
    
    // Always ensure mock items exist regardless of whether collection was empty
    const batch = writeBatch(db);
    let hasChanges = false;

    // Check which mock items are missing
    for (const item of mockSeedData) {
      const exists = snapshot.docs.some(doc => doc.id === item.id);
      if (!exists) {
        const docRef = doc(db, "projects", projectId, "auditItems", item.id);
        batch.set(docRef, { 
          ...item, 
          projectId,
          userId: 'demo-researcher-id',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        hasChanges = true;
      }
    }
    
    // If it was truly empty, add more random data for variety
    if (snapshot.empty) {
      const categories = ["회의비", "연구활동비", "여비", "연구재료비", "수수료", "도서구입비"];
      const statuses = ["정상", "검토필요", "소명중", "작성중"];
      const descriptions = [
        "연구 과제 관련 전략 회의 식대",
        "기술 자문 회의 및 정보 활동비",
        "학회 참석을 위한 국내 여비",
        "실험용 소모성 자재 구매 (시약 등)",
        "특허 출원 대행 수수료",
        "전문 서적 및 논문 구독료",
        "워크숍 장소 대관료",
        "연구 시제품 제작 용역비",
        "국외 출장 항공료 및 숙박비",
        "데이터 분석 전담 인력 인센티브"
      ];

      for (let i = 0; i < 50; i++) {
        const docRef = doc(collection(db, "projects", projectId, "auditItems"));
        const category = categories[Math.floor(Math.random() * categories.length)];
        const status = Math.random() > 0.85 ? statuses[Math.floor(Math.random() * 3) + 1] : "정상";
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const amount = Math.floor(Math.random() * 200) * 10000 + 50000;
        const aiScore = status === "정상" ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 40) + 30;
        
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        const dateStr = date.toISOString().split('T')[0];

        batch.set(docRef, {
          projectId,
          userId: i % 2 === 0 ? 'demo-researcher-id' : 'other-user-id',
          category,
          description: `${description} #${i + 1}`,
          amount,
          aiScore,
          aiComment: aiScore < 70 ? "AI 이상 징후 감지: 해당 품목의 평균 단가 대비 240% 초과 집행 확인" : "정상적인 연구활동비 집행 패턴",
          status,
          date: dateStr,
          receiptUrl: `https://picsum.photos/seed/audit-pro-${i}/400/600`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      hasChanges = true;
    }

    if (hasChanges) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function sendNotification(userId: string, title: string, message: string, type: 'alert' | 'info' | 'deadline' | 'success') {
  const path = `users/${userId}/notifications`;
  try {
    await addDoc(collection(db, "users", userId, "notifications"), {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToNotifications(userId: string, callback: (notifications: any[]) => void) {
  const path = `users/${userId}/notifications`;
  const q = query(
    collection(db, "users", userId, "notifications"), 
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const path = `users/${userId}/notifications/${notificationId}`;
  try {
    const docRef = doc(db, "users", userId, "notifications", notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function markAllNotificationsAsRead(userId: string, notificationIds: string[]) {
  const batch = writeBatch(db);
  notificationIds.forEach(id => {
    const docRef = doc(db, "users", userId, "notifications", id);
    batch.update(docRef, { read: true });
  });
  await batch.commit();
}

export async function updateAuditStatus(projectId: string, item: AuditItem, status: string, previousStatus?: string, extraData: Partial<AuditItem> = {}) {
  const itemId = item.id;
  const path = `projects/${projectId}/auditItems/${itemId}`;
  try {
    const docRef = doc(db, "projects", projectId, "auditItems", itemId);
    // Use setDoc with merge: true to handle both existing and mock documents
    await setDoc(docRef, { 
      ...item,
      status,
      ...extraData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    let actionDetails = `상태 변경: ${previousStatus || '알 수 없음'} → ${status}`;
    if (extraData.userReason) {
      actionDetails += ` (소명 내용 포함)`;
    }
    
    await logAuditAction(projectId, itemId, 'update_status', actionDetails);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAuditReceipt(projectId: string, item: AuditItem, receiptUrl: string) {
  const itemId = item.id;
  const path = `projects/${projectId}/auditItems/${itemId}`;
  try {
    const docRef = doc(db, "projects", projectId, "auditItems", itemId);
    // Use setDoc with merge: true to handle both existing and mock documents
    await setDoc(docRef, { 
      ...item,
      receiptUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await logAuditAction(projectId, itemId, 'update_receipt', '영수증 이미지 업데이트됨');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addAuditItem(projectId: string, item: Omit<AuditItem, 'id' | 'projectId'>) {
  const path = `projects/${projectId}/auditItems`;
  try {
    const user = auth.currentUser;
    const colRef = collection(db, "projects", projectId, "auditItems");
    const data = {
      ...item,
      projectId,
      userId: user?.uid || 'unknown',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(colRef, data);
    
    // Trigger real-time notification for low scores
    if (data.aiScore < 70 && user) {
      const { MockNotificationService } = await import("./mockNotificationService");
      await MockNotificationService.getInstance().notifyLowScore(projectId, docRef.id, data.aiScore);
    }
    
    await logAuditAction(projectId, docRef.id, 'create', '신규 지출 내역 등록');
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUsers(callback: (users: any[]) => void) {
  const path = 'users';
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function updateUserProfile(userId: string, data: any) {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createUserProfile(userId: string, data: any) {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Rule Management
export function subscribeToRules(callback: (rules: any[]) => void) {
  const path = 'rules';
  const q = query(collection(db, "rules"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const rules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(rules);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function addRule(title: string, content: string, type: string, sourceUrl?: string) {
  const path = 'rules';
  try {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, "rules"), {
      title,
      content,
      type,
      sourceUrl: sourceUrl || "",
      active: true,
      lastModifiedBy: user?.displayName || user?.email || 'Anonymous',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Log initial history
    await addDoc(collection(db, "rules", docRef.id, "history"), {
      title,
      content,
      type,
      sourceUrl: sourceUrl || "",
      modifiedBy: user?.displayName || user?.email || 'Anonymous',
      modifiedByUid: user?.uid || 'unknown',
      changeType: 'create',
      timestamp: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateRule(id: string, updates: { title?: string, content?: string, type?: string, active?: boolean, sourceUrl?: string }) {
  const path = `rules/${id}`;
  try {
    const user = auth.currentUser;
    const docRef = doc(db, "rules", id);
    
    await updateDoc(docRef, {
      ...updates,
      lastModifiedBy: user?.displayName || user?.email || 'Anonymous',
      updatedAt: serverTimestamp()
    });

    // Log history
    await addDoc(collection(db, "rules", id, "history"), {
      ...updates,
      modifiedBy: user?.displayName || user?.email || 'Anonymous',
      modifiedByUid: user?.uid || 'unknown',
      changeType: 'update',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToRuleHistory(ruleId: string, callback: (history: any[]) => void) {
  const path = `rules/${ruleId}/history`;
  const q = query(collection(db, "rules", ruleId, "history"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(history);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function deleteUserProfile(uid: string) {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteRule(id: string) {
  const path = `rules/${id}`;
  try {
    await deleteDoc(doc(db, "rules", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
