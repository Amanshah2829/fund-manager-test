
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Users, DollarSign, Plus, ArrowRight, TrendingUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

interface Group {
  _id: string
  name: string
  amountPerCycle: number
  totalMembers: number
  currentCycle: number
  members: any[]
}

const initialFormState = {
  name: "",
  amountPerCycle: "",
  totalMembers: "",
}

export default function AdminDashboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormState)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/groups")
      if (response.ok) {
        setGroups(await response.json())
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch groups" }));
        toast({ variant: "destructive", title: "Failed to fetch groups", description: errorData.message })
        if (response.status === 401) {
            // The useAuth hook should handle this, but as a backup
            window.location.href = "/login";
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error fetching groups" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if(user) {
      fetchGroups()
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleCreateGroup = async () => {
     if (!user) {
      toast({ variant: "destructive", title: "You must be logged in to create a group." });
      return;
    }
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amountPerCycle: parseFloat(formData.amountPerCycle),
          totalMembers: parseInt(formData.totalMembers),
          cyclePeriod: "monthly",
        }),
      })

      if (response.ok) {
        toast({ title: "Group Created", description: `The group "${formData.name}" has been created.` })
        setIsFormOpen(false)
        setFormData(initialFormState)
        fetchGroups()
      } else {
        const errorData = await response.json();
        toast({ variant: "destructive", title: "Failed to create group", description: errorData.message || "An unknown error occurred." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error creating group" })
    }
  }

  const totalMembers = groups.reduce((sum, group) => sum + group.members.length, 0)
  const totalValue = groups.reduce((sum, group) => sum + (group.amountPerCycle * group.totalMembers), 0);
  const activeMembers = groups.reduce((sum, group) => sum + group.members.length, 0);


  if (loading && !groups.length) { // Show loader only on initial load
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary h-12 w-12" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Foreman Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your chit fund groups.</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Create New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Chit Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name" className="text-right">Group Name</Label>
                  <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Friends & Family Group" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="amountPerCycle" className="text-right">Amount per Cycle (₹)</Label>
                  <Input id="amountPerCycle" type="number" value={formData.amountPerCycle} onChange={handleInputChange} placeholder="e.g., 5000" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="totalMembers" className="text-right">Total Members</Label>
                  <Input id="totalMembers" type="number" value={formData.totalMembers} onChange={handleInputChange} placeholder="e.g., 20" className="mt-1" />
                </div>
                <Button onClick={handleCreateGroup} className="w-full mt-4" size="lg">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{groups.length}</div>
              <p className="text-xs text-muted-foreground">Managed groups</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Chit Value</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">₹{totalValue.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">Across all groups</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{activeMembers}</div>
               <p className="text-xs text-muted-foreground">Currently participating</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Collections</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">₹{groups.reduce((sum, group) => sum + (group.amountPerCycle * group.members.length), 0).toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">Estimated for current cycle</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>My Chit Groups</CardTitle>
            <CardDescription>Click on a group to view details and manage its members and payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px] min-w-[200px]">Group Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Amount/Cycle</TableHead>
                      <TableHead>Current Cycle</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.length > 0 ? groups.map((group) => (
                      <TableRow key={group._id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.members.length} / {group.totalMembers}</TableCell>
                        <TableCell>₹{group.amountPerCycle.toLocaleString()}</TableCell>
                        <TableCell>{group.currentCycle}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/groups/${group._id}`}>
                            <Button variant="outline" size="sm">
                              Manage <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No groups found. Create your first group to get started!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

    