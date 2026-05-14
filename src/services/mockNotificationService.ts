import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { sendNotification } from "./dataService";

/**
 * Mock Notification Service
 * This service simulates real-time background monitoring for R&D compliance.
 */
export class MockNotificationService {
  private static instance: MockNotificationService;
  private timer: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): MockNotificationService {
    if (!MockNotificationService.instance) {
      MockNotificationService.instance = new MockNotificationService();
    }
    return MockNotificationService.instance;
  }

  public start(userId: string) {
    this.userId = userId;
    if (this.timer) return;

    console.log("Mock Notification Service started for user:", userId);
    
    // Simulate initial check
    this.checkCompliance();

    // Periodic checks every 2 minutes
    this.timer = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3) {
        this.simulateDeadlineAlert();
      } else if (rand < 0.6) {
        this.simulateBudgetAlert();
      }
    }, 120000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async checkCompliance() {
    if (!this.userId) return;
    // Initial greeting or summary
    await sendNotification(
      this.userId,
      "시스템 분석 완료",
      "현재 연구비 집행 내역의 98%가 규정을 준수하고 있습니다.",
      "info"
    );
  }

  private async simulateDeadlineAlert() {
    if (!this.userId) return;
    const deadlines = [
      "국가연구개발사업 중간 보고서 제출 기한이 3일 남았습니다.",
      "차년도 연구 과제 예산안 승인 마감 임박 (D-2)",
      "연구 재료비 집행 마감 기한이 이번 주 금요일입니다."
    ];
    const msg = deadlines[Math.floor(Math.random() * deadlines.length)];
    await sendNotification(this.userId, "제출 기한 임박", msg, "deadline" as any);
  }

  private async simulateBudgetAlert() {
    if (!this.userId) return;
    const alerts = [
      "연구활동비 카테고리의 집행률이 92%입니다. 추가 지출 시 전용 승인이 필요할 수 있습니다.",
      "전문가 활용비 예산 잔액이 10만원 미만입니다.",
      "간접비 분할 납부 일정 확인이 필요합니다."
    ];
    const msg = alerts[Math.floor(Math.random() * alerts.length)];
    await sendNotification(this.userId, "예산 경고", msg, "alert" as any);
  }

  /**
   * Called by the application when a specific event occurs
   */
  public async notifyLowScore(projectId: string, itemId: string, score: number) {
    if (!this.userId) return;
    if (score < 70) {
      await sendNotification(
        this.userId,
        "낮은 준수율 감지",
        `신규 등록된 항목의 준수율 점수가 ${score}점입니다. 상세 검토가 필요합니다.`,
        "alert" as any
      );
    }
  }
}
