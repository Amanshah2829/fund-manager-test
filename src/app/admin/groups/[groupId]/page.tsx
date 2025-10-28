
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Users, DollarSign, Calendar, Plus, Trash2, Check, AlertTriangle, ArrowLeft, RefreshCw, Landmark, ChevronsRight, Edit, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

interface Member {
  _id: string
  name: string
  phone: string
  telegramId?: string
}

interface Payment {
  _id: string;
  memberId: {
    _id:string;
    name: string;
  };
  amount: number;
  date: string;
  month: string;
  year: number;
  status: 'paid' | 'pending';
}

interface Withdrawal {
  _id: string;
  winnerId: {
    _id: string;
    name: string;
  };
  bidAmount: number;
  foremanCommission: number;
  dividend: number;
  date: string;
  month: string;
  year: number;
}

interface GroupDetails {
  _id: string
  name: string
  amountPerCycle: number
  totalMembers: number
  currentCycle: number
  members: Member[]
  payments: Payment[]
  withdrawals: Withdrawal[]
}

const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
const currentYearValue = new Date().getFullYear();

export default function GroupDetailsPage() {
  const params = useParams()
  const groupId = params.groupId as string
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [isBulkPaymentOpen, setIsBulkPaymentOpen] = useState(false)
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false)
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);

  const [newMember, setNewMember] = useState({ name: "", phone: "", telegramId: "" })
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({ memberId: "", month: currentMonthName, year: currentYearValue })
  const [bulkPaymentMembers, setBulkPaymentMembers] = useState<string[]>([])
  const [withdrawalDetails, setWithdrawalDetails] = useState({ winnerId: "", bidAmount: "" })
  const [groupSettings, setGroupSettings] = useState({ name: "", amountPerCycle: "", totalMembers: "" });


  const { toast } = useToast()

  const fetchGroupDetails = async () => {
    if (!groupId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (response.ok) {
        const groupData = await response.json()
        setGroup(groupData);
        setGroupSettings({
          name: groupData.name,
          amountPerCycle: groupData.amountPerCycle.toString(),
          totalMembers: groupData.totalMembers.toString()
        });
      } else {
        toast({ variant: "destructive", title: "Failed to fetch group details" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error fetching group details" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroupDetails()
  }, [groupId])
  
  const handleBulkMemberSelect = (memberId: string) => {
    setBulkPaymentMembers(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };
  
  const handleSelectAllForBulk = (membersToPay: Member[]) => {
    if (bulkPaymentMembers.length === membersToPay.length) {
      setBulkPaymentMembers([]);
    } else {
      setBulkPaymentMembers(membersToPay.map(m => m._id));
    }
  };

  const handleAddMember = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      })
      if (response.ok) {
        toast({ title: "Member Added" })
        setIsAddMemberOpen(false)
        setNewMember({ name: "", phone: "", telegramId: "" })
        fetchGroupDetails()
      } else {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        toast({ variant: "destructive", title: "Failed to add member", description: errorData.message })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding member", description: "An unexpected error occurred." })
    }
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsEditMemberOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${editingMember._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingMember.name,
          phone: editingMember.phone,
          telegramId: editingMember.telegramId
        }),
      });

      if (response.ok) {
        toast({ title: 'Member Updated' });
        setIsEditMemberOpen(false);
        setEditingMember(null);
        fetchGroupDetails();
      } else {
        const errorData = await response.json();
        toast({ variant: 'destructive', title: 'Failed to update member', description: errorData.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating member' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member? This action cannot be undone.')) return;
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "Member Removed" });
        fetchGroupDetails();
      } else {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        toast({ variant: "destructive", title: "Failed to remove member", description: errorData.message });
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Error removing member" });
    }
  }

  const handleRecordPayment = async () => {
    try {
      const response = await fetch(`/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            ...paymentDetails, 
            groupId, 
            amount: group?.amountPerCycle,
            year: parseInt(paymentDetails.year.toString())
        }),
      })
      if (response.ok) {
        toast({ title: "Payment Recorded" })
        setIsRecordPaymentOpen(false)
        fetchGroupDetails()
      } else {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        toast({ variant: "destructive", title: "Failed to record payment", description: errorData.message })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error recording payment" })
    }
  }

  const handleBulkRecordPayment = async () => {
    if (bulkPaymentMembers.length === 0) {
      toast({ variant: 'destructive', title: 'No members selected' });
      return;
    }
    try {
      const response = await fetch(`/api/payments/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            groupId, 
            memberIds: bulkPaymentMembers,
            month: currentMonthName,
            year: currentYearValue,
        }),
      })
      if (response.ok) {
        const result = await response.json();
        toast({ title: "Bulk Payments Recorded", description: `${result.successfulCount} payments recorded successfully.` });
        setIsBulkPaymentOpen(false);
        setBulkPaymentMembers([]);
        fetchGroupDetails();
      } else {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        toast({ variant: "destructive", title: "Failed to record bulk payments", description: errorData.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error recording bulk payments" });
    }
  };
  
  const handleRecordWithdrawal = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/withdrawals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: withdrawalDetails.winnerId,
          bidAmount: parseFloat(withdrawalDetails.bidAmount),
          month: currentMonthName,
          year: currentYearValue,
        }),
      });
      if (response.ok) {
        toast({ title: 'Withdrawal Recorded' });
        setIsWithdrawalOpen(false);
        setWithdrawalDetails({ winnerId: '', bidAmount: '' });
        fetchGroupDetails();
      } else {
        const errorData = await response.json();
        toast({ variant: 'destructive', title: 'Failed to record withdrawal', description: errorData.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error recording withdrawal' });
    }
  };
  
  const handleNextCycle = async () => {
    if (!confirm('Are you sure you want to advance to the next cycle?')) return;
    try {
      const response = await fetch(`/api/groups/${groupId}/next-cycle`, { method: 'POST' });
      if (response.ok) {
        toast({ title: 'Cycle Advanced' });
        fetchGroupDetails();
      } else {
        const errorData = await response.json();
        toast({ variant: 'destructive', title: 'Failed to advance cycle', description: errorData.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error advancing cycle' });
    }
  };

  const handleUpdateGroupSettings = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupSettings.name,
          amountPerCycle: parseFloat(groupSettings.amountPerCycle),
          totalMembers: parseInt(groupSettings.totalMembers),
        }),
      });

      if (response.ok) {
        toast({ title: 'Group Settings Updated' });
        fetchGroupDetails();
      } else {
        const errorData = await response.json();
        toast({ variant: 'destructive', title: 'Failed to update settings', description: errorData.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating group settings' });
    }
  };

  if (loading || !group) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }
  
  const paidThisMonth = group.payments.filter(p => p.month === currentMonthName && p.year === currentYearValue);
  const totalCollected = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);
  const membersToPay = group.members.filter(member => !paidThisMonth.some(p => p.memberId._id === member._id));
  
  const currentCycleWithdrawal = group.withdrawals.find(
    w => w.month === currentMonthName && w.year === currentYearValue
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link href="/admin" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                <p className="text-muted-foreground">Detailed view and management tools for this group.</p>
            </div>
            {group.currentCycle < group.totalMembers && (
             <Button onClick={handleNextCycle} className="mt-2 sm:mt-0 w-full sm:w-auto">
                <ChevronsRight className="w-4 h-4 mr-2"/>
                Go to Next Cycle ({group.currentCycle + 1})
            </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{group.members.length} / {group.totalMembers}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contribution</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">₹{group.amountPerCycle.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">per member</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current Cycle</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{group.currentCycle}</div>
               <p className="text-xs text-muted-foreground">of {group.totalMembers} months</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month's Pot</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-green-600">₹{totalCollected.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">{paidThisMonth.length} of {group.members.length} members paid</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <CardTitle>Group Members</CardTitle>
                          <CardDescription>Add, view, or remove members from this group.</CardDescription>
                        </div>
                        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                              <div><Label htmlFor="name">Name</Label><Input id="name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} /></div>
                              <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} /></div>
                              <div><Label htmlFor="telegramId">Telegram ID (Optional)</Label><Input id="telegramId" value={newMember.telegramId} onChange={(e) => setNewMember({ ...newMember, telegramId: e.target.value })} /></div>
                              <Button onClick={handleAddMember} className="w-full">Add Member</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                     <div className="overflow-x-auto">
                         <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Paid This Month?</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {group.members.map(member => (
                                    <TableRow key={member._id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell>{member.phone}</TableCell>
                                        <TableCell>
                                          {paidThisMonth.some(p => p.memberId._id === member._id) ? 
                                            <span className="flex items-center text-green-600"><Check className="w-4 h-4 mr-2"/> Paid</span> : 
                                            <span className="flex items-center text-yellow-600"><AlertTriangle className="w-4 h-4 mr-2"/> Pending</span>
                                          }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditMember(member)}><Edit className="w-4 h-4"/></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveMember(member._id)}><Trash2 className="w-4 h-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="payments">
                 <Card>
                   <CardHeader>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                         <div>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>Record and view all payments for this group.</CardDescription>
                         </div>
                         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                             <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
                               <DialogTrigger asChild><Button variant="outline" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Record Single</Button></DialogTrigger>
                               <DialogContent>
                                 <DialogHeader><DialogTitle>Record New Payment</DialogTitle></DialogHeader>
                                 <div className="space-y-4 py-4">
                                   <div>
                                     <Label htmlFor="memberId">Member</Label>
                                     <Select onValueChange={(value) => setPaymentDetails(prev => ({...prev, memberId: value}))}><SelectTrigger><SelectValue placeholder="Select a member"/></SelectTrigger><SelectContent>{group.members.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}</SelectContent></Select>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                     <div><Label htmlFor="month">Month</Label><Input id="month" defaultValue={paymentDetails.month} onChange={(e) => setPaymentDetails(prev => ({...prev, month: e.target.value}))}/></div>
                                     <div><Label htmlFor="year">Year</Label><Input id="year" type="number" defaultValue={paymentDetails.year} onChange={(e) => setPaymentDetails(prev => ({...prev, year: parseInt(e.target.value)}))}/></div>
                                   </div>
                                   <Button onClick={handleRecordPayment} className="w-full">Record Payment</Button>
                                 </div>
                               </DialogContent>
                             </Dialog>
                             <Dialog open={isBulkPaymentOpen} onOpenChange={setIsBulkPaymentOpen}>
                                <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Record Bulk</Button></DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader><DialogTitle>Bulk Record Payments</DialogTitle></DialogHeader>
                                    <p className="text-sm text-muted-foreground">Select members who have paid for {currentMonthName} {currentYearValue}.</p>
                                    <div className="max-h-64 overflow-y-auto space-y-2 my-4 pr-2">
                                        {membersToPay.length > 0 ? (
                                            <>
                                                <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer" onClick={() => handleSelectAllForBulk(membersToPay)}>
                                                    <Checkbox id="selectAll" checked={bulkPaymentMembers.length === membersToPay.length && membersToPay.length > 0} />
                                                    <label htmlFor="selectAll" className="font-medium">Select All</label>
                                                </div>
                                                {membersToPay.map(member => (
                                                    <div key={member._id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer" onClick={() => handleBulkMemberSelect(member._id)}>
                                                        <Checkbox id={member._id} checked={bulkPaymentMembers.includes(member._id)} />
                                                        <label htmlFor={member._id}>{member.name}</label>
                                                    </div>
                                                ))}
                                            </>
                                        ) : <p className="text-center text-muted-foreground p-4">All members have paid for this month.</p>}
                                    </div>
                                    <Button onClick={handleBulkRecordPayment} className="w-full" disabled={bulkPaymentMembers.length === 0}>Record for {bulkPaymentMembers.length} Selected</Button>
                                </DialogContent>
                             </Dialog>
                         </div>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <div className="overflow-x-auto">
                         <Table>
                            <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Period</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {group.payments.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                                    <TableRow key={payment._id}>
                                        <TableCell>{payment.memberId.name}</TableCell>
                                        <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{payment.month} {payment.year}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                  </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="withdrawals">
                <Card>
                    <CardHeader>
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                               <CardTitle>Withdrawal History</CardTitle>
                               <CardDescription>Manage this cycle's auction and view past winners.</CardDescription>
                            </div>
                           <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full sm:w-auto" disabled={!!currentCycleWithdrawal || group.currentCycle > group.totalMembers}>
                                        <Landmark className="w-4 h-4 mr-2" /> Record Auction
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Record Cycle {group.currentCycle} Auction</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <Label>Winner</Label>
                                            <Select onValueChange={(value) => setWithdrawalDetails(p => ({...p, winnerId: value}))}>
                                                <SelectTrigger><SelectValue placeholder="Select the winner" /></SelectTrigger>
                                                <SelectContent>
                                                    {group.members.map(m => (
                                                        <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Final Bid Amount</Label>
                                            <Input type="number" placeholder="Enter the winning bid amount" value={withdrawalDetails.bidAmount} onChange={(e) => setWithdrawalDetails(p => ({...p, bidAmount: e.target.value}))}/>
                                            <p className="text-xs text-muted-foreground mt-1">This is the amount the winner receives.</p>
                                        </div>
                                        <Button onClick={handleRecordWithdrawal} className="w-full">Save Withdrawal</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="overflow-x-auto">
                           <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Cycle</TableHead>
                                      <TableHead>Winner</TableHead>
                                      <TableHead>Bid Amount</TableHead>
                                      <TableHead>Foreman Fee</TableHead>
                                      <TableHead>Member Dividend</TableHead>
                                      <TableHead>Date</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {group.withdrawals.slice().sort((a,b) => b.year - a.year || new Date(Date.parse(b.month +" 1, 2012")).getMonth() - new Date(Date.parse(a.month +" 1, 2012")).getMonth()).map((w, index) => (
                                      <TableRow key={w._id}>
                                          <TableCell>{group.withdrawals.length - index}</TableCell>
                                          <TableCell>{w.winnerId.name}</TableCell>
                                          <TableCell>₹{w.bidAmount.toLocaleString()}</TableCell>
                                          <TableCell>₹{w.foremanCommission.toLocaleString()}</TableCell>
                                          <TableCell>₹{w.dividend.toLocaleString()}</TableCell>
                                          <TableCell>{new Date(w.date).toLocaleDateString()}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                       </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Group Settings</CardTitle>
                  <CardDescription>Update the core details of this group.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="groupName">Group Name</Label>
                     <Input id="groupName" value={groupSettings.name} onChange={(e) => setGroupSettings({...groupSettings, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="amountPerCycle">Amount per Cycle (₹)</Label>
                     <Input id="amountPerCycle" type="number" value={groupSettings.amountPerCycle} onChange={(e) => setGroupSettings({...groupSettings, amountPerCycle: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="totalMembers">Total Members</Label>
                     <Input id="totalMembers" type="number" value={groupSettings.totalMembers} onChange={(e) => setGroupSettings({...groupSettings, totalMembers: e.target.value})} />
                   </div>
                   <Button onClick={handleUpdateGroupSettings} className="w-full sm:w-auto">
                     <Save className="w-4 h-4 mr-2" /> Save Changes
                   </Button>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </div>

       {editingMember && (
        <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Member: {editingMember.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" value={editingMember.phone} onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-telegramId">Telegram ID (Optional)</Label>
                <Input id="edit-telegramId" value={editingMember.telegramId || ''} onChange={(e) => setEditingMember({ ...editingMember, telegramId: e.target.value })} />
              </div>
              <Button onClick={handleUpdateMember} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </DashboardLayout>
  )
}

    