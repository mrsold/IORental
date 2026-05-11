/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent, useRef, RefObject } from 'react';
import emailjs from '@emailjs/browser';
import { 
  Home, 
  Settings, 
  Info, 
  User, 
  Mail, 
  CheckCircle, 
  Scale, 
  Wrench, 
  ClipboardCheck, 
  Star, 
  Menu, 
  X, 
  Phone, 
  MapPin, 
  Clock, 
  Building2, 
  Users, 
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Facebook,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { translations } from './translations';

type Section = 'home' | 'services' | 'about' | 'tenant' | 'contact' | 'privacy' | 'terms';
type Language = 'en' | 'zh';

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState<'owner' | 'tenant'>('owner');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Bot protection state
  const [humanCheck, setHumanCheck] = useState({ a: 0, b: 0, answer: '' });
  const [isHumanVerified, setIsHumanVerified] = useState(false);

  const contactFormRef = useRef<HTMLFormElement>(null);
  const tenantFormRef = useRef<HTMLFormElement>(null);
  const analysisFormRef = useRef<HTMLFormElement>(null);

  // Generate new math challenge
  const generateMathChallenge = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setHumanCheck({ a, b, answer: '' });
    setIsHumanVerified(false);
  };

  useEffect(() => {
    generateMathChallenge();
  }, []);

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const showSection = (section: Section) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
    setFormSubmitted(false);
    setSubmitError(null);
  };

  const handleEmailSubmit = async (e: FormEvent, formRef: RefObject<HTMLFormElement | null>, collectionName: string = 'inquiries') => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());

    // 1. Bot Protection Check
    if (data.website) {
      console.log('Bot detected via honeypot');
      return; 
    }

    // 2. Data Validation Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

    if (!emailRegex.test(data.email as string)) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    if (data.phone && !phoneRegex.test(data.phone as string)) {
      setSubmitError('Please enter a valid 10-digit phone number (e.g., 415-555-0000).');
      return;
    }

    // Math Challenge check
    if (parseInt(data.human_answer as string) !== (humanCheck.a + humanCheck.b)) {
      setSubmitError('Incorrect verification answer. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const SERVICE_ID = 'service_fyq08k7'; 
      const TEMPLATE_ID = 'template_1p19z8m'; 
      const PUBLIC_KEY = 'L_UXs52Uxy8mBk64h'; 
      
      // 1. Save to Firebase Firestore
      try {
        const payload: any = {
          email: data.email,
          phone: data.phone || '',
          createdAt: serverTimestamp(),
          status: 'new',
          language: language
        };

        if (collectionName === 'rent_estimates') {
          payload.address = data.address;
          payload.property_type = data.property_type;
          payload.beds = data.beds;
          payload.baths = data.baths;
          payload.type = 'rent_estimate';
        } else {
          payload.first_name = data.first_name;
          payload.last_name = data.last_name;
          payload.address = data.address || '';
          payload.inquiry_type = data.inquiry_type || 'tenant';
          payload.request_type = data.request_type || '';
          payload.message = data.message;
        }

        await addDoc(collection(db, collectionName), payload);
      } catch (dbError) {
        console.error('Firestore Error:', dbError);
      }

      // 2. Send via EmailJS
      const templateParams = {
        name: data.first_name ? `${data.first_name} ${data.last_name}` : 'Rent Estimate Request',
        email: data.email,
        phone: data.phone,
        address: data.address,
        type: data.inquiry_type || data.request_type || data.property_type || 'Rent Estimate',
        message: data.message || `Rent Estimate Request: ${data.beds}bd/${data.baths}ba ${data.property_type}`,
        time: new Date().toLocaleString('en-US', { 
          timeZone: 'America/Los_Angeles',
          dateStyle: 'full', 
          timeStyle: 'long' 
        })
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

      setFormSubmitted(true);
      formRef.current.reset();
      generateMathChallenge(); 
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (error) {
      console.error('EmailJS Error:', error);
      setSubmitError('Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A2E] font-sans selection:bg-[#C9A84C]/30">
      {/* Navigation */}
      <nav className="w-full bg-[#0E1F3D] border-b border-[#C9A84C]/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-[68px] flex items-center justify-between">
          <div 
            className="flex flex-col cursor-pointer group" 
            onClick={() => showSection('home')}
          >
            <span className="font-serif text-[#C9A84C] text-lg tracking-wide leading-tight group-hover:text-[#F0DFA0] transition-colors">
              STAR REALTY
            </span>
            <span className="text-white/50 text-[10px] tracking-[0.12em] uppercase">
              SF Bay Area · Since 2002
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10 mr-4">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded transition-all ${language === 'en' ? 'bg-[#C9A84C] text-[#0E1F3D]' : 'text-white/40 hover:text-white/70'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded transition-all ${language === 'zh' ? 'bg-[#C9A84C] text-[#0E1F3D]' : 'text-white/40 hover:text-white/70'}`}
              >
                中文
              </button>
            </div>
            {(['home', 'services', 'about', 'tenant', 'contact'] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => showSection(s)}
                className={`text-[13px] font-medium tracking-wide transition-colors ${
                  activeSection === s ? 'text-[#C9A84C]' : 'text-white/75 hover:text-[#C9A84C]'
                }`}
              >
                {t.nav[s as keyof typeof t.nav]}
              </button>
            ))}
            <button 
              onClick={() => showSection('contact')}
              className="bg-[#C9A84C] hover:bg-[#F0DFA0] text-[#0E1F3D] px-5 py-2 rounded font-semibold text-[13px] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.nav.quote}
            </button>
          </div>

          <button 
            className="md:hidden text-white/75"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-[68px] left-0 w-full bg-[#0E1F3D] border-b border-[#C9A84C]/20 z-40 p-6 flex flex-col gap-4"
          >
            {(['home', 'services', 'about', 'tenant', 'contact'] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => showSection(s)}
                className={`text-left text-sm py-2 border-b border-white/5 capitalize ${
                  activeSection === s ? 'text-[#C9A84C]' : 'text-white/75'
                }`}
              >
                {s === 'tenant' ? 'Tenant Portal' : s === 'about' ? 'About Us' : s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {activeSection === 'home' && (
            <motion.section
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              {/* Hero */}
              <div className="w-full bg-[#0E1F3D] relative overflow-hidden">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center px-6 md:px-16 py-12 md:py-24 gap-12 relative z-10">
                  <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] border border-[#C9A84C]/10 rounded-full pointer-events-none" />
                  
                  <div className="relative z-10">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-1.5 rounded-full mb-6"
                    >
                      <span className="text-[#C9A84C] text-[11px] font-semibold tracking-widest uppercase">
                        {t.hero.badge}
                      </span>
                    </motion.div>
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="font-serif text-white text-4xl md:text-6xl font-bold leading-tight mb-6"
                    >
                      {t.hero.title}<span className="text-[#C9A84C] italic">{t.hero.titleItalic}</span>
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-white/60 text-lg font-light leading-relaxed mb-8 max-w-lg"
                    >
                      {t.hero.subtitle}
                    </motion.p>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-4"
                    >
                      <button 
                        onClick={() => showSection('contact')}
                        className="bg-[#C9A84C] hover:bg-[#F0DFA0] text-[#0E1F3D] px-8 py-3.5 rounded font-bold text-sm transition-all shadow-lg shadow-[#C9A84C]/10"
                      >
                        {t.hero.ctaConsultation}
                      </button>
                      <button 
                        onClick={() => {
                          const el = document.getElementById('rental-analysis');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="border border-white/30 hover:border-[#C9A84C] hover:text-[#C9A84C] text-white px-8 py-3.5 rounded font-medium text-sm transition-all"
                      >
                        {t.analysis.title}
                      </button>
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="hidden md:flex flex-col gap-4 relative z-10"
                  >
                    <div className="rounded-xl overflow-hidden border border-[#C9A84C]/20 shadow-2xl">
                      <img 
                        src="https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=1200&q=80" 
                        alt="SF Bay Area Property" 
                        className="w-full h-[300px] object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-[#C9A84C]/20 p-6 rounded-xl backdrop-blur-sm">
                        <div className="font-serif text-[#C9A84C] text-4xl font-bold mb-1">{t.hero.expTitle}</div>
                        <div className="text-white/50 text-xs uppercase tracking-wider">{t.hero.expSub}</div>
                      </div>
                      <div className="bg-white/5 border border-[#C9A84C]/20 p-6 rounded-xl backdrop-blur-sm">
                        <div className="font-serif text-[#C9A84C] text-4xl font-bold mb-1">{t.hero.feeTitle}</div>
                        <div className="text-white/50 text-xs uppercase tracking-wider">{t.hero.feeSub}</div>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-[#C9A84C]/20 p-6 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <Scale className="text-[#C9A84C]" size={24} />
                        <div className="text-white/80 text-sm font-medium">{t.hero.legalSupport}</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Trust Bar */}
              <div className="w-full bg-[#1A3260] border-y border-[#C9A84C]/20 py-6">
                <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-wrap justify-center gap-8 md:gap-16">
                  {[
                    { icon: CheckCircle, text: t.trust.licensed },
                    { icon: Scale, text: t.trust.eviction },
                    { icon: Wrench, text: t.trust.contractors },
                    { icon: ClipboardCheck, text: t.trust.lease },
                    { icon: Star, text: t.trust.specialists }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/70 text-sm font-medium">
                      <div className="w-8 h-8 bg-[#C9A84C]/15 rounded-full flex items-center justify-center text-[#C9A84C]">
                        <item.icon size={16} />
                      </div>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Column */}
              <div className="w-full max-w-6xl mx-auto bg-white shadow-sm mt-8 mb-12">
                {/* Services Preview */}
                <div className="py-20 px-6 md:px-12">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                      <p className="text-[#8A6820] text-[11px] font-bold tracking-[0.2em] uppercase mb-3">{t.home.offerBadge}</p>
                      <h2 className="font-serif text-[#0E1F3D] text-3xl md:text-5xl font-bold mb-4">{t.home.offerTitle}</h2>
                      <p className="text-slate-600 text-lg font-light max-w-2xl mx-auto">{t.home.offerDesc}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                      {[
                        {
                          title: 'Tenant Placement',
                          price: '$800',
                          sub: 'flat fee',
                          desc: 'We find, screen, and place quality tenants — fast.',
                          items: ['Multi-platform marketing', 'Background & credit screening', 'Lease preparation'],
                          icon: Home,
                          img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'
                        },
                        {
                          title: 'Property Management',
                          price: '6.5%',
                          sub: 'monthly rent',
                          desc: 'Full-service management so you can be hands-off.',
                          items: ['Rent collection', 'Maintenance coordination', 'Tenant communication'],
                          icon: Building2,
                          img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
                        },
                        {
                          title: 'Maintenance',
                          price: 'On-demand',
                          sub: '',
                          desc: 'Fast repairs through our vetted contractor network.',
                          items: ['Trusted handymen', 'Fast response times', 'Transparent reporting'],
                          icon: Wrench,
                          img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'
                        }
                      ].map((service, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ y: -8 }}
                          className="bg-white rounded-xl overflow-hidden border border-[#C9A84C]/20 shadow-sm hover:shadow-xl transition-all group"
                        >
                          <div className="h-40 overflow-hidden relative">
                            <img 
                              src={service.img} 
                              alt={service.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                          </div>
                          <div className="p-8">
                            <div className="w-12 h-12 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center text-[#C9A84C] mb-6">
                              <service.icon size={24} />
                            </div>
                            <h3 className="font-serif text-[#0E1F3D] text-xl font-bold mb-2">{service.title}</h3>
                            <div className="flex items-baseline gap-2 mb-4">
                              <span className="text-2xl font-bold text-[#8A6820]">{service.price}</span>
                              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{service.sub}</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">{service.desc}</p>
                            <ul className="space-y-3">
                              {service.items.map((item, j) => (
                                <li key={j} className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                                  <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Free Rental Analysis Section */}
                <div id="rental-analysis" className="py-24 bg-[#0E1F3D] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
                  <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                      <div>
                        <p className="text-[#C9A84C] text-[11px] font-bold tracking-[0.2em] uppercase mb-4">{t.analysis.badge}</p>
                        <h2 className="font-serif text-white text-4xl md:text-5xl font-bold mb-6 italic leading-[1.1]">
                          How much could you earn <span className="text-[#C9A84C]">every month?</span>
                        </h2>
                        <p className="text-white/60 text-lg font-light leading-relaxed mb-8">
                          {t.analysis.desc}
                        </p>
                        <div className="space-y-6">
                          {[
                            { title: 'Market Trends', desc: 'Current Bay Area rental rates' },
                            { title: 'Optimization', desc: 'Tips to increase your ROI' },
                            { title: 'No Commitment', desc: '100% free, no strings attached' }
                          ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="w-6 h-6 bg-[#C9A84C]/20 rounded-full flex items-center justify-center text-[#C9A84C] shrink-0">
                                <CheckCircle size={14} />
                              </div>
                              <div>
                                <h4 className="text-white font-bold text-sm">{item.title}</h4>
                                <p className="text-white/40 text-xs">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl relative">
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#C9A84C] rounded-full flex items-center justify-center text-[#0E1F3D] rotate-12 shadow-xl hidden md:flex">
                          <div className="text-center">
                            <div className="font-bold text-xl uppercase leading-none">Free</div>
                            <div className="text-[10px] font-medium uppercase tracking-widest">Report</div>
                          </div>
                        </div>
                        
                        {formSubmitted ? (
                          <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                              <CheckCircle size={40} />
                            </div>
                            <h3 className="text-[#0E1F3D] font-serif text-2xl font-bold mb-4">Request Received!</h3>
                            <p className="text-slate-600">Our specialists are preparing your custom analysis now.</p>
                          </div>
                        ) : (
                          <form 
                            ref={analysisFormRef}
                            onSubmit={(e) => handleEmailSubmit(e, analysisFormRef, 'rent_estimates')}
                            className="space-y-5"
                          >
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#0E1F3D] uppercase tracking-wider">{t.analysis.form.address}</label>
                              <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                <input name="address" type="text" required className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/5 outline-none transition-all text-sm" placeholder="123 Example St, Milpitas, CA" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[#0E1F3D] uppercase tracking-wider">{t.analysis.form.beds}</label>
                                <select name="beds" required className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-[#C9A84C] outline-none text-sm">
                                  <option value="Studio">Studio</option>
                                  <option value="1">1 Bed</option>
                                  <option value="2">2 Beds</option>
                                  <option value="3">3 Beds</option>
                                  <option value="4+">4+ Beds</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[#0E1F3D] uppercase tracking-wider">{t.analysis.form.baths}</label>
                                <select name="baths" required className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-[#C9A84C] outline-none text-sm">
                                  <option value="1">1 Bath</option>
                                  <option value="1.5">1.5 Baths</option>
                                  <option value="2">2 Baths</option>
                                  <option value="2.5+">2.5+ Baths</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#0E1F3D] uppercase tracking-wider">Email to Send Report</label>
                              <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                <input name="email" type="email" required className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-[#C9A84C] outline-none text-sm" placeholder="your@email.com" />
                              </div>
                            </div>

                            {/* Verification */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <span className="text-xs font-bold text-slate-400 whitespace-nowrap">{humanCheck.a} + {humanCheck.b} =</span>
                              <input name="human_answer" type="number" required className="w-20 px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm" />
                              <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
                            </div>

                            <button 
                              disabled={isSubmitting}
                              type="submit"
                              className="w-full bg-[#0E1F3D] hover:bg-[#1A3260] text-white py-4 rounded-xl font-bold text-sm transition-all shadow-xl shadow-[#0E1F3D]/10 flex items-center justify-center gap-2"
                            >
                              {isSubmitting ? '...' : t.analysis.form.cta}
                              <ArrowRight size={16} />
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Areas We Serve Section */}
                <div className="py-24 bg-slate-50 border-y border-slate-100">
                  <div className="max-w-4xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                      <p className="text-[#8A6820] text-[11px] font-bold tracking-[0.2em] uppercase mb-3">{t.areas.badge}</p>
                      <h2 className="font-serif text-[#0E1F3D] text-3xl md:text-5xl font-bold mb-4">{t.areas.title}</h2>
                      <p className="text-slate-600 text-lg font-light max-w-2xl mx-auto">{t.areas.desc}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                      {/* South Bay */}
                      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-[#0E1F3D] rounded-2xl flex items-center justify-center text-[#C9A84C]">
                            <MapPin size={24} />
                          </div>
                          <h3 className="font-serif text-[#0E1F3D] text-2xl font-bold">{t.areas.southBay}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4">
                          {[t.areas.cities.milpitas, t.areas.cities.sanjose, t.areas.cities.sc, t.areas.cities.sunnyvale, t.areas.cities.cup, t.areas.cities.mtv, t.areas.cities.paloalto].map((city, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"></div>
                              <span className="text-sm font-medium">{city}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* East Bay */}
                      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-[#0E1F3D] rounded-2xl flex items-center justify-center text-[#C9A84C]">
                            <MapPin size={24} />
                          </div>
                          <h3 className="font-serif text-[#0E1F3D] text-2xl font-bold">{t.areas.eastBay}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4">
                          {[t.areas.cities.fremont, t.areas.cities.hayward, t.areas.cities.unioncity, t.areas.cities.newark, t.areas.cities.pleasanton, t.areas.cities.dublin, t.areas.cities.livermore, t.areas.cities.sanramon].map((city, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"></div>
                              <span className="text-sm font-medium">{city}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Strip */}
                <div className="bg-[#C9A84C] py-16 px-6 text-center">
                  <h2 className="font-serif text-[#0E1F3D] text-3xl md:text-4xl font-bold mb-4">Ready to stress less about your property?</h2>
                  <p className="text-[#0E1F3D]/70 text-lg mb-8">Get a free consultation — no obligation, no pressure.</p>
                  <button 
                    onClick={() => showSection('contact')}
                    className="bg-[#0E1F3D] hover:bg-[#1A3260] text-white px-10 py-4 rounded-lg font-bold text-sm transition-all shadow-xl"
                  >
                    Contact Us Today
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === 'services' && (
            <motion.section
              key="services"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center py-12"
            >
              <div className="w-full max-w-6xl mx-auto bg-white shadow-sm p-8 md:p-16">
                <div className="text-center mb-20">
                  <p className="text-[#8A6820] text-[11px] font-bold tracking-[0.2em] uppercase mb-3">{t.services.badge}</p>
                  <h1 className="font-serif text-[#0E1F3D] text-4xl md:text-5xl font-bold mb-6">{t.services.title}</h1>
                  <p className="text-slate-600 text-lg font-light max-w-2xl mx-auto">{t.services.desc}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 mb-20">
                  {[
                    {
                      title: 'Tenant Placement',
                      price: '$800',
                      sub: 'one-time flat fee',
                      desc: 'We handle everything from marketing your property to signing the lease.',
                      items: [
                        'Professional listing creation',
                        'Multi-platform marketing',
                        'Tenant showings',
                        'Background & credit checks',
                        'Rental history verification',
                        'Lease preparation & signing'
                      ],
                      icon: Home,
                      img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'
                    },
                    {
                      title: 'Property Management',
                      price: '6.5%',
                      sub: 'of monthly rent',
                      desc: 'Ongoing management of your property, handled professionally.',
                      items: [
                        'Rent collection & disbursement',
                        'Late payment follow-ups',
                        'Maintenance coordination',
                        '24/7 tenant communication',
                        'Monthly owner statements',
                        'Annual inspections'
                      ],
                      icon: Building2,
                      img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
                    },
                    {
                      title: 'Maintenance',
                      price: 'On-demand',
                      sub: 'cost of repairs only',
                      desc: 'We coordinate all repairs using our trusted network of licensed contractors.',
                      items: [
                        'Vetted handymen & contractors',
                        'Plumbing, electrical, HVAC',
                        'Fast dispatch for emergencies',
                        'Cost-transparent invoicing',
                        'Preventive maintenance plans',
                        'Before & after documentation'
                      ],
                      icon: Wrench,
                      img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'
                    }
                  ].map((service, i) => (
                    <div key={i} className="bg-white rounded-2xl p-8 border border-[#C9A84C]/20 shadow-sm">
                      <div className="w-14 h-14 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center text-[#C9A84C] mb-8">
                        <service.icon size={28} />
                      </div>
                      <h3 className="font-serif text-[#0E1F3D] text-2xl font-bold mb-2">{service.title}</h3>
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-3xl font-bold text-[#8A6820]">{service.price}</span>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{service.sub}</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed mb-8">{service.desc}</p>
                      <ul className="space-y-4">
                        {service.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm text-slate-600">
                            <CheckCircle className="text-[#C9A84C] mt-0.5 shrink-0" size={16} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0E1F3D] rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12">
                  <div className="flex-1">
                    <p className="text-[#C9A84C] text-[11px] font-bold tracking-[0.2em] uppercase mb-4">Legal Support</p>
                    <h3 className="font-serif text-white text-3xl font-bold mb-6">Eviction Attorney Access for Landlords</h3>
                    <p className="text-white/60 text-lg font-light leading-relaxed">
                      Navigating tenant disputes and evictions in California can be complex. Our clients have access to experienced eviction attorneys and legal compliance support — protecting your investment when it matters most.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-[#C9A84C]/10 rounded-full flex items-center justify-center text-[#C9A84C]">
                      <Scale size={48} />
                    </div>
                    <button 
                      onClick={() => showSection('contact')}
                      className="bg-[#C9A84C] hover:bg-[#F0DFA0] text-[#0E1F3D] px-10 py-4 rounded-xl font-bold text-sm transition-all"
                    >
                      Talk to Us
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === 'about' && (
            <motion.section
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center py-12"
            >
              <div className="w-full max-w-6xl mx-auto bg-white shadow-sm p-8 md:p-16">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div className="bg-[#0E1F3D] rounded-3xl p-10 border border-[#C9A84C]/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/5 rounded-full blur-3xl" />
                    <img 
                      src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" 
                      alt="SF Bay Area Real Estate" 
                      className="rounded-2xl mb-8 shadow-2xl relative z-10 w-full h-64 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-8 relative z-10">
                      <div className="border-b border-white/10 pb-6">
                        <div className="font-serif text-[#C9A84C] text-4xl font-bold">{t.hero.expTitle}</div>
                        <div className="text-white/50 text-xs uppercase tracking-widest mt-1">{t.hero.expSub}</div>
                      </div>
                      <div className="border-b border-white/10 pb-6">
                        <div className="font-serif text-[#C9A84C] text-4xl font-bold">95%+</div>
                        <div className="text-white/50 text-xs uppercase tracking-widest mt-1">{t.about.stats.satisfaction}</div>
                      </div>
                      <div>
                        <div className="font-serif text-[#C9A84C] text-4xl font-bold">72hr</div>
                        <div className="text-white/50 text-xs uppercase tracking-widest mt-1">{t.about.stats.speed}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[#8A6820] text-[11px] font-bold tracking-[0.2em] uppercase mb-4">{t.about.badge}</p>
                    <h2 className="font-serif text-[#0E1F3D] text-4xl md:text-5xl font-bold mb-8">{t.about.title}</h2>
                    <div className="space-y-6 text-slate-600 text-lg font-light leading-relaxed">
                      {t.about.content.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                    <div className="mt-10 p-8 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Scale className="text-[#8A6820]" size={24} />
                        <h4 className="font-serif text-[#0E1F3D] text-xl font-bold">{t.about.legalTitle}</h4>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {t.about.legalDesc}
                      </p>
                    </div>
                    <button 
                      onClick={() => showSection('contact')}
                      className="mt-10 bg-[#0E1F3D] hover:bg-[#1A3260] text-white px-10 py-4 rounded-xl font-bold text-sm transition-all"
                    >
                      {t.about.cta}
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === 'tenant' && (
            <motion.section
              key="tenant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center py-12"
            >
              <div className="w-full max-w-6xl mx-auto bg-white shadow-sm p-8 md:p-16">
                <div className="text-center mb-16">
                  <p className="text-[#8A6820] text-[11px] font-bold tracking-[0.2em] uppercase mb-3">{t.tenant.badge}</p>
                  <h1 className="font-serif text-[#0E1F3D] text-4xl md:text-5xl font-bold mb-6">{t.tenant.title}</h1>
                  <p className="text-slate-600 text-lg font-light max-w-2xl mx-auto">{t.tenant.desc}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-16 items-start">
                  <div>
                    <h3 className="font-serif text-[#0E1F3D] text-2xl font-bold mb-8">{t.tenant.helpTitle}</h3>
                    <div className="space-y-4">
                      {[
                        { icon: Wrench, title: 'Maintenance Request', desc: 'Report a repair or maintenance issue at your unit' },
                        { icon: Mail, title: 'General Inquiry', desc: 'Questions about your lease, rent, or property' },
                        { icon: AlertCircle, title: 'Urgent / Emergency', desc: 'For issues requiring immediate attention' }
                      ].map((opt, i) => (
                        <button
                          key={i}
                          className="w-full text-left bg-white border border-[#C9A84C]/20 p-6 rounded-2xl flex items-center gap-6 hover:border-[#C9A84C] hover:translate-x-2 transition-all group"
                        >
                          <div className="w-14 h-14 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white transition-colors">
                            <opt.icon size={24} />
                          </div>
                          <div>
                            <h4 className="text-[#0E1F3D] font-bold text-lg mb-1">{opt.title}</h4>
                            <p className="text-slate-500 text-sm">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-8 p-6 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl flex items-start gap-4">
                      <AlertCircle className="text-[#8A6820] shrink-0" size={24} />
                      <p className="text-slate-600 text-sm leading-relaxed">
                        <strong className="text-[#0E1F3D]">For emergencies</strong> that cannot wait (gas leak, flooding), please contact us directly via our 24/7 emergency line.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-10 border border-[#C9A84C]/20 shadow-xl">
                    <h4 className="font-serif text-[#0E1F3D] text-xl font-bold mb-8 pb-4 border-b border-slate-100">{t.tenant.submitTitle}</h4>
                    <form 
                      ref={tenantFormRef} 
                      onSubmit={(e) => handleEmailSubmit(e, tenantFormRef)} 
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">First Name</label>
                          <input name="first_name" type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 outline-none transition-all" placeholder="Jane" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Last Name</label>
                          <input name="last_name" type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 outline-none transition-all" placeholder="Smith" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Property Address</label>
                        <input name="address" type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 outline-none transition-all" placeholder="e.g. 123 Main St, Unit 4B, Oakland" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Email</label>
                          <input name="email" type="email" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 outline-none transition-all" placeholder="jane@email.com" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Phone</label>
                          <input name="phone" type="tel" required pattern="^(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 outline-none transition-all" placeholder="(510) 555-0000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Request Type</label>
                        <select name="request_type" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 outline-none transition-all bg-white">
                          <option value="">Select request type</option>
                          <option value="maintenance">Maintenance / Repair</option>
                          <option value="general">General Inquiry</option>
                          <option value="emergency">Urgent / Emergency</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Description</label>
                        <textarea name="message" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 outline-none transition-all min-h-[120px]" placeholder="Please describe your request in detail..."></textarea>
                      </div>

                      {/* Bot Protection */}
                      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
                      <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle size={14} className="text-[#C9A84C]" />
                          Human Verification: {humanCheck.a} + {humanCheck.b} = ?
                        </label>
                        <input name="human_answer" type="number" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] outline-none transition-all" placeholder="Enter answer" />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`w-full bg-[#0E1F3D] hover:bg-[#1A3260] text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : 'Submit Request'}
                      </button>
                      {submitError && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                          <p className="text-red-700 text-sm font-medium flex items-center justify-center gap-2">
                            <AlertCircle size={18} />
                            {submitError}
                          </p>
                        </div>
                      )}
                      {formSubmitted && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-green-50 border border-green-200 p-4 rounded-xl text-center"
                        >
                          <p className="text-green-700 text-sm font-medium flex items-center justify-center gap-2">
                            <CheckCircle size={18} />
                            Your request has been submitted successfully.
                          </p>
                        </motion.div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === 'contact' && (
            <motion.section
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center py-12"
            >
              <div className="w-full max-w-6xl mx-auto bg-white shadow-sm p-8 md:p-16">
                <div className="text-center mb-16">
                  <p className="text-[#8A6820] text-[11px] font-bold tracking-[0.2em] uppercase mb-3">{t.contact.badge}</p>
                  <h1 className="font-serif text-[#0E1F3D] text-4xl md:text-5xl font-bold mb-6">{t.contact.title}</h1>
                  <p className="text-slate-600 text-lg font-light max-w-2xl mx-auto">{t.contact.desc}</p>
                </div>

                <div className="grid md:grid-cols-5 gap-16 items-start">
                  <div className="md:col-span-2 space-y-10">
                    <div>
                      <h3 className="font-serif text-[#0E1F3D] text-2xl font-bold mb-8">{t.contact.infoTitle}</h3>
                      <div className="space-y-8">
                        <div className="flex gap-6">
                          <div className="w-12 h-12 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center text-[#C9A84C] shrink-0">
                            <Mail size={20} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0E1F3D] uppercase tracking-widest mb-1">Email</div>
                            <a href="mailto:MRSOLDTM@gmail.com" className="text-slate-600 hover:text-[#C9A84C] transition-colors">MRSOLDTM@gmail.com</a>
                          </div>
                        </div>
                        <div className="flex gap-6">
                          <div className="w-12 h-12 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center text-[#C9A84C] shrink-0">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0E1F3D] uppercase tracking-widest mb-1">Office</div>
                            <p className="text-slate-600">6 S Abbott Ave, Milpitas, CA 95035</p>
                          </div>
                        </div>
                        <div className="flex gap-6">
                          <div className="w-12 h-12 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center text-[#C9A84C] shrink-0">
                            <Clock size={20} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0E1F3D] uppercase tracking-widest mb-1">Hours</div>
                            <p className="text-slate-600">Mon–Fri: 9am – 5pm PST</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0E1F3D] rounded-3xl p-8 border border-[#C9A84C]/20">
                      <p className="text-[#C9A84C] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">{t.contact.servingBadge}</p>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Milpitas · San Jose · Santa Clara · Sunnyvale · Cupertino · Mountain View · Palo Alto · Fremont · Hayward · Union City · Newark · Pleasanton · Dublin · Livermore · San Ramon
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-3 bg-white rounded-3xl p-10 border border-[#C9A84C]/20 shadow-xl">
                    <h4 className="font-serif text-[#0E1F3D] text-xl font-bold mb-8 pb-4 border-b border-slate-100">{t.contact.formTitle}</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <button 
                        onClick={() => setInquiryType('owner')}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          inquiryType === 'owner' 
                            ? 'border-[#C9A84C] bg-[#C9A84C]/5 ring-2 ring-[#C9A84C]/10' 
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <Building2 className={`mx-auto mb-2 ${inquiryType === 'owner' ? 'text-[#C9A84C]' : 'text-slate-400'}`} size={24} />
                        <div className="text-sm font-bold text-[#0E1F3D]">Property Owner</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Landlord / Investor</div>
                      </button>
                      <button 
                        onClick={() => setInquiryType('tenant')}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          inquiryType === 'tenant' 
                            ? 'border-[#C9A84C] bg-[#C9A84C]/5 ring-2 ring-[#C9A84C]/10' 
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <Users className={`mx-auto mb-2 ${inquiryType === 'tenant' ? 'text-[#C9A84C]' : 'text-slate-400'}`} size={24} />
                        <div className="text-sm font-bold text-[#0E1F3D]">Tenant</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Current or Prospective</div>
                      </button>
                    </div>

                    <form 
                      ref={contactFormRef} 
                      onSubmit={(e) => handleEmailSubmit(e, contactFormRef)} 
                      className="space-y-6"
                    >
                      <input type="hidden" name="inquiry_type" value={inquiryType} />
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">First Name</label>
                          <input name="first_name" type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] outline-none transition-all" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Last Name</label>
                          <input name="last_name" type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] outline-none transition-all" placeholder="Doe" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Email Address</label>
                        <input name="email" type="email" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] outline-none transition-all" placeholder="you@example.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Phone Number</label>
                        <input name="phone" type="tel" required pattern="^(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] outline-none transition-all" placeholder="(415) 555-0000" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Property Address (if known)</label>
                        <input name="address" type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] outline-none transition-all" placeholder="123 Main St, San Francisco, CA" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider">Message</label>
                        <textarea name="message" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] outline-none transition-all min-h-[120px]" placeholder="Tell us about your property or how we can help..."></textarea>
                      </div>

                      {/* Bot Protection */}
                      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
                      <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <label className="text-xs font-bold text-[#0E1F3D] uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle size={14} className="text-[#C9A84C]" />
                          Human Verification: {humanCheck.a} + {humanCheck.b} = ?
                        </label>
                        <input name="human_answer" type="number" required className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#C9A84C] outline-none transition-all" placeholder="Enter answer" />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`w-full bg-[#0E1F3D] hover:bg-[#1A3260] text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : 'Send Message'}
                      </button>
                      {submitError && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                          <p className="text-red-700 text-sm font-medium flex items-center justify-center gap-2">
                            <AlertCircle size={18} />
                            {submitError}
                          </p>
                        </div>
                      )}
                      {formSubmitted && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-green-50 border border-green-200 p-4 rounded-xl text-center"
                        >
                          <p className="text-green-700 text-sm font-medium flex items-center justify-center gap-2">
                            <CheckCircle size={18} />
                            Thank you! We'll respond within one business day.
                          </p>
                        </motion.div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === 'privacy' && (
            <motion.section
              key="privacy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center py-12"
            >
              <div className="w-full max-w-6xl mx-auto bg-white shadow-sm p-8 md:p-16">
                <div className="max-w-4xl mx-auto">
                  <h1 className="font-serif text-[#0E1F3D] text-4xl font-bold mb-8">Privacy Policy</h1>
                  <div className="space-y-8 text-slate-600 leading-relaxed">
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">1. Information We Collect</h2>
                      <p>We collect information that you provide directly to us through our website forms, including your name, email address, phone number, and property address. This information is necessary for us to provide our property management and tenant placement services.</p>
                    </section>
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">2. How We Use Your Information</h2>
                      <p>We use the information we collect to:</p>
                      <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>Provide, maintain, and improve our services.</li>
                        <li>Communicate with you about your property or tenancy.</li>
                        <li>Process and respond to your inquiries and maintenance requests.</li>
                        <li>Send you technical notices, updates, and security alerts.</li>
                      </ul>
                    </section>
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">3. Sharing of Information</h2>
                      <p>We do not sell or rent your personal information to third parties. We may share your information with trusted third-party contractors and service providers (such as maintenance professionals) solely for the purpose of performing services on your behalf.</p>
                    </section>
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">4. Data Security</h2>
                      <p>We implement reasonable security measures to protect the confidentiality and security of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
                    </section>
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">5. Contact Us</h2>
                      <p>If you have any questions about this Privacy Policy, please contact us at MRSOLDTM@gmail.com.</p>
                    </section>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === 'terms' && (
            <motion.section
              key="terms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center py-12"
            >
              <div className="w-full max-w-6xl mx-auto bg-white shadow-sm p-8 md:p-16">
                <div className="max-w-4xl mx-auto">
                  <h1 className="font-serif text-[#0E1F3D] text-4xl font-bold mb-8">Terms of Service</h1>
                  <div className="space-y-8 text-slate-600 leading-relaxed">
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">1. Acceptance of Terms</h2>
                      <p>By accessing or using the Star Realty website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
                    </section>
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">2. Description of Services</h2>
                      <p>Star Realty provides professional property management, tenant placement, and maintenance coordination services in the San Francisco Bay Area. All services are subject to individual management or lease agreements.</p>
                    </section>
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">3. User Responsibilities</h2>
                      <p>You are responsible for providing accurate and complete information when using our website forms. Any fraudulent or misleading information may result in the termination of services.</p>
                    </section>
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">4. Limitation of Liability</h2>
                      <p>In no event shall Star Realty or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Star Realty's website.</p>
                    </section>
                    <section>
                      <h2 className="text-[#0E1F3D] font-bold text-xl mb-4">5. Governing Law</h2>
                      <p>These terms and conditions are governed by and construed in accordance with the laws of the State of California and you irrevocably submit to the exclusive jurisdiction of the courts in that State.</p>
                    </section>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

        <footer className="w-full bg-[#0E1F3D] pt-20 pb-10 border-t border-[#C9A84C]/20">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="bg-[#C9A84C] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 mb-20">
              <div>
                <h3 className="font-serif text-[#0E1F3D] text-2xl font-bold mb-2">{t.footer.ctaTitle}</h3>
                <p className="text-[#0E1F3D]/60 font-medium">{t.footer.ctaSub}</p>
              </div>
              <button 
                onClick={() => showSection('contact')}
                className="bg-[#0E1F3D] hover:bg-[#1A3260] text-white px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg whitespace-nowrap"
              >
                {t.nav.quote}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
              <div>
                <div className="text-[#C9A84C] text-[10px] font-bold tracking-[0.2em] uppercase mb-6">Star Realty</div>
                <div className="space-y-3 text-white/40 text-sm">
                  <p>Since 2002</p>
                  <p>SF Bay Area</p>
                  <p>Milpitas, CA 95035</p>
                </div>
              </div>
              <div>
                <div className="text-[#C9A84C] text-[10px] font-bold tracking-[0.2em] uppercase mb-6">{t.nav.services}</div>
                <div className="space-y-3">
                  {['Tenant Placement', 'Property Management', 'Maintenance', 'Legal Support'].map((item) => (
                    <button key={item} onClick={() => showSection('services')} className="block text-white/40 hover:text-[#C9A84C] text-sm transition-colors">{item}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[#C9A84C] text-[10px] font-bold tracking-[0.2em] uppercase mb-6">{t.about.badge}</div>
                <div className="space-y-3">
                  <button onClick={() => showSection('about')} className="block text-white/40 hover:text-[#C9A84C] text-sm transition-colors">{t.nav.about}</button>
                  <button onClick={() => showSection('contact')} className="block text-white/40 hover:text-[#C9A84C] text-sm transition-colors">{t.nav.contact}</button>
                  <button onClick={() => showSection('tenant')} className="block text-white/40 hover:text-[#C9A84C] text-sm transition-colors">{t.nav.tenant}</button>
                </div>
              </div>
              <div>
                <div className="text-[#C9A84C] text-[10px] font-bold tracking-[0.2em] uppercase mb-6">{t.nav.contact}</div>
                <div className="space-y-3 text-white/40 text-sm">
                  <a href="mailto:MRSOLDTM@gmail.com" className="block hover:text-[#C9A84C] transition-colors">MRSOLDTM@gmail.com</a>
                  <p>Milpitas, CA 95035</p>
                  <p>Mon–Fri 9am–5pm</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-white/20 text-[11px]">{t.footer.copyright}</p>
              <div className="flex gap-6">
                <button onClick={() => showSection('privacy')} className="text-white/20 hover:text-white/40 text-[11px] transition-colors">{t.footer.privacy}</button>
                <button onClick={() => showSection('terms')} className="text-white/20 hover:text-white/40 text-[11px] transition-colors">{t.footer.terms}</button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
}
