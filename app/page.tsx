import Link from 'next/link'
import { 
  Wrench, 
  Car, 
  Shield, 
  Clock, 
  Phone, 
  MapPin, 
  Mail, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. NAVBAR */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">GMS Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/track" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Track Vehicle
              </Link>
              <Link href="/login">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                  Staff Login <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Premium Auto Care & <br className="hidden md:block" />
            <span className="text-blue-400">Transparent Service</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Experience the future of garage management. Track your vehicle's repair status in real-time, view inspection photos, and get transparent pricing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/track">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
                Track My Vehicle <Car className="h-5 w-5" />
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2">
                Staff Portal <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. SERVICES SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Expert Services</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">From routine maintenance to complex engine repairs, our certified technicians handle it all with precision.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Engine Diagnostics', desc: 'Advanced computer scanning to pinpoint engine issues accurately.' },
              { title: 'Brake Repair', desc: 'Complete brake pad replacement, rotor resurfacing, and fluid flushes.' },
              { title: 'AC Service', desc: 'Keep your car cool with our comprehensive AC inspection and gas refilling.' },
              { title: 'Oil & Lube', desc: 'Premium synthetic oil changes to keep your engine running smoothly.' }
            ].map((service, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Customers Trust Us</h2>
            <p className="text-slate-600">We believe in transparency, quality, and keeping you informed every step of the way.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Certified Mechanics</h3>
              <p className="text-slate-600">Our team consists of highly trained professionals with years of experience.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Real-Time Tracking</h3>
              <p className="text-slate-600">Track your car's repair status online. No more guessing when it will be ready.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Transparent Pricing</h3>
              <p className="text-slate-600">Detailed digital invoices with photos of replaced parts. No hidden fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">GMS Pro</span>
              </div>
              <p className="text-sm">The most advanced garage management system for modern auto shops.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +92 308 9244041</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@gmspro.com</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 123 Auto Lane, Karachi</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/track" className="hover:text-white transition-colors">Track Vehicle</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Staff Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} GMS Pro Garage Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}