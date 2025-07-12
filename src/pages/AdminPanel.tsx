import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Input, CustomFileInput } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Save, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

const BASE_URL = 'https://bnadmin-production.up.railway.app';

interface Slide {
  headline: string;
  image: string;
}

interface StatusMessage {
  type: 'success' | 'error' | 'loading';
  message: string;
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('slides');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [status, setStatus] = useState<Record<string, StatusMessage>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Status helpers
  const setStatusMessage = (section: string, type: StatusMessage['type'], message: string) => {
    setStatus(prev => ({ ...prev, [section]: { type, message } }));
    if (type !== 'loading') {
      setTimeout(() => {
        setStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[section];
          return newStatus;
        });
      }, 5000);
    }
  };

  const setLoadingState = (section: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [section]: isLoading }));
  };

  // Fetch slides
  const fetchSlides = async () => {
    setLoadingState('slides', true);
    setStatusMessage('slides', 'loading', 'กำลังโหลดข้อมูล...');
    
    try {
      const response = await fetch(`${BASE_URL}/slides`);
      const data = await response.json();
      setSlides(data.slides || []);
      setStatusMessage('slides', 'success', 'โหลดข้อมูลสำเร็จ');
    } catch (error) {
      setStatusMessage('slides', 'error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoadingState('slides', false);
    }
  };

  // Add new slide
  const addSlide = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const headline = formData.get('headline') as string;
    const svgFile = formData.get('svgFile') as File;

    if (!headline || !svgFile) {
      setStatusMessage('addSlide', 'error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoadingState('addSlide', true);
    setStatusMessage('addSlide', 'loading', 'กำลังเพิ่มสไลด์...');

    try {
      const uploadData = new FormData();
      uploadData.append('svgfile', svgFile);
      uploadData.append('headline', headline);

      const response = await fetch(`${BASE_URL}/slides/add`, {
        method: 'POST',
        body: uploadData
      });

      const result = await response.text();

      if (response.ok) {
        setStatusMessage('addSlide', 'success', 'เพิ่มสไลด์สำเร็จ');
        (event.target as HTMLFormElement).reset();
        fetchSlides();
      } else {
        setStatusMessage('addSlide', 'error', result);
      }
    } catch (error) {
      setStatusMessage('addSlide', 'error', 'เกิดข้อผิดพลาดในการเพิ่มสไลด์');
    } finally {
      setLoadingState('addSlide', false);
    }
  };

  // Update headline
  const updateHeadline = async (index: number, headline: string) => {
    setLoadingState(`slide-${index}`, true);
    setStatusMessage(`slide-${index}`, 'loading', 'กำลังอัปเดต...');

    try {
      const response = await fetch(`${BASE_URL}/slides/update-headline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, headline })
      });

      const result = await response.text();

      if (response.ok) {
        setStatusMessage(`slide-${index}`, 'success', 'อัปเดตสำเร็จ');
        fetchSlides();
      } else {
        setStatusMessage(`slide-${index}`, 'error', result);
      }
    } catch (error) {
      setStatusMessage(`slide-${index}`, 'error', 'เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setLoadingState(`slide-${index}`, false);
    }
  };

  // Delete slide
  const deleteSlide = async (index: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสไลด์นี้?')) return;

    setLoadingState(`slide-${index}`, true);
    setStatusMessage(`slide-${index}`, 'loading', 'กำลังลบ...');

    try {
      const response = await fetch(`${BASE_URL}/slides/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
      });

      const result = await response.text();

      if (response.ok) {
        setStatusMessage(`slide-${index}`, 'success', 'ลบสำเร็จ');
        fetchSlides();
      } else {
        setStatusMessage(`slide-${index}`, 'error', result);
      }
    } catch (error) {
      setStatusMessage(`slide-${index}`, 'error', 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setLoadingState(`slide-${index}`, false);
    }
  };

  // Status component
  const StatusDisplay = ({ section }: { section: string }) => {
    const statusInfo = status[section];
    if (!statusInfo) return null;

    const { type, message } = statusInfo;
    const icons = {
      success: <CheckCircle className="w-4 h-4" />,
      error: <XCircle className="w-4 h-4" />,
      loading: <Loader2 className="w-4 h-4 animate-spin" />
    };

    return (
      <Alert className={`mt-4 ${
        type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
        type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
        'border-blue-200 bg-blue-50 text-blue-800'
      }`}>
        <div className="flex items-center gap-2">
          {icons[type]}
          <AlertDescription>{message}</AlertDescription>
        </div>
      </Alert>
    );
  };

  // --- NestWelcome State ---
  const [nwTitle, setNwTitle] = useState('');
  const [nwSubtitle, setNwSubtitle] = useState('');
  const [nwDesc, setNwDesc] = useState('');
  const [nwBookBtnText, setNwBookBtnText] = useState('');
  const [nwBookBtnLink, setNwBookBtnLink] = useState('');
  const [nwViewAllBtnText, setNwViewAllBtnText] = useState('');
  const [nwViewAllBtnLink, setNwViewAllBtnLink] = useState('');
  const [nwSha, setNwSha] = useState<string | null>(null);

  // --- Fetch NestWelcome ---
  const fetchNestWelcome = async () => {
    setLoadingState('nestwelcome', true);
    setStatusMessage('nestwelcome', 'loading', 'กำลังโหลดข้อมูล...');
    try {
      const res = await fetch(`${BASE_URL}/nestwelcome-content`);
      const data = await res.json();
      setNwSha(data.sha || null);
      setNwTitle(data.title || '');
      setNwSubtitle(data.subtitle || '');
      setNwDesc(data.description || '');
      setNwBookBtnText((data.bookButton && data.bookButton.text) || '');
      setNwBookBtnLink((data.bookButton && data.bookButton.link) || '');
      setNwViewAllBtnText((data.viewAllButton && data.viewAllButton.text) || '');
      setNwViewAllBtnLink((data.viewAllButton && data.viewAllButton.link) || '');
      setStatusMessage('nestwelcome', 'success', 'โหลดข้อมูลสำเร็จ');
    } catch (e) {
      setStatusMessage('nestwelcome', 'error', 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoadingState('nestwelcome', false);
    }
  };

  // --- Aboutus State ---
  const [aboutusSha, setAboutusSha] = useState<string | null>(null);
  const [auNurturingTitle, setAuNurturingTitle] = useState('');
  const [auNurturingDesc, setAuNurturingDesc] = useState('');
  const [auServicesTitle, setAuServicesTitle] = useState('');
  const [auServicesDesc, setAuServicesDesc] = useState('');
  const [serviceCards, setServiceCards] = useState<any[]>([]);
  // Fetch Aboutus
  const fetchAboutus = async () => {
    setLoadingState('aboutus', true);
    setStatusMessage('aboutus', 'loading', 'กำลังโหลดข้อมูล...');
    try {
      const res = await fetch(`${BASE_URL}/aboutus-content`);
      const data = await res.json();
      setAboutusSha(data.sha || null);
      setAuNurturingTitle(data.nurturingTitle || '');
      setAuNurturingDesc(data.nurturingDesc || '');
      setAuServicesTitle(data.servicesTitle || '');
      setAuServicesDesc(data.servicesDesc || '');
      setServiceCards(data.serviceCards || []);
      setStatusMessage('aboutus', 'success', 'โหลดข้อมูลสำเร็จ');
    } catch (e) {
      setStatusMessage('aboutus', 'error', 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoadingState('aboutus', false);
    }
  };
  // Add Service Card
  const addServiceCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!aboutusSha) {
      setStatusMessage('serviceCard', 'error', 'ไม่พบ sha ของไฟล์');
      return;
    }
    const form = e.currentTarget;
    const alt = (form.elements.namedItem('newCardAlt') as HTMLInputElement).value;
    const buttonText = (form.elements.namedItem('newCardBtnText') as HTMLInputElement).value;
    const link = (form.elements.namedItem('newCardLink') as HTMLInputElement).value;
    const fileInput = form.elements.namedItem('newCardSvg') as HTMLInputElement;
    if (!fileInput.files?.length) {
      setStatusMessage('serviceCard', 'error', 'กรุณาเลือกไฟล์ SVG');
      return;
    }
    setLoadingState('serviceCard', true);
    setStatusMessage('serviceCard', 'loading', 'กำลังเพิ่ม Service Card...');
    const formData = new FormData();
    formData.append('svgfile', fileInput.files[0]);
    formData.append('alt', alt);
    formData.append('buttonText', buttonText);
    formData.append('link', link);
    formData.append('sha', aboutusSha);
    try {
      const res = await fetch(`${BASE_URL}/aboutus/service-card/add`, {
        method: 'POST',
        body: formData
      });
      const textRes = await res.text();
      if (res.ok) {
        setStatusMessage('serviceCard', 'success', textRes);
        form.reset();
        fetchAboutus();
      } else {
        setStatusMessage('serviceCard', 'error', textRes);
      }
    } catch (e) {
      setStatusMessage('serviceCard', 'error', 'เกิดข้อผิดพลาดในการเพิ่ม service card');
    } finally {
      setLoadingState('serviceCard', false);
    }
  };
  // Delete Service Card
  const deleteServiceCard = async (idx: number) => {
    if (!aboutusSha) {
      setStatusMessage('serviceCard', 'error', 'ไม่พบ sha ของไฟล์');
      return;
    }
    if (!window.confirm('ยืนยันการลบ service card นี้?')) return;
    setLoadingState('serviceCard', true);
    setStatusMessage('serviceCard', 'loading', 'กำลังลบ...');
    try {
      const res = await fetch(`${BASE_URL}/aboutus/service-card/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: idx, sha: aboutusSha })
      });
      const textRes = await res.text();
      if (res.ok) {
        setStatusMessage('serviceCard', 'success', textRes);
        fetchAboutus();
      } else {
        setStatusMessage('serviceCard', 'error', textRes);
      }
    } catch (e) {
      setStatusMessage('serviceCard', 'error', 'เกิดข้อผิดพลาดในการลบ service card');
    } finally {
      setLoadingState('serviceCard', false);
    }
  };
  // Update Aboutus
  const updateAboutus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!aboutusSha) {
      setStatusMessage('aboutus', 'error', 'ไม่พบ sha ของไฟล์');
      return;
    }
    setLoadingState('aboutus', true);
    setStatusMessage('aboutus', 'loading', 'กำลังบันทึก...');
    const body = {
      aboutusContent: {
        nurturingTitle: auNurturingTitle,
        nurturingDesc: auNurturingDesc,
        servicesTitle: auServicesTitle,
        servicesDesc: auServicesDesc,
        serviceCards: serviceCards
      },
      sha: aboutusSha
    };
    try {
      const res = await fetch(`${BASE_URL}/aboutus-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const textRes = await res.text();
      if (res.ok) {
        setStatusMessage('aboutus', 'success', textRes);
        fetchAboutus();
      } else {
        setStatusMessage('aboutus', 'error', textRes);
      }
    } catch (e) {
      setStatusMessage('aboutus', 'error', 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoadingState('aboutus', false);
    }
  };

  // --- BlogSection State ---
  const [blogSha, setBlogSha] = useState<string | null>(null);
  const [blogEnvLeft, setBlogEnvLeft] = useState('');
  const [blogEnvRight, setBlogEnvRight] = useState('');
  const [blogInteriorText, setBlogInteriorText] = useState('');
  const [blogJournalTitle, setBlogJournalTitle] = useState('');
  const [blogReconnectTitle1, setBlogReconnectTitle1] = useState('');
  const [blogReconnectTitle2, setBlogReconnectTitle2] = useState('');
  const [blogReconnectDesc, setBlogReconnectDesc] = useState('');
  const [blogReconnectBtnText, setBlogReconnectBtnText] = useState('');
  const [blogReconnectBtnUrl, setBlogReconnectBtnUrl] = useState('');
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  // Fetch BlogSection
  const fetchBlogSection = async () => {
    setLoadingState('blogsection', true);
    setStatusMessage('blogsection', 'loading', 'กำลังโหลดข้อมูล...');
    try {
      const res = await fetch(`${BASE_URL}/blogsection-config`);
      const data = await res.json();
      setBlogSha(data.sha || null);
      setBlogEnvLeft(data.envText?.left || '');
      setBlogEnvRight(data.envText?.right || '');
      setBlogInteriorText((data.interiorText || []).join('\n'));
      setBlogJournalTitle(data.wellnessJournalTitle || '');
      setBlogReconnectTitle1(data.reconnectSection?.title1 || '');
      setBlogReconnectTitle2(data.reconnectSection?.title2 || '');
      setBlogReconnectDesc(data.reconnectSection?.desc || '');
      setBlogReconnectBtnText(data.reconnectSection?.button?.text || '');
      setBlogReconnectBtnUrl(data.reconnectSection?.button?.url || '');
      setBlogPosts(data.blogPosts || []);
      setStatusMessage('blogsection', 'success', 'โหลดข้อมูลสำเร็จ');
    } catch (e) {
      setStatusMessage('blogsection', 'error', 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoadingState('blogsection', false);
    }
  };
  // Add Blog Post
  const addBlogPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!blogSha) {
      setStatusMessage('blogpost', 'error', 'ไม่พบ sha ของไฟล์');
      return;
    }
    const form = e.currentTarget;
    const alt = (form.elements.namedItem('newBlogAlt') as HTMLInputElement).value;
    const title = (form.elements.namedItem('newBlogTitle') as HTMLInputElement).value;
    const link = (form.elements.namedItem('newBlogLink') as HTMLInputElement).value;
    const fileInput = form.elements.namedItem('newBlogSvg') as HTMLInputElement;
    if (!fileInput.files?.length) {
      setStatusMessage('blogpost', 'error', 'กรุณาเลือกไฟล์ SVG');
      return;
    }
    setLoadingState('blogpost', true);
    setStatusMessage('blogpost', 'loading', 'กำลังเพิ่ม Blog Post...');
    const formData = new FormData();
    formData.append('svgfile', fileInput.files[0]);
    formData.append('alt', alt);
    formData.append('title', title);
    formData.append('link', link);
    formData.append('sha', blogSha);
    try {
      const res = await fetch(`${BASE_URL}/blogsection/blogpost/add`, {
        method: 'POST',
        body: formData
      });
      const textRes = await res.text();
      if (res.ok) {
        setStatusMessage('blogpost', 'success', textRes);
        form.reset();
        fetchBlogSection();
      } else {
        setStatusMessage('blogpost', 'error', textRes);
      }
    } catch (e) {
      setStatusMessage('blogpost', 'error', 'เกิดข้อผิดพลาดในการเพิ่ม blog post');
    } finally {
      setLoadingState('blogpost', false);
    }
  };
  // Delete Blog Post
  const deleteBlogPost = async (idx: number) => {
    if (!blogSha) {
      setStatusMessage('blogpost', 'error', 'ไม่พบ sha ของไฟล์');
      return;
    }
    if (!window.confirm('ยืนยันการลบ blog post นี้?')) return;
    setLoadingState('blogpost', true);
    setStatusMessage('blogpost', 'loading', 'กำลังลบ...');
    try {
      const res = await fetch(`${BASE_URL}/blogsection/blogpost/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: idx, sha: blogSha })
      });
      const textRes = await res.text();
      if (res.ok) {
        setStatusMessage('blogpost', 'success', textRes);
        fetchBlogSection();
      } else {
        setStatusMessage('blogpost', 'error', textRes);
      }
    } catch (e) {
      setStatusMessage('blogpost', 'error', 'เกิดข้อผิดพลาดในการลบ blog post');
    } finally {
      setLoadingState('blogpost', false);
    }
  };
  // Update BlogSection
  const updateBlogSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!blogSha) {
      setStatusMessage('blogsection', 'error', 'ไม่พบ sha ของไฟล์');
      return;
    }
    setLoadingState('blogsection', true);
    setStatusMessage('blogsection', 'loading', 'กำลังบันทึก...');
    const body = {
      blogSectionConfig: {
        envText: { left: blogEnvLeft, right: blogEnvRight },
        interiorText: blogInteriorText.split('\n').map(s => s.trim()).filter(Boolean),
        wellnessJournalTitle: blogJournalTitle,
        blogPosts: blogPosts,
        reconnectSection: {
          title1: blogReconnectTitle1,
          title2: blogReconnectTitle2,
          desc: blogReconnectDesc,
          button: { text: blogReconnectBtnText, url: blogReconnectBtnUrl }
        }
      },
      sha: blogSha
    };
    try {
      const res = await fetch(`${BASE_URL}/blogsection-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const textRes = await res.text();
      if (res.ok) {
        setStatusMessage('blogsection', 'success', textRes);
        fetchBlogSection();
      } else {
        setStatusMessage('blogsection', 'error', textRes);
      }
    } catch (e) {
      setStatusMessage('blogsection', 'error', 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoadingState('blogsection', false);
    }
  };

  // --- Contact State ---
  const [contactSha, setContactSha] = useState<string | null>(null);
  const [contactTitle, setContactTitle] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactFbName, setContactFbName] = useState('');
  const [contactFbUrl, setContactFbUrl] = useState('');
  const [contactOpTitle, setContactOpTitle] = useState('');
  const [contactOpNote, setContactOpNote] = useState('');
  const [operationHours, setOperationHours] = useState<{ day: string; time: string }[]>([]);
  // Fetch Contact
  const fetchContact = async () => {
    setLoadingState('contact', true);
    setStatusMessage('contact', 'loading', 'กำลังโหลดข้อมูล...');
    try {
      const res = await fetch(`${BASE_URL}/contact-config`);
      const data = await res.json();
      setContactSha(data.sha || null);
      setContactTitle(data.title || '');
      setContactPhone(data.phone || '');
      setContactAddress(data.address || '');
      setContactFbName(data.facebook?.name || '');
      setContactFbUrl(data.facebook?.url || '');
      setContactOpTitle(data.operationTitle || '');
      setContactOpNote(data.operationNote || '');
      setOperationHours(data.operationHours || []);
      setStatusMessage('contact', 'success', 'โหลดข้อมูลสำเร็จ');
    } catch (e) {
      setStatusMessage('contact', 'error', 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoadingState('contact', false);
    }
  };
  // Add Operation Hour Row
  const addOpHourRow = () => {
    setOperationHours(prev => [...prev, { day: '', time: '' }]);
  };
  // Delete Operation Hour Row
  const deleteOpHourRow = (idx: number) => {
    setOperationHours(prev => prev.filter((_, i) => i !== idx));
  };
  // Update Contact
  const updateContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contactSha) {
      setStatusMessage('contact', 'error', 'ไม่พบ sha ของไฟล์');
      return;
    }
    setLoadingState('contact', true);
    setStatusMessage('contact', 'loading', 'กำลังบันทึก...');
    // เก็บ operationHours
    const newOpHours: { day: string; time: string }[] = [];
    for (let i = 0; i < operationHours.length; i++) {
      const day = (document.getElementById(`opDay${i}`) as HTMLInputElement)?.value || '';
      const time = (document.getElementById(`opTime${i}`) as HTMLInputElement)?.value || '';
      newOpHours.push({ day, time });
    }
    const body = {
      contactConfig: {
        title: contactTitle,
        phone: contactPhone,
        address: contactAddress,
        facebook: { name: contactFbName, url: contactFbUrl },
        operationTitle: contactOpTitle,
        operationHours: newOpHours,
        operationNote: contactOpNote
      },
      sha: contactSha
    };
    try {
      const res = await fetch(`${BASE_URL}/contact-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const textRes = await res.text();
      if (res.ok) {
        setStatusMessage('contact', 'success', textRes);
        fetchContact();
      } else {
        setStatusMessage('contact', 'error', textRes);
      }
    } catch (e) {
      setStatusMessage('contact', 'error', 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoadingState('contact', false);
    }
  };

  // --- Services State ---
  const [servicesSha, setServicesSha] = useState<string | null>(null);
  const [heroImgPreview, setHeroImgPreview] = useState('');
  const [centerImages, setCenterImages] = useState<any[]>([]);
  const [bookBtnText, setBookBtnText] = useState('');
  const [bookBtnUrl, setBookBtnUrl] = useState('');
  const [massageServices, setMassageServices] = useState<any[]>([]);
  const [facialServices, setFacialServices] = useState<any[]>([]);
  const [experienceText, setExperienceText] = useState('');
  // Fetch Services
  const fetchServices = async () => {
    setLoadingState('services', true);
    setStatusMessage('services', 'loading', 'กำลังโหลดข้อมูล...');
    try {
      const res = await fetch(`${BASE_URL}/services-config`);
      const data = await res.json();
      setServicesSha(data.sha || null);
      setHeroImgPreview('https://raw.githubusercontent.com/PtrwTg/Thainest/main/public/assets/images/servicesimg.svg?' + Date.now());
      setCenterImages(data.hero?.centerImages || []);
      setBookBtnText(data.bookBtn?.text || '');
      setBookBtnUrl(data.bookBtn?.url || '');
      setMassageServices(data.massageServices || []);
      setFacialServices(data.facialServices || []);
      setExperienceText(data.hero?.experienceText || '');
      setStatusMessage('services', 'success', 'โหลดข้อมูลสำเร็จ');
    } catch (e) {
      setStatusMessage('services', 'error', 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoadingState('services', false);
    }
  };
  // Update Services
  const updateServices = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!servicesSha) {
      setStatusMessage('services', 'error', 'ไม่พบ sha ของไฟล์');
      return;
    }
    setLoadingState('services', true);
    setStatusMessage('services', 'loading', 'กำลังบันทึก...');
    // เก็บค่าจาก form
    const newCenterImages = centerImages.map((img, idx) => ({
      ...img
    }));
    const newMassageServices = massageServices.map((card, idx) => ({
      ...card,
      title: (document.getElementById(`massageTitle${idx}`) as HTMLInputElement)?.value || '',
      desc: (document.getElementById(`massageDesc${idx}`) as HTMLInputElement)?.value || ''
    }));
    const newFacialServices = facialServices.map((card, idx) => ({
      ...card,
      title: (document.getElementById(`facialTitle${idx}`) as HTMLInputElement)?.value || '',
      desc: (document.getElementById(`facialDesc${idx}`) as HTMLInputElement)?.value || ''
    }));
    const body = {
      servicesConfig: {
        hero: {
          centerImages: newCenterImages,
          experienceText: experienceText
        },
        massageServices: newMassageServices,
        facialServices: newFacialServices,
        bookBtn: {
          text: bookBtnText,
          url: bookBtnUrl
        }
      },
      sha: servicesSha
    };
    try {
      const res = await fetch(`${BASE_URL}/services-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const textRes = await res.text();
      if (res.ok) {
        setStatusMessage('services', 'success', textRes);
        fetchServices();
      } else {
        setStatusMessage('services', 'error', textRes);
      }
    } catch (e) {
      setStatusMessage('services', 'error', 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoadingState('services', false);
    }
  };

  // --- Buy Voucher Button State ---
  const [voucherBtnText, setVoucherBtnText] = useState('Buy Gift Voucher');
  const [voucherBtnLink, setVoucherBtnLink] = useState('https://myappointments.app/portal/public/get-embeded-code?business_id=MjI1MQ==');
  const [voucherBtnStatus, setVoucherBtnStatus] = useState<StatusMessage | null>(null);

  const handleSaveVoucherBtn = () => {
    setVoucherBtnStatus({ type: 'success', message: 'บันทึกข้อความและลิงก์ปุ่มสำเร็จ (mock)' });
    setTimeout(() => setVoucherBtnStatus(null), 3000);
  };

  useEffect(() => {
    fetchSlides();
    fetchNestWelcome();
    fetchAboutus();
    fetchBlogSection();
    fetchContact(); // Add this line to fetch contact
    fetchServices(); // Add this line to fetch services
  }, []);

  return (
    <div className="admin-container">
      <div className="text-center mb-8">
        <h1 className="admin-header mb-2">Thainest Admin config</h1>
        <p className="text-muted-foreground">PtrwTg</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-fit lg:grid-cols-6">
          <TabsTrigger value="slides" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">สไลด์</span>
          </TabsTrigger>
          <TabsTrigger value="welcome" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">หน้าหลัก</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">เกี่ยวกับ</span>
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">บล็อก</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">ติดต่อ</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">บริการ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slides" className="space-y-6">
          <Card className="admin-section">
            <CardHeader>
              <CardTitle className="section-header">จัดการสไลด์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overview Image */}
              <div className="mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/slider-overview.png"
                  alt="ตำแหน่ง Slider บนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่ง Slider บนหน้าเว็บไซต์</span>
              </div>
              {/* Buy Voucher Button Config */}
              <div className="mb-8 p-4 bg-muted rounded-lg border max-w-xl mx-auto">
                <h3 className="font-semibold mb-2">ตั้งค่าปุ่ม Buy Gift Voucher</h3>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">ข้อความปุ่ม</span>
                    <Input
                      type="text"
                      value={voucherBtnText}
                      onChange={e => setVoucherBtnText(e.target.value)}
                      className="admin-input"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm">ลิงก์</span>
                    <Input
                      type="text"
                      value={voucherBtnLink}
                      onChange={e => setVoucherBtnLink(e.target.value)}
                      className="admin-input"
                    />
                  </label>
                  <Button onClick={handleSaveVoucherBtn} className="admin-button-primary w-fit mt-2 self-end">
                    <Save className="w-4 h-4 mr-2" /> บันทึก
                  </Button>
                  {voucherBtnStatus && (
                    <Alert className={`mt-2 ${voucherBtnStatus.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                      <div className="flex items-center gap-2">
                        {voucherBtnStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <AlertDescription>{voucherBtnStatus.message}</AlertDescription>
                      </div>
                    </Alert>
                  )}
                </div>
              </div>
              {/* Slides list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">สไลด์ทั้งหมด ({slides.length})</h3>
                  <Button
                    onClick={fetchSlides}
                    variant="outline"
                    size="sm"
                    disabled={loading.slides}
                  >
                    {loading.slides ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'รีเฟรช'
                    )}
                  </Button>
                </div>
                {slides.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีสไลด์</p>
                  </div>
                ) : (
                  slides.map((slide, index) => (
                    <Card key={index} className="slide-preview card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center w-36">
                            <Badge variant="outline" className="mb-2">#{index + 1}</Badge>
                            <img
                              src={`https://raw.githubusercontent.com/PtrwTg/Thainest/main/src/components/Slider/${slide.image}`}
                              alt={slide.image}
                              className="slide-image mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <p className="text-xs text-muted-foreground max-w-32 truncate text-center">{slide.image}</p>
                          </div>
                          <div className="flex-1 flex items-center gap-4">
                            <Input
                              defaultValue={slide.headline}
                              placeholder="หัวข้อสไลด์"
                              className="admin-input flex-1"
                              id={`headline-${index}`}
                            />
                            <Button
                              onClick={() => {
                                const input = document.getElementById(`headline-${index}`) as HTMLInputElement;
                                updateHeadline(index, input.value);
                              }}
                              className="admin-button-primary"
                              disabled={loading[`slide-${index}`]}
                            >
                              {loading[`slide-${index}`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => deleteSlide(index)}
                                    className="admin-button-danger"
                                    disabled={loading[`slide-${index}`]}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>ลบสไลด์นี้</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <StatusDisplay section={`slide-${index}`} />
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <StatusDisplay section="slides" />
              {/* Add new slide form (moved to bottom) */}
              <form onSubmit={addSlide} className="admin-form mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="headline" className="admin-label">หัวข้อสไลด์</Label>
                    <Input
                      id="headline"
                      name="headline"
                      placeholder="ใส่หัวข้อสไลด์"
                      className="admin-input"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="svgFile" className="admin-label">ไฟล์ SVG</Label>
                    <CustomFileInput
                      id="svgFile"
                      name="svgFile"
                      accept=".svg"
                      className="admin-input"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="admin-button-primary"
                  disabled={loading.addSlide}
                >
                  {loading.addSlide ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  เพิ่มสไลด์ใหม่
                </Button>
              </form>
              <StatusDisplay section="addSlide" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="welcome">
          <Card className="admin-section">
            <CardHeader>
              <CardTitle className="section-header">หน้าต้อนรับ (NestWelcome)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Overview Image */}
              <div className="mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/welcome-overview.png"
                  alt="ตำแหน่งหน้าหลักบนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่งหน้าหลักบนเว็บไซต์</span>
              </div>
              <form
                className="admin-form space-y-4 max-w-2xl mx-auto"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoadingState('nestwelcome', true);
                  setStatusMessage('nestwelcome', 'loading', 'กำลังบันทึก...');
                  try {
                    const body = {
                      title: nwTitle,
                      subtitle: nwSubtitle,
                      description: nwDesc,
                      bookButton: { text: nwBookBtnText, link: nwBookBtnLink },
                      viewAllButton: { text: nwViewAllBtnText, link: nwViewAllBtnLink },
                      sha: nwSha
                    };
                    const res = await fetch(`${BASE_URL}/nestwelcome-content`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(body)
                    });
                    const textRes = await res.text();
                    if (res.ok) {
                      setStatusMessage('nestwelcome', 'success', textRes);
                      fetchNestWelcome();
                    } else {
                      setStatusMessage('nestwelcome', 'error', textRes);
                    }
                  } catch (e) {
                    setStatusMessage('nestwelcome', 'error', 'เกิดข้อผิดพลาดในการบันทึก');
                  } finally {
                    setLoadingState('nestwelcome', false);
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nwTitle" className="admin-label">Title</Label>
                    <Input id="nwTitle" value={nwTitle} onChange={e => setNwTitle(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="nwSubtitle" className="admin-label">Subtitle</Label>
                    <Input id="nwSubtitle" value={nwSubtitle} onChange={e => setNwSubtitle(e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nwDesc" className="admin-label">Description</Label>
                  <Textarea id="nwDesc" value={nwDesc} onChange={e => setNwDesc(e.target.value)} className="admin-textarea w-full" rows={6} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nwBookBtnText" className="admin-label">Book Button Text</Label>
                    <Input id="nwBookBtnText" value={nwBookBtnText} onChange={e => setNwBookBtnText(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="nwBookBtnLink" className="admin-label">Book Button Link</Label>
                    <Input id="nwBookBtnLink" value={nwBookBtnLink} onChange={e => setNwBookBtnLink(e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nwViewAllBtnText" className="admin-label">View All Button Text</Label>
                    <Input id="nwViewAllBtnText" value={nwViewAllBtnText} onChange={e => setNwViewAllBtnText(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="nwViewAllBtnLink" className="admin-label">View All Button Link</Label>
                    <Input id="nwViewAllBtnLink" value={nwViewAllBtnLink} onChange={e => setNwViewAllBtnLink(e.target.value)} className="admin-input" />
                  </div>
                </div>
                <Button type="submit" className="admin-button-primary" disabled={loading.nestwelcome}>
                  {loading.nestwelcome ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} บันทึก
                </Button>
                <StatusDisplay section="nestwelcome" />
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card className="admin-section">
            <CardHeader>
              <CardTitle className="section-header">หน้าเกี่ยวกับเรา</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Overview Image: Aboutus Text Section */}
              <div className="mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/textabout-overview.png"
                  alt="ตำแหน่งเนื้อหาเกี่ยวกับบนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่งเนื้อหาเกี่ยวกับบนเว็บไซต์</span>
              </div>
              <form
                className="admin-form space-y-4 max-w-2xl mx-auto"
                onSubmit={updateAboutus}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="auNurturingTitle" className="admin-label">Nurturing Title</Label>
                    <Input id="auNurturingTitle" value={auNurturingTitle} onChange={e => setAuNurturingTitle(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="auNurturingDesc" className="admin-label">Nurturing Description</Label>
                    <Textarea id="auNurturingDesc" value={auNurturingDesc} onChange={e => setAuNurturingDesc(e.target.value)} className="admin-textarea w-full" rows={10} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="auServicesTitle" className="admin-label">Services Title</Label>
                    <Input id="auServicesTitle" value={auServicesTitle} onChange={e => setAuServicesTitle(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="auServicesDesc" className="admin-label">Services Description</Label>
                    <Textarea id="auServicesDesc" value={auServicesDesc} onChange={e => setAuServicesDesc(e.target.value)} className="admin-textarea w-full" rows={10} />
                  </div>
                </div>
                <Button type="submit" className="admin-button-primary" disabled={loading.aboutus}>
                  {loading.aboutus ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} บันทึก
                </Button>
                <StatusDisplay section="aboutus" />
              </form>
              {/* Overview Image: Service Cards Section */}
              <div className="mt-8 mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/serviceabout-overview.png"
                  alt="ตำแหน่ง Service Cards บนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่ง Service Cards บนเว็บไซต์</span>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Service Cards</h3>
                <div className="mt-6 space-y-4">
                  {serviceCards.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>ยังไม่มี Service Card</p>
                    </div>
                  ) : (
                    serviceCards.map((card, index) => (
                      <Card key={index} className="service-card-preview">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={`https://raw.githubusercontent.com/PtrwTg/Thainest/main/src/components/Aboutus/${card.image}`}
                              alt={card.alt}
                              className="w-40 h-40 object-cover rounded-lg border bg-background/50"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1 flex items-center gap-4">
                              <span className="font-semibold text-base">{card.buttonText}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="service-card-delete-button"
                              onClick={() => deleteServiceCard(index)}
                              disabled={loading.serviceCard}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <form onSubmit={addServiceCard} className="admin-form space-y-4 mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="newCardAlt" className="admin-label">Alt Text</Label>
                      <Input id="newCardAlt" name="newCardAlt" placeholder="ใส่ Alt Text" className="admin-input" />
                    </div>
                    <div>
                      <Label htmlFor="newCardBtnText" className="admin-label">Button Text</Label>
                      <Input id="newCardBtnText" name="newCardBtnText" placeholder="ใส่ข้อความปุ่ม" className="admin-input" />
                    </div>
                    <div>
                      <Label htmlFor="newCardLink" className="admin-label">Link</Label>
                      <Input id="newCardLink" name="newCardLink" placeholder="ใส่ลิงก์" className="admin-input" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newCardSvg" className="admin-label">SVG File</Label>
                    <CustomFileInput id="newCardSvg" name="newCardSvg" type="file" accept=".svg" className="admin-input" />
                  </div>
                  <Button type="submit" className="admin-button-primary">
                    <Plus className="w-4 h-4 mr-2" /> เพิ่ม Service Card
                  </Button>
                  <div className="text-sm text-red-500 mt-2">* กรุณากรอกข้อมูลให้ครบทุกฟิลด์ก่อนกดเพิ่ม Service Card</div>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card className="admin-section">
            <CardHeader>
              <CardTitle className="section-header">หน้าบล็อก</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Overview Image: Blog Section */}
              <div className="mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/blog-overview.png"
                  alt="ตำแหน่งหน้าบล็อกบนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่งหน้าบล็อกบนเว็บไซต์</span>
              </div>
              <form
                className="admin-form space-y-4 max-w-2xl mx-auto"
                onSubmit={updateBlogSection}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blogEnvLeft" className="admin-label">Environment Text Left</Label>
                    <Input id="blogEnvLeft" value={blogEnvLeft} onChange={e => setBlogEnvLeft(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="blogEnvRight" className="admin-label">Environment Text Right</Label>
                    <Input id="blogEnvRight" value={blogEnvRight} onChange={e => setBlogEnvRight(e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="blogInteriorText" className="admin-label">Interior Text</Label>
                  <Textarea id="blogInteriorText" value={blogInteriorText} onChange={e => setBlogInteriorText(e.target.value)} className="admin-textarea w-full" rows={8} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blogJournalTitle" className="admin-label">Wellness Journal Title</Label>
                    <Input id="blogJournalTitle" value={blogJournalTitle} onChange={e => setBlogJournalTitle(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="blogReconnectTitle1" className="admin-label">Reconnect Section Title 1</Label>
                    <Input id="blogReconnectTitle1" value={blogReconnectTitle1} onChange={e => setBlogReconnectTitle1(e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blogReconnectTitle2" className="admin-label">Reconnect Section Title 2</Label>
                    <Input id="blogReconnectTitle2" value={blogReconnectTitle2} onChange={e => setBlogReconnectTitle2(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="blogReconnectDesc" className="admin-label">Reconnect Section Description</Label>
                    <Textarea id="blogReconnectDesc" value={blogReconnectDesc} onChange={e => setBlogReconnectDesc(e.target.value)} className="admin-textarea" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blogReconnectBtnText" className="admin-label">Reconnect Button Text</Label>
                    <Input id="blogReconnectBtnText" value={blogReconnectBtnText} onChange={e => setBlogReconnectBtnText(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="blogReconnectBtnUrl" className="admin-label">Reconnect Button URL</Label>
                    <Input id="blogReconnectBtnUrl" value={blogReconnectBtnUrl} onChange={e => setBlogReconnectBtnUrl(e.target.value)} className="admin-input" />
                  </div>
                </div>
                <Button type="submit" className="admin-button-primary" disabled={loading.blogsection}>
                  {loading.blogsection ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} บันทึก
                </Button>
                <StatusDisplay section="blogsection" />
              </form>
              {/* Overview Image: Blog Card Section */}
              <div className="mt-8 mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/blogcard-overview.png"
                  alt="ตำแหน่ง Blog Posts บนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่ง Blog Posts บนเว็บไซต์</span>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Blog Posts</h3>
                {blogPosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีบล็อกโพสต์</p>
                  </div>
                ) : (
                  blogPosts.map((post, index) => (
                    <Card key={index} className="blog-post-preview">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={`https://raw.githubusercontent.com/PtrwTg/Thainest/main/src/components/Blog/${post.image}`}
                            alt={post.alt}
                            className="w-28 h-28 object-cover rounded-lg border bg-background/50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="flex-1 flex items-center gap-4">
                            <span className="font-semibold text-base">{post.title}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="blog-post-delete-button"
                            onClick={() => deleteBlogPost(index)}
                            disabled={loading.blogpost}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                <form onSubmit={addBlogPost} className="admin-form space-y-4 mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="newBlogAlt" className="admin-label">Alt Text</Label>
                      <Input id="newBlogAlt" name="newBlogAlt" placeholder="ใส่ Alt Text" className="admin-input" />
                    </div>
                    <div>
                      <Label htmlFor="newBlogTitle" className="admin-label">Title</Label>
                      <Input id="newBlogTitle" name="newBlogTitle" placeholder="ใส่หัวข้อบล็อก" className="admin-input" />
                    </div>
                    <div>
                      <Label htmlFor="newBlogLink" className="admin-label">Link</Label>
                      <Input id="newBlogLink" name="newBlogLink" placeholder="ใส่ลิงก์บล็อก" className="admin-input" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newBlogSvg" className="admin-label">SVG File</Label>
                    <CustomFileInput id="newBlogSvg" name="newBlogSvg" type="file" accept=".svg" className="admin-input" />
                  </div>
                  <Button type="submit" className="admin-button-primary">
                    <Plus className="w-4 h-4 mr-2" /> เพิ่มบล็อกโพสต์
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="admin-section">
            <CardHeader>
              <CardTitle className="section-header">หน้าติดต่อ</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Overview Image: Contact Section */}
              <div className="mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/contact-overview.png"
                  alt="ตำแหน่งหน้าติดต่อบนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่งหน้าติดต่อบนเว็บไซต์</span>
              </div>
              {/* Form แก้ไขเนื้อหาเดิม */}
              <form
                className="admin-form space-y-4 max-w-2xl mx-auto"
                onSubmit={updateContact}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactTitle" className="admin-label">Contact Title</Label>
                    <Input id="contactTitle" value={contactTitle} onChange={e => setContactTitle(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone" className="admin-label">Contact Phone</Label>
                    <Input id="contactPhone" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contactAddress" className="admin-label">Contact Address</Label>
                  <Textarea id="contactAddress" value={contactAddress} onChange={e => setContactAddress(e.target.value)} className="admin-textarea" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactFbName" className="admin-label">Facebook Name</Label>
                    <Input id="contactFbName" value={contactFbName} onChange={e => setContactFbName(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="contactFbUrl" className="admin-label">Facebook URL</Label>
                    <Input id="contactFbUrl" value={contactFbUrl} onChange={e => setContactFbUrl(e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactOpTitle" className="admin-label">Operation Title</Label>
                    <Input id="contactOpTitle" value={contactOpTitle} onChange={e => setContactOpTitle(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <Label htmlFor="contactOpNote" className="admin-label">Operation Note</Label>
                    <Textarea id="contactOpNote" value={contactOpNote} onChange={e => setContactOpNote(e.target.value)} className="admin-textarea" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactOpHours" className="admin-label">Operation Hours</Label>
                    <Button type="button" onClick={addOpHourRow} className="admin-button-secondary mb-2">
                      <Plus className="w-4 h-4 mr-2" /> เพิ่มสัปดาห์
                    </Button>
                    {operationHours.map((hour, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          id={`opDay${index}`}
                          type="text"
                          placeholder="วันที่"
                          value={hour.day}
                          onChange={e => {
                            const newHours = [...operationHours];
                            newHours[index] = { ...newHours[index], day: e.target.value };
                            setOperationHours(newHours);
                          }}
                          className="admin-input w-[240px]"
                        />
                        <Input
                          id={`opTime${index}`}
                          type="text"
                          placeholder="เวลา (HH:MM)"
                          value={hour.time}
                          onChange={e => {
                            const newHours = [...operationHours];
                            newHours[index] = { ...newHours[index], time: e.target.value };
                            setOperationHours(newHours);
                          }}
                          className="admin-input w-[240px]"
                        />
                        <Button
                          type="button"
                          onClick={() => deleteOpHourRow(index)}
                          className="admin-button-danger"
                          disabled={loading.contact}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="admin-button-primary" disabled={loading.contact}>
                  {loading.contact ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} บันทึก
                </Button>
                <StatusDisplay section="contact" />
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="admin-section">
            <CardHeader>
              <CardTitle className="section-header">หน้าบริการ</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Overview Image: Services Page Section */}
              <div className="mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/servicespage-overview.png"
                  alt="ตำแหน่งหน้าบริการบนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่งหน้าบริการบนเว็บไซต์</span>
              </div>
              <form className="admin-form space-y-4 max-w-2xl mx-auto" onSubmit={updateServices}>
                <div>
                  <Label className="admin-label">Hero Image</Label>
                  <div className="flex flex-col items-start gap-3">
                    <CustomFileInput type="file" id="heroImgInput" accept=".svg" className="admin-input w-[300px]" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('svgfile', file);
                      formData.append('type', 'heroImg');
                      formData.append('filename', 'servicesimg.svg');
                      await fetch(`${BASE_URL}/services/upload-svg`, { method: 'POST', body: formData });
                      setHeroImgPreview('https://raw.githubusercontent.com/PtrwTg/Thainest/main/public/assets/images/servicesimg.svg?' + Date.now());
                    }} />
                    <img src={heroImgPreview} style={{ width: 220, height: 140, objectFit: 'cover', borderRadius: 12, border: '2px solid #eee', background: '#222', marginTop: 8 }} />
                  </div>
                </div>
                <div>
                  <Label className="admin-label">Experience Text</Label>
                  <Textarea value={experienceText} onChange={e => setExperienceText(e.target.value)} className="admin-textarea w-full mb-4" placeholder="Enter experience text..." rows={2} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="admin-label">Book Button Text</Label>
                    <Input
                      value={bookBtnText}
                      onChange={e => setBookBtnText(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Book Button URL</Label>
                    <Input
                      value={bookBtnUrl}
                      onChange={e => setBookBtnUrl(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                </div>
                <Label className="admin-label">Center Images</Label>
                <div className="grid grid-cols-2 gap-6">
                  {centerImages.map((img, idx) => {
                    const filename = `4img${idx ? '2' : ''}.svg`;
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <CustomFileInput type="file" accept=".svg" id={`centerImgInput${idx}`} className="admin-input w-[180px]" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('svgfile', file);
                          formData.append('type', 'centerImage');
                          formData.append('filename', filename);
                          await fetch(`${BASE_URL}/services/upload-svg`, { method: 'POST', body: formData });
                          fetchServices();
                        }} />
                        <img src={`https://raw.githubusercontent.com/PtrwTg/Thainest/main/public/assets/images/${filename}?${Date.now()}`} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #eee', background: '#222', marginTop: 8 }} />
                      </div>
                    );
                  })}
                </div>
                <Button type="submit" className="admin-button-primary mt-6 mb-8" disabled={loading.services}>
                  {loading.services ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} บันทึกส่วนบน
                </Button>
              </form>
              {/* Overview Image: Services Card Section */}
              <div className="mt-8 mb-6 flex flex-col items-center">
                <img
                  src="/admin-overviews/servicescard-overview.png"
                  alt="ตำแหน่ง Massage Services บนเว็บไซต์"
                  className="w-full max-w-3xl rounded-lg shadow mb-2 border"
                />
                <span className="text-sm text-muted-foreground">ภาพตัวอย่างตำแหน่ง Massage Services บนเว็บไซต์</span>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Massage Services</h4>
                {massageServices.map((card, idx) => {
                  const imgName = card.img.replace(/^.*[\\\/]/, '');
                  return (
                    <div key={idx} className={`flex items-stretch gap-4 mb-4 w-full pb-4 ${idx !== massageServices.length - 1 ? 'border-b-2 border-red-500' : ''}`}>
                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <Input id={`massageTitle${idx}`} defaultValue={card.title} placeholder="Title" className="admin-input mb-2 w-full" />
                        <Textarea id={`massageDesc${idx}`} defaultValue={card.desc} placeholder="Description" className="admin-textarea w-full" rows={2} />
                      </div>
                      <div className="flex flex-row items-center gap-4 min-w-[10px] mt-0">
                        <img src={`https://raw.githubusercontent.com/PtrwTg/Thainest/main/public/assets/images/${imgName}?${Date.now()}`} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
                        <div className="flex flex-col items-center gap-2">
                          <Button type="button" className="admin-button-danger self-stretch" style={{height: 40}} onClick={() => {
                            setMassageServices(prev => prev.filter((_, i) => i !== idx));
                          }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button type="button" className="admin-button-secondary mt-2" onClick={() => {
                  setMassageServices(prev => [...prev, { img: `/assets/images/${massageServices.length + 1}.svg`, title: '', desc: '' }]);
                }}><Plus className="w-4 h-4 mr-2" /> เพิ่ม Massage Card</Button>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Facial Services</h4>
                {facialServices.map((card, idx) => {
                  const imgName = card.img.replace(/^.*[\\\/]/, '');
                  return (
                    <div key={idx} className={`flex items-stretch gap-4 mb-4 w-full pb-4 ${idx !== facialServices.length - 1 ? 'border-b-2 border-red-500' : ''}`}>
                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <Input id={`facialTitle${idx}`} defaultValue={card.title} placeholder="Title" className="admin-input mb-2 w-full" />
                        <Textarea id={`facialDesc${idx}`} defaultValue={card.desc} placeholder="Description" className="admin-textarea w-full" rows={2} />
                      </div>
                      <div className="flex flex-row items-center gap-4 min-w-[10px] mt-0">
                        <img src={`https://raw.githubusercontent.com/PtrwTg/Thainest/main/public/assets/images/${imgName}?${Date.now()}`} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
                        <div className="flex flex-col items-center gap-2">
                          <Button type="button" className="admin-button-danger self-stretch" style={{height: 40}} onClick={() => {
                            setFacialServices(prev => prev.filter((_, i) => i !== idx));
                          }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button type="button" className="admin-button-secondary mt-2" onClick={() => {
                  setFacialServices(prev => [...prev, { img: `/assets/images/${facialServices.length + 9}.svg`, title: '', desc: '' }]);
                }}><Plus className="w-4 h-4 mr-2" /> เพิ่ม Facial Card</Button>
              </div>
              <Button type="submit" className="admin-button-primary" disabled={loading.services}>
                {loading.services ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} บันทึก
              </Button>
              <StatusDisplay section="services" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;