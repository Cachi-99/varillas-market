import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Store, MapPin, Heart, PlusCircle, 
  Bot, Send, ShieldCheck, TrendingUp, AlertTriangle, 
  CreditCard, MessageSquare, Info, X
} from 'lucide-react';

// API Key para el entorno de ejecución de la IA
const apiKey = ""; 

const App = () => {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: '¡Hola! Soy Vara IA, tu asistente de Las Varillas. ¿Buscás algo para el finde?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- LÓGICA DE INTELIGENCIA ARTIFICIAL (FASE 2) ---
  const askVaraIA = async (query) => {
    if (!query.trim()) return;
    
    const newMessages = [...chatMessages, { role: 'user', text: query }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsAiLoading(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Actúa como Vara IA, un asistente experto en comercio local de Las Varillas, Córdoba. 
          Responde de forma amable y menciona lugares o modismos locales si es posible. 
          El usuario pregunta: ${query}` }] }]
        })
      });

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Perdón, perdí la señal cerca de la terminal. ¿Me repetís?";
      
      setChatMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Error de conexión. Intentá de nuevo." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- DEFENSA CONTRA ATAQUES (FASE 3) ---
  const sanitizeInput = (text) => {
    // Sanitización para prevenir ataques XSS (Hacking Ético)
    return text.replace(/[<>]/g, ""); 
  };

  const products = [
    { id: 1, title: "Zapatillas Running", price: 85000, shop: "Calzados Elías", category: "Indumentaria", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
    { id: 2, title: "Set de Herramientas", price: 120000, shop: "Ferretería Stefano", category: "Ferretería", image: "https://images.unsplash.com/photo-1572721419147-23b984f1e59f?w=400" },
    { id: 3, title: "Cafetera Express", price: 340000, shop: "Hogar Valentín", category: "Electro", image: "https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400" }
  ];

  const Home = () => (
    <div className="p-4 max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white mb-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-2 italic">Varillas Market 2.0</h2>
          <p className="text-blue-200 text-lg mb-6 max-w-md font-medium">Potenciando el comercio de Las Varillas con IA Cognitiva.</p>
          <button onClick={() => setView('monetization')} className="bg-yellow-400 text-blue-900 px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
            <TrendingUp size={18} /> Plan de Negocios
          </button>
        </div>
        <Bot className="absolute right-[-20px] bottom-[-20px] text-white/5 w-64 h-64 rotate-12" />
      </div>

      <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <MapPin className="text-red-500" /> Comercios Destacados
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className="overflow-hidden rounded-xl h-48 mb-4">
              <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.title} />
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">{p.shop}</span>
            <h3 className="font-bold text-lg mt-2 text-gray-800">{p.title}</h3>
            <p className="text-2xl font-black text-blue-900 mt-2">${p.price.toLocaleString()}</p>
            <button onClick={() => setCart([...cart, p])} className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-blue-600 transition-colors">
              <PlusCircle size={18} /> Comprar
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const MonetizationPlan = () => (
    <div className="p-4 max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right-10 duration-500">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setView('home')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <X className="text-gray-600" />
        </button>
        <h2 className="text-3xl font-black text-gray-900 uppercase">Modelo de Negocio (SaaS)</h2>
      </div>
      
      <div className="grid gap-4">
        <div className="bg-white p-6 rounded-2xl border-l-8 border-yellow-400 shadow-md">
          <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800"><CreditCard className="text-yellow-500"/> Comisiones</h3>
          <p className="text-gray-600 mt-2">Cobro del 3% por venta. El comercio de Las Varillas solo paga si tiene éxito.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-8 border-blue-500 shadow-md">
          <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800"><TrendingUp className="text-blue-500"/> Suscripción Premium</h3>
          <p className="text-gray-600 mt-2">Prioridad en las recomendaciones de Vara IA para comercios destacados.</p>
        </div>
      </div>

      <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-bold flex items-center gap-2 mb-2 text-xl"><ShieldCheck size={24} className="text-green-400"/> Seguridad Fase 3</h3>
          <p className="text-sm opacity-90 leading-relaxed">
            Código blindado contra XSS. Implementamos sanitización de datos en tiempo real para proteger a los usuarios de Las Varillas.
          </p>
        </div>
        <AlertTriangle className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-yellow-200">
      <nav className="bg-yellow-400 p-4 sticky top-0 z-40 shadow-md flex justify-between items-center px-6">
        <h1 className="font-black text-blue-900 text-2xl flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <Store size={28} fill="currentColor"/> VARILLAS MARKET <span className="text-[10px] bg-blue-900 text-white px-2 py-0.5 rounded-full font-bold ml-1">IA PRO</span>
        </h1>
        <div className="relative cursor-pointer" onClick={() => setView('home')}>
          <ShoppingCart className="text-blue-900" size={22} />
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black shadow-sm ring-2 ring-yellow-400">
            {cart.length}
          </span>
        </div>
      </nav>

      <main>
        {view === 'home' ? <Home /> : <MonetizationPlan />}
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border-4 border-white"
          >
            <Bot size={28} className="animate-pulse" />
            <span className="font-bold pr-2 hidden md:inline">¿Hablamos con Vara?</span>
          </button>
        ) : (
          <div className="bg-white w-[90vw] sm:w-96 h-[500px] rounded-3xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-blue-700 p-4 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <Bot size={24} />
                <h4 className="font-bold">Vara IA - Las Varillas</h4>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-blue-800 p-1 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.role === 'ai' 
                      ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100' 
                      : 'bg-blue-600 text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiLoading && <div className="text-xs text-gray-400 italic">Vara está pensando...</div>}
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(sanitizeInput(e.target.value))}
                  onKeyPress={(e) => e.key === 'Enter' && askVaraIA(userInput)}
                  placeholder="Consultá lo que necesites..."
                  className="flex-1 bg-gray-100 p-3 rounded-xl text-sm outline-none focus:ring-2 ring-blue-400 transition-all"
                />
                <button 
                  onClick={() => askVaraIA(userInput)}
                  disabled={!userInput.trim() || isAiLoading}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[8px] text-center text-gray-400 mt-2 uppercase font-bold tracking-widest">
                Protección XSS Activa • Startup Proyectamos
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-slate-900 text-white p-8 mt-12 text-center border-t-4 border-yellow-400">
        <p className="text-xl font-black italic">VARILLAS MARKET</p>
        <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-[0.2em]">
          Elías, Stefano, Liliana, Valentín, Claudia • 2026 • Córdoba, AR
        </p>
      </footer>
    </div>
  );
};

export default App;
