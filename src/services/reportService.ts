// PDF 감사 리포트를 생성하는 서비스
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { AuditItem, ProjectInfo } from '../types/dashboard';

export async function generateAuditReport(
  project: ProjectInfo,
  items: AuditItem[],
  chartElementId: string
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  let y = 20;

  // 헤더
  doc.setFillColor(0, 102, 204);
  doc.rect(0, 0, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Audit System — Executive Brief', 14, 9);
  doc.text(new Date().toLocaleDateString('ko-KR'), W - 14, 9, { align: 'right' });
  y = 24;

  // 프로젝트명
  doc.setTextColor(29, 29, 31);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, 14, y);
  y += 10;

  // 예산 KPI
  doc.setFontSize(9);
  doc.setTextColor(134, 134, 139);
  doc.setFont('helvetica', 'normal');
  const usagePct = ((project.budget.used / project.budget.total) * 100).toFixed(1);
  doc.text(
    `총 예산: ${(project.budget.total / 100000000).toFixed(1)}억원  |  집행: ${(project.budget.used / 100000000).toFixed(1)}억원  |  집행률: ${usagePct}%  |  잔액: ${(project.budget.remaining / 10000).toLocaleString()}만원`,
    14, y
  );
  y += 8;

  // 구분선
  doc.setDrawColor(210, 210, 215);
  doc.line(14, y, W - 14, y);
  y += 8;

  // 상태 요약
  doc.setFontSize(12);
  doc.setTextColor(29, 29, 31);
  doc.setFont('helvetica', 'bold');
  doc.text('항목 현황', 14, y);
  y += 7;

  const statuses: Array<{ label: string; count: number; color: [number, number, number] }> = [
    { label: '정상', count: items.filter(i => i.status === '정상').length, color: [52, 199, 89] },
    { label: '검토필요', count: items.filter(i => i.status === '검토필요').length, color: [255, 159, 10] },
    { label: '소명중', count: items.filter(i => i.status === '소명중').length, color: [0, 102, 204] },
    { label: '반려', count: items.filter(i => i.status === '반려').length, color: [255, 59, 48] },
  ];

  statuses.forEach((s, i) => {
    const x = 14 + i * 46;
    doc.setFillColor(...s.color);
    doc.roundedRect(x, y, 42, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, x + 21, y + 6, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.count), x + 21, y + 13, { align: 'center' });
  });
  y += 24;

  // 차트 캡처
  const chartEl = document.getElementById(chartElementId);
  if (chartEl) {
    try {
      const imgData = await toPng(chartEl, { quality: 0.95, backgroundColor: '#ffffff' });
      const chartHeight = 55;
      doc.addImage(imgData, 'PNG', 14, y, W - 28, chartHeight);
      y += chartHeight + 8;
    } catch {
      // 차트 캡처 실패 시 스킵
    }
  }

  // 구분선
  doc.setDrawColor(210, 210, 215);
  doc.line(14, y, W - 14, y);
  y += 8;

  // Top 이상 항목
  const flagged = items
    .filter(i => i.status === '검토필요' || i.status === '반려')
    .sort((a, b) => a.aiScore - b.aiScore)
    .slice(0, 5);

  if (flagged.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(29, 29, 31);
    doc.setFont('helvetica', 'bold');
    doc.text('주요 검토 항목 (Top 5)', 14, y);
    y += 7;

    flagged.forEach((item, i) => {
      doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 247 : 255);
      doc.rect(14, y - 1, W - 28, 10, 'F');
      doc.setFontSize(9);
      doc.setTextColor(29, 29, 31);
      doc.setFont('helvetica', 'normal');
      const desc = item.description.length > 28 ? item.description.slice(0, 28) + '…' : item.description;
      doc.text(`${i + 1}. ${desc}`, 16, y + 5);
      doc.text(item.amount.toLocaleString() + '원', W - 50, y + 5);
      doc.setTextColor(255, 59, 48);
      doc.text(`AI ${item.aiScore}%`, W - 24, y + 5, { align: 'right' });
      y += 11;
    });
  }

  // 푸터
  doc.setFontSize(8);
  doc.setTextColor(134, 134, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('본 리포트는 AI Audit System에 의해 자동 생성되었습니다.', 14, 287);
  doc.text(`생성일시: ${new Date().toLocaleString('ko-KR')}`, W - 14, 287, { align: 'right' });

  const fileName = `audit-report-${new Date().toISOString().slice(0, 7)}.pdf`;
  doc.save(fileName);
}
