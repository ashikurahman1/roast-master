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
      if (preview) URL.revokeObjectURL(preview); // পুরনো মেমোরি ক্লিন করা
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    try {
      const response = await axios.post(`${API_URL}/roast`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Server Response:', response.data);

      if (response.data && response.data.roast) {
        setRoast(response.data.roast); // স্টেট আপডেট

        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('roast_count', newCount.toString());
      } else {
        throw new Error('Roast message not found in response');
      }

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
      try {
        Swal.fire({
          title: 'ইমেজ রেডি হচ্ছে...',
          allowOutsideClick: false,
          showConfirmButton: false,
          background: '#121212',
          color: '#fff',
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const canvas = await html2canvas(cardRef.current, {
          useCORS: true, // ক্রস-অরিজিন ইমেজ সাপোর্ট
          allowTaint: true, // ইমেজ টেইন্টিং এলাউ করা
          scale: 2, // হাই কোয়ালিটি ইমেজ
          backgroundColor: '#6082B6',
          logging: false,
        });

        const dataUrl = canvas.toDataURL('image/png');

        // ডাউনলোড লজিক (নিরাপদ পদ্ধতি)
        const link = document.createElement('a');
        link.href = dataUrl;
        link.setAttribute('download', `roast-${Date.now()}.png`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // ক্লিক শেষে রিমুভ করে দেওয়া

        Swal.close();
      } catch (err) {
        console.error('Download Error:', err);
        Swal.fire({
          title: 'ডাউনলোড ব্যর্থ!',
          text: 'আপনার ব্রাউজার ইমেজটি জেনারেট করতে পারছে না।',
          icon: 'error',
          background: '#1a1a1a',
          color: '#fff',
        });
      }
    }
  };

  const shareToFB = () => {
    const shareUrl = window.location.href;
    const quote = `দেখো AI আমাকে নিয়ে কি বলছে: "${roast}" \n\nতুহিন ভাইয়ের Roast Master-এ নিজের পচন নিজেই দেখো!`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(quote)}`;
    window.open(fbUrl, '_blank');
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]"></div>
      </div>
      <main className="relative flex flex-col items-center py-16 px-4 font-sans selection:bg-blue-500/30 text-neutral-900">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <h1 className="text-5xl md:text-7xl font-black mb-2 uppercase tracking-tighter bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            রোস্ট মাস্টার
          </h1>
          <div className="h-1.5 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full mb-4"></div>

          <p className="text-neutral-800 text-[13px] uppercase font-extrabold tracking-[0.1em]">
            নিজের ছবি আপলোড করো আর AI এর মজার রোস্ট দেখো!
          </p>
        </div>

        <div className="w-full max-w-xl">
          {!roast ? (
            <div className="space-y-6">
              <div
                onClick={() => document.getElementById('fileInput')?.click()}
                className="relative aspect-video bg-[#FAFAFA] border border-[#FCFCFC] rounded-2xl overflow-hidden cursor-pointer group hover:border-blue-500/40 transition-all shadow-2xl"
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
                      <FaCamera className="text-neutral-300 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-neutral-600 text-lg font-bold uppercase tracking-widest">
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
                className="w-full py-5 bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-60 shadow-lg cursor-pointer"
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
                className="w-full bg-[#6082B6] p-8 md:p-12 rounded-[32px] flex flex-col shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: '#6082B6',
                  minHeight: '520px',
                }}
              >
                {/* User Image */}
                <div className="mb-10 w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border border-[#FCFCFC]">
                  <Image
                    unoptimized
                    height={120}
                    width={120}
                    src={preview!}
                    className="w-full h-full object-cover"
                    alt="User"
                  />
                </div>

                {/* Roast Text Area - spacing fixed */}
                <div style={{ flex: 1, marginBottom: '40px' }}>
                  <h2
                    className="italic font-medium leading-[1.5] text-[#ffffff] tracking-tight"
                    style={{ fontSize: '18px' }}
                  >
                    &quot;{roast}&quot;
                  </h2>
                </div>

                {/* Footer - explicit border and spacing */}
                <div
                  style={{ borderTop: '2px solid #5775A4', paddingTop: '24px' }}
                >
                  <p className="text-[12px] text-[#CED9E9] font-bold uppercase   mb-1">
                    তৈরি করেছেন
                  </p>
                  <p className="text-sm font-bold text-[#ffffff] uppercase tracking-wider">
                    Mohammad Ashikur Rahman
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={downloadImage}
                  className="flex items-center justify-center gap-3 py-4 bg-[#6082B6] border border-[#648bc5] rounded-xl text-[12px] font-bold   hover:bg-[#5279b3] transition-all text-white cursor-pointer"
                >
                  <FaDownload className="" /> ডাউনলোড
                </button>
                <button
                  onClick={shareToFB}
                  className="flex items-center justify-center gap-3 py-4 bg-[#1877F2] rounded-xl text-[12px] font-bold hover:opacity-90 transition-all text-white cursor-pointer"
                >
                  <FaFacebook /> শেয়ার করুন
                </button>
              </div>

              <button
                onClick={handleReset}
                className="w-full text-neutral-300 text-[14px]  bg-[#000000] rounded-full hover:text-white transition-colors flex items-center justify-center gap-2 py-2 cursor-pointer"
              >
                <FaSync className="text-[14px]" /> আবার চেষ্টা করুন
              </button>
            </div>
          )}
        </div>

        <footer className="mt-auto pt-20 flex flex-col items-center">
          <div className="flex gap-8 text-[9px] text-neutral-700 font-black uppercase tracking-widest mb-4">
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
          <p className="text-[10px] text-neutral-600  ">
            &copy; 2026 Developed by Tuhin
          </p>
        </footer>
      </main>
    </div>
  );
}
