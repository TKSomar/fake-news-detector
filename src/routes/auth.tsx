import { usePuterStore } from '@/lib/puter';
import { createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react';

const Auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const next = (typeof location.search === 'string' ? location.search : '').split('next=')[1];
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.isAuthenticated) navigate({ to: next });
    }, [auth.isAuthenticated, next])

    return (
        <main className="bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        {auth.isAuthenticated ? (
                            <h2>You are logged in.</h2>
                        ) : (
                            <h2>Log in to detect fake news.</h2>   
                        )}
                    </div>
                    <div>
                        {isLoading ? (
                            <button className="auth-button animate-pulse">
                                <p>Signing you in...</p>
                            </button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    <button className="auth-button" onClick={auth.signOut}>
                                        <p>Log Out</p>
                                    </button>
                                ) : (
                                    <button className="auth-button" onClick={auth.signIn}>
                                        <p>Log In</p>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}

export const Route = createFileRoute('/auth')({
  component: Auth,
})
