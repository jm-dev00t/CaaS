import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  UserPlus, 
  Shield, 
  Trash2, 
  CheckCircle2, 
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Mail,
  Building,
  GraduationCap
} from "lucide-react";
import { subscribeToUsers, updateUserProfile, createUserProfile } from "../services/dataService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const KAIST_RANKS = [
  "연구책임자 (PI)",
  "참여교수",
  "책임연구원",
  "선임연구원",
  "원급연구원",
  "박사후연구원",
  "학생연구원",
  "행정원",
  "감사실장",
  "감사역"
];

const APP_ROLES = [
  { id: "admin", label: "관리자", icon: ShieldAlert, color: "text-red-500 bg-red-50" },
  { id: "finance_officer", label: "감사자", icon: ShieldCheck, color: "text-[#0066cc] bg-blue-50" },
  { id: "researcher", label: "연구원", icon: UserIcon, color: "text-gray-500 bg-gray-50" }
];

export function OrganizationView() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUsers(setUsers);
    return () => unsubscribe();
  }, []);

  const seedTestData = async () => {
    if (!confirm("10명의 테스트 조직원을 일괄 생성하시겠습니까?")) return;
    setIsSeeding(true);
    const testUsers = [
      { uid: "uid_001", displayName: "김철수", email: "chulsoo.kim@kaist.ac.kr", organization: "AI 대학원", rank: "연구책임자 (PI)", role: "admin" },
      { uid: "uid_002", displayName: "이영희", email: "yh.lee@kaist.ac.kr", organization: "전기 및 전자공학부", rank: "참여교수", role: "researcher" },
      { uid: "uid_003", displayName: "박미나", email: "mina.park@kaist.ac.kr", organization: "감사실", rank: "감사역", role: "finance_officer" },
      { uid: "uid_004", displayName: "정지운", email: "jw.jung@kaist.ac.kr", organization: "AI 보안 연구실", rank: "선임연구원", role: "researcher" },
      { uid: "uid_005", displayName: "최현우", email: "hw.choi@kaist.ac.kr", organization: "산학협력단", rank: "행정원", role: "finance_officer" },
      { uid: "uid_006", displayName: "강준호", email: "jh.kang@kaist.ac.kr", organization: "의과학대학원", rank: "박사후연구원", role: "researcher" },
      { uid: "uid_007", displayName: "유리사", email: "risa.yu@kaist.ac.kr", organization: "전산학부", rank: "학생연구원", role: "researcher" },
      { uid: "uid_008", displayName: "한재석", email: "js.han@kaist.ac.kr", organization: "미래전략연구소", rank: "책임연구원", role: "researcher" },
      { uid: "uid_009", displayName: "송지효", email: "jh.song@kaist.ac.kr", organization: "행정팀", rank: "행정원", role: "finance_officer" },
      { uid: "uid_010", displayName: "조세호", email: "sh.cho@kaist.ac.kr", organization: "감사실", rank: "감사 실장", role: "admin" },
    ];

    try {
      for (const user of testUsers) {
        await createUserProfile(user.uid, user);
      }
      alert("10명의 테스트 조직원이 성공적으로 추가되었습니다.");
    } catch (e) {
      console.error("테스트 데이터 생성 실패:", e);
      alert("데이터 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateRole = async (uid: string, role: string) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(uid, { role });
      if (selectedUser?.uid === uid) {
        setSelectedUser({ ...selectedUser, role });
      }
    } catch (e) {
      console.error(e);
      alert("권한 변경 중 오류가 발생했습니다. 관리자 권한을 확인해주세요.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRank = async (uid: string, rank: string) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(uid, { rank });
      if (selectedUser?.uid === uid) {
        setSelectedUser({ ...selectedUser, rank });
      }
    } catch (e) {
      console.error(e);
      alert("직급 변경 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateOrg = async (uid: string, organization: string) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(uid, { organization });
      if (selectedUser?.uid === uid) {
        setSelectedUser({ ...selectedUser, organization });
      }
    } catch (e) {
      console.error(e);
      alert("소속 변경 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden h-full flex flex-col bg-[#f5f5f7]">
      <div className="p-12 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#0066cc]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0066cc]" />
              </div>
              <span className="text-[12px] font-bold text-[#0066cc] uppercase tracking-widest">Workspace Management</span>
            </div>
            <h1 className="text-[34px] font-bold text-[#1d1d1f] tracking-tight">조직 및 권한 관리</h1>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              disabled={isSeeding}
              onClick={seedTestData}
              className="bg-white border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#1d1d1f] rounded-full px-6 py-6 h-auto font-bold flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              {isSeeding ? "데이터 생성 중..." : "테스트 데이터 생성"}
            </Button>
            <Button className="bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full px-6 py-6 h-auto font-bold flex items-center gap-2 shadow-lg shadow-[#0066cc]/20">
              <UserPlus className="w-5 h-5" />
              멤버 초대
            </Button>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
          <Input 
            placeholder="이름, 이메일, 조직으로 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 h-14 text-[16px] bg-white border-[#d2d2d7] rounded-2xl shadow-sm focus:ring-2 focus:ring-[#0066cc]/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-12 pb-12 flex gap-8">
        {/* User List */}
        <div className="flex-1 bg-white border border-[#d2d2d7] rounded-[32px] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#f5f5f7] flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#1d1d1f]">조직 멤버 ({filteredUsers.length}명)</h2>
            <div className="text-[13px] font-medium text-[#86868b]">Last sync: Just now</div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-[#f5f5f7]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-wider">이름 / 이메일</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-wider">조직 / 직급</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-wider">시스템 권한</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const role = APP_ROLES.find(r => r.id === user.role) || APP_ROLES[2];
                  return (
                    <motion.tr 
                      key={user.uid}
                      layoutId={user.uid}
                      onClick={() => setSelectedUser(user)}
                      className={cn(
                        "group hover:bg-[#f5f5f7] transition-colors cursor-pointer border-b border-[#f5f5f7]",
                        selectedUser?.uid === user.uid && "bg-[#f5f5f7]"
                      )}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f2f2f7] flex items-center justify-center text-[#1d1d1f] font-bold text-sm border border-[#d2d2d7]">
                            {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-[#1d1d1f]">{user.displayName || "미지정"}</span>
                            <span className="text-[13px] text-[#86868b] font-medium">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#1d1d1f]">{user.organization || "소속 없음"}</span>
                          <span className="text-[12px] text-[#0066cc] font-semibold">{user.rank || "직급 미지정"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className={cn("px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit border-none shadow-none", role.color)}>
                          <role.icon className="w-3.5 h-3.5" />
                          {role.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4 text-[#86868b]" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Details */}
        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="w-[400px] bg-white border border-[#d2d2d7] rounded-[32px] shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-[#f5f5f7] flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[32px] bg-[#f2f2f7] flex items-center justify-center text-[#1d1d1f] font-bold text-3xl mb-6 shadow-inner border border-[#d2d2d7]">
                  {selectedUser.displayName?.[0] || selectedUser.email?.[0]?.toUpperCase()}
                </div>
                <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-2">{selectedUser.displayName || "사용자 이름"}</h3>
                <p className="text-[14px] font-medium text-[#86868b] mb-1">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-4">
                  <Badge className="bg-[#f2f2f7] text-[#1d1d1f] border-none px-3 py-1 font-bold text-[11px] rounded-full">UID: {selectedUser.uid.slice(0, 8)}</Badge>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[#ff3b30] hover:bg-[#fff2f2] font-bold text-[11px] rounded-full">로그아웃 강제</Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-[#0066cc]" />
                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">시스템 권한 할당</label>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {APP_ROLES.map((role) => (
                      <button
                        key={role.id}
                        disabled={isUpdating}
                        onClick={() => handleUpdateRole(selectedUser.uid, role.id)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                          selectedUser.role === role.id 
                            ? "bg-[#0066cc] border-[#0066cc] text-white shadow-lg shadow-[#0066cc]/20" 
                            : "bg-white border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <role.icon className={cn("w-5 h-5", selectedUser.role === role.id ? "text-white" : "text-[#86868b]")} />
                          <span className="text-[15px] font-bold">{role.label}</span>
                        </div>
                        {selectedUser.role === role.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-[#0066cc]" />
                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">소속 및 직책 설정</label>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[12px] font-bold text-[#1d1d1f] ml-1">기관/부서</p>
                      <Input 
                        defaultValue={selectedUser.organization}
                        onBlur={(e) => handleUpdateOrg(selectedUser.uid, e.target.value)}
                        className="bg-white border-[#d2d2d7] rounded-[14px]"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-[12px] font-bold text-[#1d1d1f] ml-1">직급 (KAIST 기준)</p>
                      <Select 
                        value={selectedUser.rank} 
                        onValueChange={(val) => handleUpdateRank(selectedUser.uid, val)}
                      >
                        <SelectTrigger className="bg-white border-[#d2d2d7] rounded-[14px]">
                          <SelectValue placeholder="직급 선택" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-[#d2d2d7]">
                          {KAIST_RANKS.map(rank => (
                            <SelectItem key={rank} value={rank} className="rounded-xl">{rank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full h-14 rounded-2xl border-[#ff3b30] text-[#ff3b30] hover:bg-[#fff2f2] font-bold flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    멤버 삭제
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="w-[400px] flex items-center justify-center border border-dashed border-[#d2d2d7] rounded-[32px] bg-white/50">
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-8 h-8 text-[#86868b]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1d1d1f]">멤버를 선택하세요</h3>
                <p className="text-[13px] text-[#86868b] leading-relaxed">조직 멤버를 선택하여 권한을 할당하거나 소속 정보를 수정할 수 있습니다.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
