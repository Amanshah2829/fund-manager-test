
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Users, IndianRupee, Plus, Trash2, ArrowLeft, ChevronsRight, Edit, Save, Landmark, FileCog, Banknote, History, Download, Filter, Bot, Link as LinkIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface Member {
  _id: string
  name: string
  phone: string
  telegramId?: string
  telegramLinkCode?: string
}

interface Payment {
  _id: string;
  memberId: {
    _id:string;
    name: string;
  } | null;
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
  } | null;
  type: 'auction' | 'fcfs';
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

  const [newMember, setNewMember] = useState({ name: "", phone: "" })
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({ memberId: "", month: currentMonthName, year: currentYearValue })
  const [bulkPaymentMembers, setBulkPaymentMembers] = useState<string[]>([])
  const [withdrawalDetails, setWithdrawalDetails] = useState({ winnerId: "", bidAmount: "", type: "auction" })
  const [groupSettings, setGroupSettings] = useState({ name: "", amountPerCycle: "" });


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
  }, [groupId, toast])
  
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
        setNewMember({ name: "", phone: "" })
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
      const body = {
        winnerId: withdrawalDetails.winnerId,
        type: withdrawalDetails.type,
        bidAmount: withdrawalDetails.type === 'auction' ? parseFloat(withdrawalDetails.bidAmount) : undefined,
        month: currentMonthName,
        year: currentYearValue,
      };

      const response = await fetch(`/api/groups/${groupId}/withdrawals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({ title: 'Withdrawal Recorded' });
        setIsWithdrawalOpen(false);
        setWithdrawalDetails({ winnerId: '', bidAmount: '', type: 'auction' });
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
    if (!confirm('Are you sure you want to advance to the next cycle? This will lock the current cycle\'s auction and payments.')) return;
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
  
  const renderLoading = () => (
    <div className="flex justify-center items-center h-full py-32">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  )

  if (loading || !group) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {renderLoading()}
            </main>
        </div>
    )
  }
  
  const paidThisMonth = group.payments.filter(p => p.month === currentMonthName && p.year === currentYearValue);
  const totalCollected = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);
  const totalPot = group.amountPerCycle * group.totalMembers;
  const membersToPay = group.members.filter(member => !paidThisMonth.some(p => p.memberId && p.memberId._id === member._id));
  
  const currentCycleWithdrawal = group.withdrawals.find(
    w => w.month === currentMonthName && w.year === currentYearValue
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-10 w-10" asChild>
                        <Link href="/admin"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                         <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{group.name}</h1>
                         <p className="text-muted-foreground text-sm">Group Details</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                       <Filter className="w-4 h-4 mr-2" />
                       This Year
                    </Button>
                    <Button>
                       <Download className="w-4 h-4 mr-2" />
                       Download Info
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Group Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <Card className="p-6">
                         <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Group Pot</CardTitle>
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </div>
                         <div className="text-2xl font-bold">₹{totalPot.toLocaleString()}</div>
                         <p className="text-xs text-muted-foreground">Full Chit Value</p>
                    </Card>
                     <Card className="p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{group.members.length} / {group.totalMembers}</div>
                        <p className="text-xs text-muted-foreground">Currently in group</p>
                    </Card>
                    <Card className="p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Collections ({currentMonthName})</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">₹{totalCollected.toLocaleString()}</div>
                         <p className="text-xs text-muted-foreground">{paidThisMonth.length} of {group.members.length} paid</p>
                    </Card>
                     <Card className="p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Cycle</CardTitle>
                            <ChevronsRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{group.currentCycle} of {group.totalMembers}</div>
                        <p className="text-xs text-muted-foreground">Month {group.currentCycle} in progress</p>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                 <Tabs defaultValue="members" className="w-full">
                    <CardHeader>
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Group Management</h2>
                            </div>
                            <TabsList>
                                <TabsTrigger value="members"><Users className="w-4 h-4 mr-2"/>Members</TabsTrigger>
                                <TabsTrigger value="payments"><History className="w-4 h-4 mr-2"/>Payments</TabsTrigger>
                                <TabsTrigger value="withdrawals"><Landmark className="w-4 h-4 mr-2"/>Auctions</TabsTrigger>
                                <TabsTrigger value="settings"><FileCog className="w-4 h-4 mr-2"/>Settings</TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>
                    
                    <CardContent>
                        <TabsContent value="members">
                            <div className="flex justify-end mb-4">
                                <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                    <div><Label htmlFor="name">Name</Label><Input id="name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Enter member's full name" /></div>
                                    <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="Enter 10-digit mobile number" /></div>
                                    <Button onClick={handleAddMember} className="w-full">Add Member</Button>
                                    </div>
                                </DialogContent>
                                </Dialog>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Telegram</TableHead><TableHead>Payment ({currentMonthName})</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {group.members.map(member => (
                                            <TableRow key={member._id}>
                                                <TableCell className="font-medium">{member.name}</TableCell>
                                                <TableCell>{member.phone}</TableCell>
                                                <TableCell>
                                                    {member.telegramId ? (
                                                        <Badge variant="outline" className="bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-600/50">
                                                            <Bot className="w-3.5 h-3.5 mr-1.5"/> Linked
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <LinkIcon className="w-3.5 h-3.5 mr-1.5"/>
                                                            Code: {member.telegramLinkCode}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                {paidThisMonth.some(p => p.memberId && p.memberId._id === member._id) ? 
                                                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-600/50">Paid</Badge> : 
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600/50">Pending</Badge>
                                                }
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditMember(member)}><Edit className="w-4 h-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleRemoveMember(member._id)}><Trash2 className="w-4 h-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {group.members.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">No members yet.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="payments">
                             <div className="flex justify-end gap-2 mb-4">
                                <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
                                    <DialogTrigger asChild><Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Record Single</Button></DialogTrigger>
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
                                    <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Record Bulk</Button></DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                        <DialogTitle>Bulk Record Payments</DialogTitle>
                                        <CardDescription>Select members who have paid for {currentMonthName} {currentYearValue}.</CardDescription>
                                        </DialogHeader>
                                        <div className="max-h-64 overflow-y-auto space-y-1 my-4 pr-2">
                                            {membersToPay.length > 0 ? (
                                                <>
                                                    <div className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => handleSelectAllForBulk(membersToPay)}>
                                                        <Checkbox id="selectAll" checked={bulkPaymentMembers.length === membersToPay.length && membersToPay.length > 0} onCheckedChange={() => handleSelectAllForBulk(membersToPay)} />
                                                        <label htmlFor="selectAll" className="font-medium cursor-pointer">Select All Pending</label>
                                                    </div>
                                                    {membersToPay.map(member => (
                                                        <div key={member._id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => handleBulkMemberSelect(member._id)}>
                                                            <Checkbox id={member._id} checked={bulkPaymentMembers.includes(member._id)} onCheckedChange={() => handleBulkMemberSelect(member._id)} />
                                                            <label htmlFor={member._id} className="cursor-pointer">{member.name}</label>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : <p className="text-center text-muted-foreground p-4">All members have paid for this month.</p>}
                                        </div>
                                        <Button onClick={handleBulkRecordPayment} className="w-full" disabled={bulkPaymentMembers.length === 0}>Record for {bulkPaymentMembers.length} Selected</Button>
                                    </DialogContent>
                                </Dialog>
                             </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Period</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {group.payments.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                                            <TableRow key={payment._id}>
                                                <TableCell>{payment.memberId?.name || "Deleted Member"}</TableCell>
                                                <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                                                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{payment.month} {payment.year}</TableCell>
                                            </TableRow>
                                        ))}
                                        {group.payments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No payments recorded yet.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="withdrawals">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                {group.currentCycle < group.totalMembers && (
                                    <Button onClick={handleNextCycle} variant="outline">
                                        <ChevronsRight className="w-4 h-4 mr-2"/>
                                        Advance to Cycle {group.currentCycle + 1}
                                    </Button>
                                )}
                                </div>
                                <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
                                    <DialogTrigger asChild>
                                        <Button disabled={!!currentCycleWithdrawal || group.currentCycle > group.totalMembers}>
                                            <Landmark className="w-4 h-4 mr-2" /> Record Withdrawal
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Record Cycle {group.currentCycle} Withdrawal</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Withdrawal Type</Label>
                                                <ToggleGroup 
                                                    type="single" 
                                                    defaultValue="auction" 
                                                    className="w-full grid grid-cols-2"
                                                    onValueChange={(value) => setWithdrawalDetails(p => ({...p, type: value || 'auction'}))}
                                                >
                                                    <ToggleGroupItem value="auction" aria-label="Toggle auction">Auction</ToggleGroupItem>
                                                    <ToggleGroupItem value="fcfs" aria-label="Toggle FCFS">FCFS</ToggleGroupItem>
                                                </ToggleGroup>
                                            </div>
                                            
                                            <div>
                                                <Label>Winner / Recipient</Label>
                                                <Select onValueChange={(value) => setWithdrawalDetails(p => ({...p, winnerId: value}))}>
                                                    <SelectTrigger><SelectValue placeholder="Select the member" /></SelectTrigger>
                                                    <SelectContent>
                                                        {group.members
                                                            .filter(m => !group.withdrawals.some(w => w.winnerId && w.winnerId._id === m._id))
                                                            .map(m => (
                                                            <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {withdrawalDetails.type === 'auction' && (
                                                <div>
                                                    <Label>Final Bid Amount</Label>
                                                    <Input type="number" placeholder="Enter the winning bid amount" value={withdrawalDetails.bidAmount} onChange={(e) => setWithdrawalDetails(p => ({...p, bidAmount: e.target.value}))}/>
                                                    <p className="text-xs text-muted-foreground mt-1">This is the amount the winner receives.</p>
                                                </div>
                                            )}
                                            <Button onClick={handleRecordWithdrawal} className="w-full">Save Withdrawal</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cycle</TableHead>
                                        <TableHead>Winner</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Prize Amount</TableHead>
                                        <TableHead>Foreman Fee</TableHead>
                                        <TableHead>Member Dividend</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.withdrawals.slice().sort((a,b) => b.year - a.year || new Date(Date.parse(b.month +" 1, 2012")).getMonth() - new Date(Date.parse(a.month +" 1, 2012")).getMonth()).map((w, index) => (
                                        <TableRow key={w._id}>
                                            <TableCell>{group.withdrawals.length - index}</TableCell>
                                            <TableCell>{w.winnerId?.name || "Deleted Member"}</TableCell>
                                            <TableCell><Badge variant={w.type === 'auction' ? 'default' : 'secondary'} className="capitalize">{w.type}</Badge></TableCell>
                                            <TableCell>₹{w.bidAmount.toLocaleString()}</TableCell>
                                            <TableCell>₹{w.foremanCommission.toLocaleString()}</TableCell>
                                            <TableCell>₹{w.dividend.toLocaleString()}</TableCell>
                                            <TableCell>{new Date(w.date).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {group.withdrawals.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-24">No auctions or withdrawals recorded yet.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings">
                            <div className="space-y-6 max-w-lg mx-auto py-8">
                                <div className="space-y-2">
                                    <Label htmlFor="groupName">Group Name</Label>
                                    <Input id="groupName" value={groupSettings.name} onChange={(e) => setGroupSettings({...groupSettings, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amountPerCycle">Amount per Cycle (₹)</Label>
                                    <Input id="amountPerCycle" type="number" value={groupSettings.amountPerCycle} onChange={(e) => setGroupSettings({...groupSettings, amountPerCycle: e.target.value})} />
                                </div>
                                <Button onClick={handleUpdateGroupSettings} className="w-full sm:w-auto">
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </Button>
                            </div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </main>

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
                    <Label htmlFor="edit-telegramId">Telegram User ID (Optional)</Label>
                    <Input id="edit-telegramId" value={editingMember.telegramId || ''} onChange={(e) => setEditingMember({ ...editingMember, telegramId: e.target.value })} placeholder="e.g., 123456789. Get via @userinfobot"/>
                    <p className="text-xs text-muted-foreground mt-1">This ID is linked automatically. Edit only if necessary.</p>
                </div>
                <Button onClick={handleUpdateMember} className="w-full">Save Changes</Button>
                </div>
            </DialogContent>
            </Dialog>
        )}
    </div>
  )
}

    