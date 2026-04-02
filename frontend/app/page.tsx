'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import { FaFacebook, FaDownload, FaSync, FaCamera } from 'react-icons/fa';
import Image from 'next/image';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCount = localStorage.getItem('roast_count');
    if (savedCount) setUsageCount(parseInt(savedCount));
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setRoast(null);
    }
  };

  const handleUpload = async () => {
    const loadingMessages = [
      'একটু সবুর করো...',
      'আপনার ছবি দেখে AI হাসাহাসি করছে...',
      'বেশি পচলে কিন্তু আমার দোষ নাই!',
      'সার্ভার আপনার চেহারা চেনার চেষ্টা করছে...',
      'আরেকটু সময় দিন, কড়া পচানি রেডি হচ্ছে...',
      'আপনার স্টাইল অ্যানালাইসিস করতে গিয়ে AI কনফিউজড!',
      'সবাইকে দেখানোর জন্য একদম জুতসই রোস্ট বানানো হচ্ছে...',
    ];

    if (usageCount >= 3) {
      Swal.fire({
        title: 'ভাইরে মুফতে আর কত খাইবা?',
        html: 'এবার কিছু টাকা দাও বিকাশে! <br><br> <b style="color: #3b82f6; font-size: 20px;">সেন্ডমানি: 01845684090</b>',
        icon: 'warning',
        background: '#121212',
        color: '#fff',
        confirmButtonText: 'আচ্ছা দিতাছি',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (!file) return;

    // লোডিং শুরু এবং মেসেজ দেখানো
    setLoading(true);

    let currentMsgIndex = 0;
    const updateLoadingMsg = () => {
      Swal.update({
        title: loadingMessages[currentMsgIndex],
      });
      currentMsgIndex = (currentMsgIndex + 1) % loadingMessages.length;
    };

    Swal.fire({
      title: loadingMessages[0],
      // text: 'প্রসেসিং হচ্ছে...',
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#121212',
      color: '#fff',
      customClass: {
        title: 'custom-swal-title',
      },
      didOpen: () => {
        Swal.showLoading();
        const title = Swal.getTitle();
        if (title) {
          title.style.fontSize = '18px';
          title.style.fontWeight = '600';
        }
      },
    });

    const msgInterval = setInterval(updateLoadingMsg, 2000);

    const formData = new FormData();
    formData.append('file', file);
    // const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    try {
      const response = await axios.post(
        'https://roast-master-backend.onrender.com/roast',
        formData,
      );
      setRoast(response.data.roast);
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('roast_count', newCount.toString());

      clearInterval(msgInterval);
      Swal.close();
    } catch (error) {
      clearInterval(msgInterval);
      Swal.fire({
        title: 'সার্ভার বেয়াদবি করতাছে!',
        text: 'AI হয়তো আপনার চেহারা দেখে ফিট হয়ে গেছে!',
        icon: 'error',
        background: '#1a1a1a',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRoast(null);
    setFile(null);
    setPreview(null);

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const downloadImage = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#000000',
        scale: 3, // হাই রেজোলিউশনের জন্য স্কেল ৩ করা হয়েছে
        logging: false,
        // ডাউনলোড করার সময় অতিরিক্ত কোনো মার্জিন বা গ্যাপ রিমুভ করবে
        onclone: clonedDoc => {
          const element = clonedDoc.getElementById('roast-card-download');
          if (element) {
            element.style.padding = '40px';
            element.style.borderRadius = '32px';
          }
        },
      });
      const link = document.createElement('a');
      link.download = `roast-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const shareToFB = () => {
    const shareUrl = window.location.href;
    const quote = `দেখো AI আমাকে নিয়ে কি বলছে: "${roast}" \n\nতুহিন ভাইয়ের Roast Master-এ নিজের পচন নিজেই দেখো!`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(quote)}`;
    window.open(fbUrl, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col items-center py-16 px-4 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <div className="text-center mb-12 animate-in fade-in duration-700">
        <h1 className="text-4xl md:text-5xl font-black   mb-2 uppercase">
          রোস্ট <span className="text-blue-500">মাস্টার</span>
        </h1>
        <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full mb-4"></div>
        <p className="text-neutral-300 text-[12px]  uppercase font-bold">
          নিজের ছবি আপলোড করো আর AI এর মজার রোস্ট দেখো!
        </p>
      </div>

      <div className="w-full max-w-xl">
        {!roast ? (
          <div className="space-y-6">
            <div
              onClick={() => document.getElementById('fileInput')?.click()}
              className="relative aspect-video bg-[#141417] border border-[#262626] rounded-2xl overflow-hidden cursor-pointer group hover:border-blue-500/40 transition-all shadow-2xl"
            >
              {preview ? (
                <Image
                  unoptimized
                  fill
                  src={preview}
                  className="w-full h-full object-cover"
                  alt="Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3 border border-[#262626]">
                    <FaCamera className="text-neutral-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                    একটি ছবি নির্বাচন করুন
                  </span>
                </div>
              )}
            </div>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={onFileChange}
              accept="image/*"
            />

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full py-5 bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-20 shadow-lg"
            >
              {loading ? 'AI ছবি বিশ্লেষণ করছে...' : 'পচানি শুরু করুন'}
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            {/* Card Result Container */}
            <div
              ref={cardRef}
              id="roast-card-download"
              className="w-full bg-[#000000] p-8 md:p-12 rounded-[32px] flex flex-col shadow-2xl overflow-hidden"
              style={{
                backgroundColor: '#000000',
                minHeight: '520px', // কার্ডের সাইজ ফিক্সড রাখা হয়েছে যাতে টেক্সট যাই হোক লুক নষ্ট না হয়
              }}
            >
              {/* User Image */}
              <div className="mb-10 w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border border-[#1a1a1a]">
                <Image
                  unoptimized
                  fill
                  src={preview!}
                  className="w-full h-full object-cover"
                  alt="User"
                />
              </div>

              {/* Roast Text Area - spacing fixed */}
              <div style={{ flex: 1, marginBottom: '40px' }}>
                <h2
                  className="italic font-medium leading-[1.5] text-[#f5f5f5] tracking-tight"
                  style={{ fontSize: '18px' }}
                >
                  &quot;{roast}&quot;
                </h2>
              </div>

              {/* Footer - explicit border and spacing */}
              <div
                style={{ borderTop: '1px solid #1a1a1a', paddingTop: '24px' }}
              >
                <p className="text-[10px] text-[#666666] font-bold uppercase tracking-widest mb-1">
                  তৈরি করেছেন
                </p>
                <p className="text-sm font-black text-[#999999] uppercase tracking-wider">
                  Mohammad Ashikur Rahman
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={downloadImage}
                className="flex items-center justify-center gap-3 py-4 bg-[#1a1a1c] border border-[#262626] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#262626] transition-all"
              >
                <FaDownload className="" /> ডাউনলোড
              </button>
              <button
                onClick={shareToFB}
                className="flex items-center justify-center gap-3 py-4 bg-[#1877F2] rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all text-white"
              >
                <FaFacebook /> শেয়ার করুন
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full text-neutral-300 text-[14px]   hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <FaSync className="text-[14px]" /> আবার চেষ্টা করুন
            </button>
          </div>
        )}
      </div>

      <footer className="mt-auto pt-20 flex flex-col items-center">
        <div className="flex gap-8 text-[9px] text-neutral-300 font-black uppercase tracking-widest mb-4">
          <a
            href="https://www.facebook.com/ashikurrdev"
            target="_blank"
            className="hover:text-blue-500 transition-colors"
          >
            Facebook
          </a>
          <a
            href="https://linkedin.com/in/ashikur-dev"
            target="_blank"
            className="hover:text-blue-500 transition-colors"
          >
            LinkedIn
          </a>
        </div>
        <p className="text-[10px] text-neutral-200  ">
          &copy; 2026 Developed by Tuhin
        </p>
      </footer>
    </main>
  );
}
