import Link from 'next/link'
import { 
  Wrench, Car, Shield, Clock, Phone, Mail, MapPin, 
  CheckCircle, Star, ArrowRight, Calendar, Users, Award,
  TrendingUp, Zap, Heart
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">GMS Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#services" className="hover:text-blue-600">Services</a>
            <a href="#why-us" className="hover:text-blue-600">Why Us</a>
            <a href="#contact" className="hover:text-blue-600">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/customer/login">
              <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg">
                Customer Login
              </button>
            </Link>
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg">
                Staff Login
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-linear-to-br from-blue-600 via-blue-700 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-sm mb-6">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span>Trusted by 1000+ customers</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Professional Auto Care You Can Trust
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                From routine maintenance to complex repairs, our certified technicians deliver quality service with transparency and care.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/customer/login">
                  <button className="w-full sm:w-auto px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2 shadow-lg">
                    Access Customer Portal <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <a href="#services" className="w-full sm:w-auto px-6 py-3 bg-white/10 backdrop-blur text-white font-semibold rounded-lg hover:bg-white/20 flex items-center justify-center gap-2">
                  Explore Services
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-3xl"></div>
                <div className="relative bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20">
                  <Car className="h-32 w-32 text-white mx-auto mb-4" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold">15+</p>
                      <p className="text-sm text-blue-200">Years Experience</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">5000+</p>
                      <p className="text-sm text-blue-200">Cars Serviced</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">98%</p>
                      <p className="text-sm text-blue-200">Happy Clients</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Services</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Comprehensive automotive services to keep your vehicle running smoothly
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Wrench, title: 'General Service', desc: 'Complete vehicle inspection and maintenance', color: 'blue' },
              { icon: Car, title: 'Engine Repair', desc: 'Expert diagnostics and engine repairs', color: 'green' },
              { icon: Shield, title: 'Brake Service', desc: 'Brake inspection, repair and replacement', color: 'red' },
              { icon: Clock, title: 'AC Service', desc: 'AC repair, gas refill and maintenance', color: 'cyan' },
              { icon: Award, title: 'Electrical Work', desc: 'Battery, alternator and wiring services', color: 'yellow' },
              { icon: Users, title: 'Tire Service', desc: 'Tire replacement, balancing and alignment', color: 'purple' },
              { icon: CheckCircle, title: 'Suspension', desc: 'Shock absorbers and suspension repair', color: 'orange' },
              { icon: Calendar, title: 'Transmission', desc: 'Gearbox repair and transmission service', color: 'pink' },
            ].map((service, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:shadow-xl transition-all group">
                <div className={`h-14 w-14 bg-${service.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`h-7 w-7 text-${service.color}-600`} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{service.title}</h3>
                <p className="text-sm text-slate-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose GMS Pro?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              We're committed to providing the best automotive service experience
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Certified Technicians', desc: 'Our team consists of trained and certified mechanics with years of experience', color: 'blue' },
              { icon: Clock, title: 'Transparent Process', desc: 'Real-time updates on your vehicle service status from inspection to completion', color: 'green' },
              { icon: Award, title: 'Quality Guaranteed', desc: 'We use genuine parts and provide warranty on all our services', color: 'yellow' },
            ].map((feature, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors">
                <div className={`h-16 w-16 bg-${feature.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Zap className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Experience Quality Service?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied customers who trust GMS Pro for their vehicle care
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/customer/login">
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2 shadow-xl text-lg">
                <Heart className="h-5 w-5" />
                Access Your Portal
              </button>
            </Link>
            <a href="#contact" className="w-full sm:w-auto px-8 py-4 bg-blue-800 text-white font-bold rounded-lg hover:bg-blue-900 flex items-center justify-center gap-2 text-lg">
              <Phone className="h-5 w-5" />
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Visit Us Today</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Drop by our garage or get in touch with us
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-slate-800 rounded-2xl">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-2">Location</h3>
              <p className="text-slate-400 text-sm">123 Auto Lane, Karachi, Pakistan</p>
            </div>
            <div className="text-center p-6 bg-slate-800 rounded-2xl">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-2">Phone</h3>
              <p className="text-slate-400 text-sm">+92 300 1234567</p>
            </div>
            <div className="text-center p-6 bg-slate-800 rounded-2xl">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-2">Email</h3>
              <p className="text-slate-400 text-sm">info@gmspro.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">GMS Pro</span>
          </div>
          <p className="text-sm">© 2026 GMS Pro Garage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}