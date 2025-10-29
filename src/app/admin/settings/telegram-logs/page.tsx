"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, BadgeCheck, BadgeAlert } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"

interface Member {
  name: string;
}

interface Log {
  _id: string;
  timestamp: string;
  recipient: string;
  message: string;
  status: 'Success' | 'Failed';
  error?: string;
  memberId?: Member;
}

export default function TelegramLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings/telegram-logs');
        if(response.ok) {
          setLogs(await response.json());
        } else {
           toast({ variant: 'destructive', title: 'Failed to load logs' });
        }
      } catch (error) {
         toast({ variant: 'destructive', title: 'Error loading logs' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, [toast]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
            <div>
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href="/admin/settings">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Settings
                </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight title-highlight">Telegram Notification Logs</h1>
            <p className="text-muted-foreground mt-1">A history of the last 100 notifications sent by the system.</p>
            </div>
            
            <Card className="bg-card border-none rounded-xl">
                <CardContent className="p-6">
                    {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[180px]">Timestamp</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length > 0 ? logs.map(log => (
                            <TableRow key={log._id}>
                                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{log.memberId?.name || 'Admin'}</div>
                                    <div className="text-xs text-muted-foreground">{log.recipient}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={log.status === 'Success' ? 'default' : 'destructive'} className={log.status === 'Success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                        {log.status === 'Success' ? <BadgeCheck className="w-3.5 h-3.5 mr-1.5" /> : <BadgeAlert className="w-3.5 h-3.5 mr-1.5" />}
                                        {log.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                    <p className="truncate max-w-xs">{log.message}</p>
                                    {log.error && <p className="text-destructive text-xs mt-1">{log.error}</p>}
                                </TableCell>
                            </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No logs found. Notifications will appear here as they are sent.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}
