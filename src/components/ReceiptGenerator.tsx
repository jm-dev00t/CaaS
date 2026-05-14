import React, { useState, useRef, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RefreshCw, Download, Printer, Copy, Check, ImageIcon, Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { toPng } from 'html-to-image';

export function ReceiptGenerator() {
  const [isSaving, setIsSaving] = useState(false);
  const [receiptData, setReceiptData] = useState({
    shopName: "스타벅스 성수역점",
    address: "서울특별시 성동구 아차산로 100",
    tel: "02-1234-5678",
    date: new Date().toISOString().replace('T', ' ').slice(0, 19),
    orderNum: "20240505-01-0024",
    items: [
      { name: "아메리카노 (T)", qty: 2, price: 4500 },
      { name: "블루베리 베이글", qty: 1, price: 3900 },
      { name: "크림치즈", qty: 1, price: 1000 },
    ],
    tid: "1234567890",
    authNum: "30012345"
  });

  const receiptRef = useRef<HTMLDivElement>(null);

  const handleSaveAsImage = useCallback(() => {
    if (receiptRef.current === null) return;

    setIsSaving(true);
    toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#fdfdfd', width: 340 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `receipt-${receiptData.orderNum}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to save receipt image', err);
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [receiptData.orderNum]);

  const generateRandom = () => {
    const shops = [
      { name: "파리바게뜨 강남본점", addr: "서울특별시 강남구 강남대로 408" },
      { name: "본죽&비빔밥 cafe", addr: "서울특별시 종로구 세종대로 209" },
      { name: "알파문구 시청점", addr: "서울특별시 중구 남대문로 10" },
      { name: "GS25 편의점", addr: "인천광역시 남동구 인주대로 582" },
      { name: "오피스디포 광화문점", addr: "서울특별시 종로구 종로 1" }
    ];
    const itemPool = [
      { name: "연구용 소모품", price: 12500 },
      { name: "A4 복사용지 1box", price: 35000 },
      { name: "전문가 자문료", price: 150000 },
      { name: "연구활동비(식대)", price: 8500 },
      { name: "세미나 다과", price: 42000 },
      { name: "서적(인공지능 개론)", price: 28000 }
    ];
    
    const randomShop = shops[Math.floor(Math.random() * shops.length)];
    const randomItems = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
      itemPool[Math.floor(Math.random() * itemPool.length)]
    ).map(item => ({ ...item, qty: Math.floor(Math.random() * 2) + 1 }));

    setReceiptData({
      shopName: randomShop.name,
      address: randomShop.addr,
      tel: `02-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date(Date.now() - Math.random() * 1000000000).toISOString().replace('T', ' ').slice(0, 19),
      orderNum: `20240505-01-00${Math.floor(10 + Math.random() * 80)}`,
      items: randomItems,
      tid: Math.random().toString().slice(2, 12),
      authNum: Math.random().toString().slice(2, 10)
    });
  };

  const addItem = () => {
    setReceiptData(prev => ({
      ...prev,
      items: [...prev.items, { name: "새 항목", qty: 1, price: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const total = receiptData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const vat = Math.floor(total / 11);
  const subtotal = total - vat;

  return (
    <div className="max-w-[1240px] mx-auto p-6 md:p-10 lg:p-16">
      <div className="flex flex-col xl:flex-row gap-12 lg:gap-20 items-start">
        {/* Left: Controls */}
        <div className="flex-1 space-y-10">
          <div>
            <div className="w-12 h-12 bg-[#0066cc] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-[32px] font-bold text-[#1d1d1f] tracking-tight leading-tight">가상 영수증 생성기</h2>
            <p className="text-[17px] text-[#86868b] mt-4 leading-relaxed max-w-xl">
              AI 영수증 분석 기능을 테스트하기 위한 도구입니다. 
              내용을 직접 수정하거나 '랜덤 생성' 버튼으로 데이터를 만든 후 
              이미지로 저장하여 업로드해 보세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[32px] border border-[#d2d2d7] shadow-sm">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest">상호명</Label>
                <Input 
                  value={receiptData.shopName} 
                  onChange={(e) => setReceiptData(prev => ({ ...prev, shopName: e.target.value }))}
                  className="rounded-xl border-[#d2d2d7] font-semibold h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest">주소</Label>
                <Input 
                  value={receiptData.address} 
                  onChange={(e) => setReceiptData(prev => ({ ...prev, address: e.target.value }))}
                  className="rounded-xl border-[#d2d2d7] font-semibold h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest">날짜 및 시간</Label>
                <Input 
                  value={receiptData.date} 
                  onChange={(e) => setReceiptData(prev => ({ ...prev, date: e.target.value }))}
                  className="rounded-xl border-[#d2d2d7] font-semibold h-11"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest">품목 리스트</Label>
                  <Button variant="ghost" size="sm" onClick={addItem} className="h-7 text-[11px] text-[#0066cc] font-bold hover:bg-[#f2f8ff]">
                    <Plus className="w-3 h-3 mr-1" />
                    추가
                  </Button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {receiptData.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input 
                        value={item.name} 
                        onChange={(e) => updateItem(i, 'name', e.target.value)}
                        placeholder="품명"
                        className="rounded-lg h-9 text-[12px] flex-[2]"
                      />
                      <Input 
                        type="number"
                        value={item.qty} 
                        onChange={(e) => updateItem(i, 'qty', parseInt(e.target.value) || 0)}
                        placeholder="수량"
                        className="rounded-lg h-9 text-[12px] flex-1 text-center"
                      />
                      <Input 
                        type="number"
                        value={item.price} 
                        onChange={(e) => updateItem(i, 'price', parseInt(e.target.value) || 0)}
                        placeholder="단가"
                        className="rounded-lg h-9 text-[12px] flex-[1.5] text-right"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-9 w-9 text-[#ff3b30] hover:bg-[#fff2f2]">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={generateRandom}
              className="bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] font-semibold rounded-2xl h-14 px-8 shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-[#0066cc]" />
              랜덤 데이터 생성
            </Button>
            <Button 
              onClick={handleSaveAsImage}
              disabled={isSaving}
              className="bg-[#0066cc] text-white hover:bg-[#0071e3] font-semibold rounded-2xl h-14 px-10 shadow-lg shadow-[#0066cc]/20 transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Download className="w-5 h-5 mr-3" />}
              {isSaving ? "처리 중..." : "영수증 이미지로 저장"}
            </Button>
          </div>
        </div>

        {/* Right: Realistic Receipt Mockup */}
        <div className="w-full max-w-[340px] sticky top-12 mx-auto">
          <div className="p-4 bg-white rounded-3xl shadow-xl border border-[#d2d2d7]/30">
            <div ref={receiptRef} className="bg-white p-2">
              <Card className="bg-[#fcfcfc] border-0 shadow-none rounded-none font-mono text-[11px] text-slate-800 overflow-hidden relative">
              <div className="h-2 w-full flex overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="min-w-[20px] h-[20px] bg-slate-100 rotate-45 -mt-3 mr-1"></div>
                ))}
              </div>

              <div className="p-8 pb-12 space-y-6">
                <div className="text-center space-y-1.5">
                  <h3 className="text-[17px] font-black text-slate-900 tracking-tighter leading-tight">{receiptData.shopName}</h3>
                  <p className="text-[10px] text-slate-500 leading-tight">{receiptData.address}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">대표: 김철수 | 전 화: {receiptData.tel}</p>
                </div>

                <div className="border-y border-dashed border-slate-300 py-3 space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>판매일시:</span>
                    <span>{receiptData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>매출번호:</span>
                    <span>{receiptData.orderNum}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-black text-slate-900 border-b border-slate-300 pb-1.5">
                    <span className="w-1/2">상품명</span>
                    <span className="w-1/6 text-center">수량</span>
                    <span className="w-1/3 text-right">금액</span>
                  </div>
                  {receiptData.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1 text-slate-700">
                      <span className="w-1/2 truncate pr-2">{item.name}</span>
                      <span className="w-1/6 text-center">{item.qty}</span>
                      <span className="w-1/3 text-right">{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-slate-800 pt-4 space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>과세매출액:</span>
                    <span>{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>부 가 세:</span>
                    <span>{vat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-800 mt-2.5 pt-2.5">
                    <span>합 계:</span>
                    <span>{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-1.5 text-[10px] text-slate-500 border border-slate-100">
                  <p className="font-bold text-slate-400">[신용승인]</p>
                  <div className="flex justify-between">
                    <span>카드번호:</span>
                    <span>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>단말기번호:</span>
                    <span>{receiptData.tid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>승인번호:</span>
                    <span className="font-black text-slate-900">{receiptData.authNum}</span>
                  </div>
                </div>

                <div className="text-center pt-2 text-[10px] text-slate-400">
                  <p>이용해주셔서 감사합니다.</p>
                </div>
              </div>

              <div className="h-2 w-full flex overflow-hidden mt-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="min-w-[20px] h-[20px] bg-slate-100 rotate-45 mt-1 mr-1"></div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
