import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader } from "../ui/loader";
import { AlertCircle } from "lucide-react";

interface LoginFormProps {
    onLogin: (user: string, pass: string) => Promise<boolean>;
    isLoading: boolean;
}

export function LoginForm({ onLogin, isLoading: isAuthLoading }: LoginFormProps) {
    const [username, setUsername] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        const success = await onLogin(username, appPassword);
        if (!success) {
            setTimeout(() => {
               setError('Invalid username or password. Please try again.');
               setIsSubmitting(false);
            }, 500);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Provider Login</CardTitle>
                    <CardDescription className="text-center">Access your booking dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                         <Alert variant="destructive" className="mb-4">
                             <AlertCircle className="h-4 w-4" />
                             <AlertTitle>Login Failed</AlertTitle>
                             <AlertDescription>{error}</AlertDescription>
                         </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="username">Username</Label>
                            <Input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="password">Application Password</Label>
                            <Input type="password" id="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} required />
                             <p className="text-xs text-muted-foreground pt-1">This is not your main WordPress password. <a href="#" className="underline">Learn more</a>.</p>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting || isAuthLoading}>
                            {(isSubmitting || isAuthLoading) ? <Loader size="w-5 h-5" /> : "Login"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

