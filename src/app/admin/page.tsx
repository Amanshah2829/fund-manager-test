
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Users, IndianRupee, Landmark } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Header } from "@/components/layout/header"

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
  const { user, loading: authLoading } = useAuth()

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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome, {user?.name.split(' ')[0]}!</h1>
              <p className="text-muted-foreground mt-1">Here's a snapshot of your chit fund activities.</p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Chit Group</DialogTitle>
                  <DialogDescription>Fill in the details to start a new group.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Group Name</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Friends & Family Chit" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="amountPerCycle">Contribution Amount (₹)</Label>
                    <Input id="amountPerCycle" type="number" value={formData.amountPerCycle} onChange={handleInputChange} placeholder="e.g., 5000" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="totalMembers">Number of Members</Label>
                    <Input id="totalMembers" type="number" value={formData.totalMembers} onChange={handleInputChange} placeholder="e.g., 20" className="mt-1" />
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full mt-4">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-none rounded-xl">
            <CardHeader>
                <h2 className="text-2xl font-bold tracking-tight title-highlight">My Chit Groups</h2>
                <p className="text-muted-foreground">Click on a group to view details and manage its members and payments.</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.length > 0 ? groups.map((group) => (
                    <Link href={`/admin/groups/${group._id}`} key={group._id} className="block hover:-translate-y-1 transition-transform duration-200">
                      <Card className="bg-background hover:bg-muted/50 transition-colors h-full flex flex-col">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
                          <CardDescription>
                            ₹{(group.amountPerCycle * group.totalMembers).toLocaleString()} Total Value
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4 text-sm">
                          <div className="flex justify-between items-center">
                              <span className="text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Members</span>
                              <span>{group.members.length} / {group.totalMembers}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-muted-foreground flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Contribution</span>
                              <span>₹{group.amountPerCycle.toLocaleString()}</span>
                          </div>
                           <div className="flex justify-between items-center">
                              <span className="text-muted-foreground flex items-center gap-2"><Landmark className="w-4 h-4" /> Cycle</span>
                              <span>{group.currentCycle} / {group.totalMembers}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16">
                      <p className="text-muted-foreground">No groups found. Create your first group to get started!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
