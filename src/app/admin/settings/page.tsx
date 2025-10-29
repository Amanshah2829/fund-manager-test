"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, Bot, KeyRound, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"

interface Settings {
  telegramBotToken?: string;
  telegramChatId?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ telegramBotToken: '', telegramChatId: ''});
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      setIsFetching(true);
      try {
        const response = await fetch('/api/settings');
        if(response.ok) {
          const data = await response.json();
          setSettings(data);
        } else {
           toast({ variant: 'destructive', title: 'Failed to load settings' });
        }
      } catch (error) {
         toast({ variant: 'destructive', title: 'Error loading settings' });
      } finally {
        setIsFetching(false);
      }
    }
    fetchSettings();
  }, [toast]);


  const handleSaveSettings = async () => {
    setIsLoading(true)
    
    const settingsToSave: Settings = { telegramChatId: settings.telegramChatId };
    // Only include the token if it's not the masked value
    if (settings.telegramBotToken && !settings.telegramBotToken.includes('*')) {
      settingsToSave.telegramBotToken = settings.telegramBotToken;
    }

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsToSave)
        });
        if (response.ok) {
            toast({
              title: "Settings Saved",
              description: "Your Telegram integration settings have been updated.",
            });
            // If a new token was saved, update the state to show the masked value
            if (settingsToSave.telegramBotToken) {
              setSettings(prev => ({...prev, telegramBotToken: '********'}));
            }
        } else {
            const errorData = await response.json();
            toast({ variant: 'destructive', title: 'Failed to save settings', description: errorData.message });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error saving settings' });
    } finally {
        setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please ensure the new password and confirmation match.",
      })
      return
    }
    if (!passwordData.currentPassword || !passwordData.newPassword) {
        toast({
            variant: "destructive",
            title: "Missing fields",
            description: "Please fill out all password fields.",
        })
        return
    }

    setIsPasswordLoading(true)
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })
        });
        const result = await response.json();
        if (response.ok) {
            toast({
                title: "Password Updated",
                description: "Your password has been changed successfully.",
            })
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } else {
            toast({
                variant: "destructive",
                title: "Failed to update password",
                description: result.message || "An unknown error occurred.",
            })
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "An unexpected error occurred while changing your password.",
        })
    } finally {
        setIsPasswordLoading(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({...prev, [id]: value}));
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({...prev, [id]: value}));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight title-highlight">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your application and integration settings.</p>
                </div>
                
                {isFetching ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <Card className="bg-card border-none rounded-xl">
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your account's password.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter your current password"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter your new password"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Confirm your new password"
                        />
                        </div>
                        <Button onClick={handlePasswordChange} disabled={isPasswordLoading}>
                        {isPasswordLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Change Password
                        </Button>
                    </CardContent>
                    </Card>

                    <Card className="bg-card border-none rounded-xl">
                    <CardHeader>
                        <CardTitle>Telegram Integration</CardTitle>
                        <CardDescription>Connect your bot to send notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
                        <Input
                            id="telegramBotToken"
                            type="password"
                            value={settings.telegramBotToken || ''}
                            onChange={handleInputChange}
                            placeholder="Enter new token to update"
                            onFocus={(e) => {
                            if(e.target.value.includes('*')) {
                                setSettings(prev => ({...prev, telegramBotToken: ''}))
                            }
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Your token is secret. It is stored securely.
                        </p>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="telegramChatId">Admin Group/Channel ID</Label>
                        <Input
                            id="telegramChatId"
                            value={settings.telegramChatId || ''}
                            onChange={handleInputChange}
                            placeholder="Enter the target chat ID or channel ID"
                        />
                        <p className="text-xs text-muted-foreground">
                            This is where admin-level notifications will be sent.
                        </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleSaveSettings} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Settings
                            </Button>
                            <Link href="/admin/settings/telegram-logs" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full">
                                    View Logs <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                    </Card>
                </div>
                )}
            </div>
        </main>
    </div>
  )
}
