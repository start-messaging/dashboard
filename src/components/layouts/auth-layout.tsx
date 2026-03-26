import { Outlet, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left Side: Branding & Info */}
      <div className="hidden w-1/2 flex-col justify-between bg-blue-950 p-12 lg:flex relative overflow-hidden">
        {/* Background Image/Overlay */}
        <div className="absolute inset-0 opacity-40">
           <img 
            src="/auth_illustration_mockup_1773600554660.png" 
            alt="StartMessaging Background" 
            className="h-full w-full object-cover grayscale-[0.5] brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-950 via-blue-950/80 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xl font-bold text-white">
          <AppIcon className="h-8 w-8 text-primary" stroke='white' />
          <span>StartMessaging</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Build powerful messaging <br />
            experiences in minutes.
          </h2>
          
          <ul className="space-y-4">
            {[
              'Enterprise-grade OTP delivery',
              'Global SMS & Dynamic WhatsApp APIs',
              'Real-time delivery analytics',
              'Developer-first SDKs and documentation',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-zinc-400">
                <CheckCircle2 className="h-5 w-5 text-primary" stroke='white' />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-zinc-500">
          <span>© 2026 StartMessaging Inc.</span>
          <Link to="#" className="hover:text-zinc-300">Privacy Policy</Link>
          <Link to="#" className="hover:text-zinc-300">Terms of Service</Link>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2 text-xl font-bold">
              <AppIcon className="h-7 w-7 text-primary" stroke='blue' />
              <span className='text-blue-950'>StartMessaging</span>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
