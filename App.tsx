
import React, { useState, useEffect, Suspense, useCallback, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Gift as GiftIcon, Clock, X, Heart, Sparkles, Send, User, Move, ZoomIn, MousePointerClick, Camera, Image } from 'lucide-react';
import { Gift, AppView } from './types';
import { getGifts, saveGift, markGiftAsOpened, saveMemory } from './services/storage';
import { generateChristmasBlessing } from './services/geminiService';
import Snow from './components/Snow';
import ChristmasTree from './components/ChristmasTree';
import GiftBox from './components/GiftBox';

const UNLOCK_DATE = new Date(new Date().getFullYear(), 11, 25, 0, 0, 0);

// Helper for avatars
const getAvatarUrl = (name: string) => {
  const safeName = encodeURIComponent(name || 'Amigo');
  return `https://ui-avatars.com/api/?name=${safeName}&size=200&background=random`;
};

// Isolated Modal Component for Viewing Gifts
const GiftDetailModal = memo(({ gift, onClose }: { gift: Gift; onClose: () => void }) => {
  if (!gift) return null;

  const senderName = gift.senderName || 'Alguien especial';
  const recipientName = gift.recipientName || 'Un ser querido';
  const photoUrl = (gift.senderPhoto && gift.senderPhoto.startsWith('http'))
    ? gift.senderPhoto
    : getAvatarUrl(senderName);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[#050b1a]/95 backdrop-blur-2xl flex items-center justify-center p-4 pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        className="w-full max-w-2xl bg-white text-slate-900 rounded-[2.5rem] shadow-[0_0_100px_rgba(255,255,255,0.1)] overflow-hidden relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors z-10 p-2 bg-slate-100 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row h-full">
          <div className="w-full md:w-5/12 bg-slate-100 p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-yellow-400 to-red-500 rounded-full blur opacity-30"></div>
              <img
                src={photoUrl}
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-2xl"
                alt={senderName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAvatarUrl(senderName);
                }}
              />
            </div>
            <div className="mt-8 text-center space-y-2">
              <h3 className="festive-font text-3xl text-slate-900 leading-tight">De: {senderName}</h3>
              <div className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block">
                Para: {recipientName}
              </div>
            </div>
            <div className="flex gap-2 mt-4 text-red-500">
              <Heart fill="currentColor" size={18} />
              <Heart fill="currentColor" size={18} />
              <Heart fill="currentColor" size={18} />
            </div>
          </div>

          <div className="w-full md:w-7/12 p-10 flex flex-col justify-center overflow-y-auto custom-scrollbar max-h-[60vh] md:max-h-none">
            <div className="mb-8">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-3">Mensaje Navideño</h4>
              <p className="text-xl leading-relaxed italic text-slate-700">
                "{gift.message || "¡Feliz Navidad!"}"
              </p>
            </div>

            {gift.aiBlessing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 p-6 rounded-3xl border border-red-100 relative overflow-hidden"
              >
                <Sparkles className="absolute -top-2 -right-2 text-red-200/50" size={80} />
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-400 mb-3 flex items-center gap-2">
                  <Sparkles size={12} />
                  Bendición Mágica
                </h4>
                <p className="text-red-900 font-medium relative z-10 text-sm leading-relaxed">
                  {gift.aiBlessing}
                </p>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3 text-slate-300 animate-pulse bg-slate-50 p-4 rounded-2xl">
                <Sparkles size={16} />
                <span className="text-xs font-semibold">Invocando magia navideña...</span>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Creado el {new Date(gift.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

// Isolated Modal Component for Creating Gifts
const CreateGiftModal = memo(({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: '', recipient: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.recipient.trim()) return;
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-md text-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-green-500 to-red-500"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 p-2 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-4 bg-red-50 rounded-3xl mb-4 text-red-500">
            <GiftIcon size={32} />
          </div>
          <h2 className="festive-font text-3xl text-slate-900">Dejar un Regalo</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Comparte la magia</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1.5 ml-1">De (Tú)</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Tu nombre"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 ring-red-500/20 outline-none transition-all placeholder:text-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1.5 ml-1">Para (Él/Ella)</label>
              <input
                required
                type="text"
                value={formData.recipient}
                onChange={e => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="Su nombre"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 ring-red-500/20 outline-none transition-all placeholder:text-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1.5 ml-1">Tu Mensaje</label>
            <textarea
              value={formData.message}
              onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Escribe algo emotivo..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 ring-red-500/20 outline-none transition-all resize-none placeholder:text-slate-300"
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Send size={18} />
            Colocar bajo el Árbol
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
});

// Isolated Modal Component for Viewing Photos
const PhotoModal = memo(({ photoUrl, message, onClose }: { photoUrl: string; message?: string; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 pointer-events-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="relative max-w-4xl max-h-[80vh] p-2 bg-white rounded-2xl shadow-2xl transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 text-white bg-red-500 hover:bg-red-600 rounded-full p-2 shadow-lg z-10 transition-colors"
        >
          <X size={24} />
        </button>
        <img
          src={photoUrl}
          alt="Memoria Navideña"
          className="w-full h-full object-contain max-h-[75vh] rounded-xl border-4 border-white/50"
        />
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <span className="inline-block bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium tracking-widest uppercase">
            {message || "Recuerdo Mágico"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
});


// Isolated Modal Component for Locked Gifts
const LockedModal = memo(({ onClose, countdown }: { onClose: () => void; countdown: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <div className="flex justify-center mb-4 text-red-500">
          <Clock size={48} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Aún no es Navidad!</h3>
        <p className="text-slate-500 mb-6">Los regalos sólo se pueden abrir el 25 de Diciembre.</p>
        <div className="bg-slate-100 rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Faltan</p>
          <p className="text-xl font-mono text-indigo-600 font-bold">{countdown}</p>
        </div>
      </motion.div>
    </motion.div>
  );
});

// Isolated Modal Component for Adding Memories
const AddMemoryModal = memo(({ onSave, onClose }: { onSave: (data: { file: File, message: string, senderName: string }) => void; onClose: () => void }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      await onSave({ file, message, senderName: "User" });
      setIsUploading(false);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      alert("Error al subir la imagen");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-md text-slate-800 shadow-2xl relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 p-2 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-4 bg-green-50 rounded-3xl mb-4 text-green-600">
            <Camera size={32} />
          </div>
          <h2 className="festive-font text-3xl text-slate-900">Colgar Recuerdo</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Inmortaliza el momento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Preview / Upload */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className={`w-32 h-32 rounded-full border-4 border-dashed flex items-center justify-center overflow-hidden transition-all ${preview ? 'border-green-500' : 'border-slate-200 hover:border-green-300'}`}>
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <Image size={24} />
                    <span className="text-[10px] font-bold uppercase mt-1">Subir Foto</span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                <Plus size={16} />
              </div>
            </label>
          </div>



          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1.5 ml-1">Mensaje Corto</label>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ej: Navidad 2024..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 ring-green-500/20 outline-none transition-all placeholder:text-slate-300 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || !file}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {isUploading ? (
              <span className="animate-pulse">Subiendo...</span>
            ) : (
              <>
                <Camera size={18} />
                Colgar en el Árbol
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
});

const App: React.FC = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [viewMemory, setViewMemory] = useState<{ photoUrl: string; message?: string } | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [refreshTree, setRefreshTree] = useState(0);

  useEffect(() => {
    const fetchGifts = async () => {
      const savedGifts = await getGifts();
      setGifts(savedGifts);
    };

    fetchGifts();

    const timer = setInterval(() => {
      const now = new Date();
      const diff = UNLOCK_DATE.getTime() - now.getTime();

      if (diff <= 0) {
        setIsUnlocked(true);
        setCountdown("¡YA ES NAVIDAD!");
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCreateGift = useCallback(async (data: { name: string; recipient: string; photo: string; message: string }) => {
    const colors = ['#d32f2f', '#1976d2', '#388e3c', '#fbc02d', '#7b1fa2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newGift: Gift = {
      id: Math.random().toString(36).substring(2, 11),
      senderName: data.name.trim(),
      recipientName: data.recipient.trim(),
      senderPhoto: data.photo || undefined,
      message: data.message.trim() || "¡Feliz Navidad!",
      type: 'letter',
      color: randomColor,
      createdAt: Date.now()
    };

    try {
      await saveGift(newGift);
      setGifts(prev => [...prev, newGift]);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to save gift", error);
    }
  }, []);

  const onGiftClick = useCallback(async (gift: Gift) => {
    // Check if unlocked
    if (!isUnlocked) {
      setShowLockedModal(true);
      return;
    }

    setSelectedGiftId(gift.id);

    // If already opened and has blessing, just use existing data
    if (gift.isOpened && gift.aiBlessing) {
      return;
    }

    // Logic for new opening or missing blessing
    let blessing = gift.aiBlessing;

    if (!blessing) {
      try {
        blessing = await generateChristmasBlessing(gift.recipientName || gift.senderName || 'Amigo', gift.message);
      } catch (e) {
        console.error("Error generating blessing", e);
        blessing = "Que la magia de la Navidad ilumine tu corazón.";
      }
    }

    // Update DB if it was closed
    if (!gift.isOpened) {
      // Fire and forget update
      markGiftAsOpened(gift.id, blessing).catch(err => console.error("Failed to mark as opened", err));
    }

    // Update local state
    setGifts(prev => {
      return prev.map(g => g.id === gift.id ? { ...g, aiBlessing: blessing, isOpened: true } : g);
    });
  }, [isUnlocked]);



  const handleAddMemory = useCallback(async (data: { file: File, message: string, senderName: string }) => {
    await saveMemory({ message: data.message, senderName: data.senderName, photoUrl: '' }, data.file);
    setIsAddingMemory(false);
    setRefreshTree(prev => prev + 1); // Trigger tree refresh to show new ornament
  }, []);

  const selectedGift = gifts.find(g => g.id === selectedGiftId) || null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050b1a] text-white">
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [10, 5, 15], fov: 45 }}>
          <fog attach="fog" args={['#050b1a', 10, 40]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

          <Suspense fallback={null}>
            <Environment preset="night" />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Snow />
            <ChristmasTree onPhotoClick={setViewMemory} refreshTrigger={refreshTree} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <ContactShadows position={[0, -1.9, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />

            {gifts.map((gift, idx) => (
              <GiftBox
                key={gift.id}
                gift={gift}
                isUnlocked={isUnlocked}
                position={[
                  Math.sin((idx / gifts.length) * Math.PI * 2) * (3 + (idx % 3) * 0.5),
                  -1.6,
                  Math.cos((idx / gifts.length) * Math.PI * 2) * (3 + (idx % 3) * 0.5)
                ]}
                rotation={[0, (idx / gifts.length) * Math.PI * 2, 0]}
                onClick={onGiftClick}
              />
            ))}
          </Suspense>

          <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={8}
            maxDistance={25}
            autoRotate={!selectedGiftId && !isCreating}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-10">
        <header className="flex justify-between items-start w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-3 md:p-5 border border-white/10 pointer-events-auto shadow-2xl flex items-center gap-4 md:gap-6 max-w-[70%] md:max-w-none">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-red-500 to-green-500 rounded-full blur opacity-50 animate-pulse"></div>
              <img
                src="/anibal_y_andres.jpg"
                alt="Anibal y Andres"
                className="relative w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-2 border-white/20 shadow-lg"
              />
            </div>
            <div>
              <h1 className="festive-font text-xl md:text-4xl text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] leading-tight">
                Árbol de los Deseos
                <span className="block text-white/90 text-[10px] md:text-base font-sans font-bold tracking-widest uppercase mt-0.5 md:mt-0">de Anibal y Andres</span>
              </h1>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] opacity-50 flex items-center gap-2 mt-1 md:mt-2">
                <Clock size={12} className="text-yellow-400" />
                {countdown}
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <button
              onClick={() => setIsAddingMemory(true)}
              className="pointer-events-auto bg-green-600 hover:bg-green-700 p-5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-3 group border border-green-500"
            >
              <Camera className="group-hover:rotate-12 transition-transform" size={24} />
              <span className="font-bold pr-2 hidden md:inline uppercase tracking-widest text-xs">Colgar recuerdo</span>
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="pointer-events-auto bg-red-600 hover:bg-red-700 p-5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-3 group border border-red-500"
            >
              <Plus className="group-hover:rotate-90 transition-transform" size={24} />
              <span className="font-bold pr-2 hidden md:inline uppercase tracking-widest text-xs">Dejar Regalo</span>
            </button>
          </div>
        </header>

        <footer className="w-full flex justify-center">
          <div className="bg-black/40 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 text-[10px] md:text-xs font-medium text-slate-300 flex flex-col md:flex-row gap-3 md:gap-8 items-center pointer-events-auto shadow-xl">
            <span className="flex items-center gap-2 uppercase tracking-wider"><Move size={12} className="text-red-400" /> Arrastra para Girar</span>
            <span className="hidden md:inline w-px h-4 bg-white/20"></span>
            <span className="flex items-center gap-2 uppercase tracking-wider"><ZoomIn size={12} className="text-green-400" /> Rueda para Zoom</span>
            <span className="hidden md:inline w-px h-4 bg-white/20"></span>
            <span className="flex items-center gap-2 uppercase tracking-wider"><MousePointerClick size={12} className="text-yellow-400" /> Toca para Abrir</span>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {isCreating && (
          <CreateGiftModal
            onSave={handleCreateGift}
            onClose={() => setIsCreating(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingMemory && (
          <AddMemoryModal
            onSave={handleAddMemory}
            onClose={() => setIsAddingMemory(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLockedModal && (
          <LockedModal
            onClose={() => setShowLockedModal(false)}
            countdown={countdown}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedGift && (
          <GiftDetailModal
            gift={selectedGift}
            onClose={() => setSelectedGiftId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewMemory && (
          <PhotoModal
            photoUrl={viewMemory.photoUrl}
            message={viewMemory.message}
            onClose={() => setViewMemory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
